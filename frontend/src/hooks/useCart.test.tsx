import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cartApi } from "@/lib/api/cart";
import type { CartResponse } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";
import { useAddToCart, useClearCart, useRemoveCartItem, useUpdateCartItem } from "./useCart";

vi.mock("@/lib/api/cart", () => ({
  cartApi: { get: vi.fn(), addItem: vi.fn(), setQuantity: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
}));

const line = (productId: number, quantity: number, unitPrice = 10) => ({
  productId,
  slug: `p${productId}`,
  name: `P${productId}`,
  unitPrice,
  currency: "USD",
  quantity,
  lineTotal: unitPrice * quantity,
  canIncreaseQuantity: true,
});
const cart = (items: ReturnType<typeof line>[]): CartResponse => ({
  items,
  totalQuantity: items.reduce((n, i) => n + i.quantity, 0),
  subtotal: items.reduce((n, i) => n + i.lineTotal, 0),
  currency: "USD",
});

function setup(initial: CartResponse) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  client.setQueryData(queryKeys.cart.all, initial);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}

beforeEach(() => vi.clearAllMocks());

describe("optimistic cart mutations", () => {
  it("updates the cached cart before the request resolves", async () => {
    const initial = cart([line(1, 1), line(2, 2)]);
    const { client, wrapper } = setup(initial);
    let resolve!: (value: CartResponse) => void;
    vi.mocked(cartApi.setQuantity).mockReturnValue(new Promise((r) => (resolve = r)));
    vi.mocked(cartApi.get).mockResolvedValue(cart([line(1, 3), line(2, 2)]));
    const { result } = renderHook(() => useUpdateCartItem(), { wrapper });

    act(() => result.current.mutate({ productId: 1, quantity: 3 }));

    await waitFor(() => expect(client.getQueryData<CartResponse>(queryKeys.cart.all)?.totalQuantity).toBe(5));
    expect(client.getQueryData<CartResponse>(queryKeys.cart.all)?.subtotal).toBe(50);

    await act(async () => resolve(cart([line(1, 3), line(2, 2)])));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back to the snapshot when the request fails and invalidates the cart", async () => {
    const initial = cart([line(1, 1)]);
    const { client, wrapper } = setup(initial);
    const invalidate = vi.spyOn(client, "invalidateQueries");
    vi.mocked(cartApi.setQuantity).mockRejectedValue(new Error("Insufficient stock"));
    const { result } = renderHook(() => useUpdateCartItem(), { wrapper });

    await act(async () => {
      result.current.mutate({ productId: 1, quantity: 9 });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(queryKeys.cart.all)).toEqual(initial);
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.cart.all }));
  });

  it("removes a line optimistically and restores it on failure", async () => {
    const initial = cart([line(1, 1), line(2, 1)]);
    const { client, wrapper } = setup(initial);
    vi.mocked(cartApi.removeItem).mockRejectedValue(new Error("boom"));
    vi.mocked(cartApi.get).mockResolvedValue(initial);
    const { result } = renderHook(() => useRemoveCartItem(), { wrapper });

    await act(async () => {
      result.current.mutate(1);
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData<CartResponse>(queryKeys.cart.all)?.items).toHaveLength(2);
  });

  it("increments an existing line on add and keeps the cart unchanged for a new product", async () => {
    const { client, wrapper } = setup(cart([line(1, 1)]));
    let resolve!: (value: CartResponse) => void;
    vi.mocked(cartApi.addItem).mockReturnValue(new Promise((r) => (resolve = r)));
    vi.mocked(cartApi.get).mockResolvedValue(cart([line(1, 3)]));
    const { result } = renderHook(() => useAddToCart(), { wrapper });

    act(() => result.current.mutate({ productId: 1, quantity: 2 }));
    await waitFor(() => expect(client.getQueryData<CartResponse>(queryKeys.cart.all)?.totalQuantity).toBe(3));
    await act(async () => resolve(cart([line(1, 3)])));

    act(() => result.current.mutate({ productId: 99, quantity: 1 }));
    expect(client.getQueryData<CartResponse>(queryKeys.cart.all)?.items).toHaveLength(1);
  });

  it("clears the cart optimistically", async () => {
    const { client, wrapper } = setup(cart([line(1, 2)]));
    vi.mocked(cartApi.clear).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useClearCart(), { wrapper });

    act(() => result.current.mutate());

    await waitFor(() => expect(client.getQueryData<CartResponse>(queryKeys.cart.all)?.items).toEqual([]));
  });

  it("invalidates the cart query when the mutation settles", async () => {
    const { client, wrapper } = setup(cart([line(1, 1)]));
    const spy = vi.spyOn(client, "invalidateQueries");
    vi.mocked(cartApi.setQuantity).mockResolvedValue(cart([line(1, 2)]));
    vi.mocked(cartApi.get).mockResolvedValue(cart([line(1, 2)]));
    const { result } = renderHook(() => useUpdateCartItem(), { wrapper });

    await act(async () => {
      result.current.mutate({ productId: 1, quantity: 2 });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.cart.all });
  });
});
