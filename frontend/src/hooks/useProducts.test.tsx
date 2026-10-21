import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/errors";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import type { PageResponse, ProductResponse } from "@/lib/api/types";
import { shouldRetry } from "@/lib/query/query-client";
import { useCategories } from "./useCategories";
import { useProduct } from "./useProduct";
import { useProducts } from "./useProducts";

vi.mock("@/lib/api/products", () => ({ productsApi: { list: vi.fn(), getBySlug: vi.fn() } }));
vi.mock("@/lib/api/categories", () => ({ categoriesApi: { list: vi.fn() } }));

const product = { id: 1, slug: "tea", name: "Tea", price: 3, currency: "USD" } as ProductResponse;
const page: PageResponse<ProductResponse> = { content: [product], page: 0, size: 12, totalElements: 1, totalPages: 1 };

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => vi.clearAllMocks());

describe("catalog hooks", () => {
  it("useProducts passes the params to the client", async () => {
    vi.mocked(productsApi.list).mockResolvedValue(page);
    const params = { page: 1, size: 12, sort: "price,asc", q: "tea" };

    const { result } = renderHook(() => useProducts(params), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(productsApi.list).toHaveBeenCalledWith(params);
    expect(result.current.data).toEqual(page);
  });

  it("useProduct loads one product by slug", async () => {
    vi.mocked(productsApi.getBySlug).mockResolvedValue(product);
    const { result } = renderHook(() => useProduct("tea"), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.data).toEqual(product));
    expect(productsApi.getBySlug).toHaveBeenCalledWith("tea");
  });

  it("surfaces typed errors", async () => {
    vi.mocked(productsApi.getBySlug).mockRejectedValue(new ApiClientError(404, { message: "Product not found" }));
    const { result } = renderHook(() => useProduct("missing"), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiClientError);
    expect((result.current.error as ApiClientError).isNotFound).toBe(true);
  });

  it("useCategories requests the flat list when asked", async () => {
    vi.mocked(categoriesApi.list).mockResolvedValue([]);
    const { result } = renderHook(() => useCategories(true), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(categoriesApi.list).toHaveBeenCalledWith(true);
  });
});

describe("retry policy", () => {
  it("does not retry client errors but retries transient ones twice", () => {
    expect(shouldRetry(0, new ApiClientError(404))).toBe(false);
    expect(shouldRetry(0, new ApiClientError(401))).toBe(false);
    expect(shouldRetry(0, new ApiClientError(503))).toBe(true);
    expect(shouldRetry(1, new Error("network"))).toBe(true);
    expect(shouldRetry(2, new Error("network"))).toBe(false);
  });
});
