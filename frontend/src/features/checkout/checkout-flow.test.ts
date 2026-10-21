import { beforeEach, describe, expect, it, vi } from "vitest";
import { ordersApi } from "@/lib/api/orders";
import { paymentsApi } from "@/lib/api/payments";
import type { OrderResponse, ShippingAddress } from "@/lib/api/types";
import { payForOrder, placeOrderAndPay } from "./checkout-flow";
import { emptyAddress, normalizeAddress, validateAddress } from "./validation";

vi.mock("@/lib/api/orders", () => ({ ordersApi: { checkout: vi.fn() } }));
vi.mock("@/lib/api/payments", () => ({ paymentsApi: { createCheckoutSession: vi.fn() } }));

const address: ShippingAddress = { name: "Ann", line1: "1 Main St", city: "Austin", postalCode: "78701", country: "US" };
const order = { id: 42, status: "PENDING_PAYMENT" } as OrderResponse;

beforeEach(() => vi.clearAllMocks());

describe("placeOrderAndPay", () => {
  it("creates the order, then the session for that order, then redirects to the Stripe url", async () => {
    vi.mocked(ordersApi.checkout).mockResolvedValue(order);
    vi.mocked(paymentsApi.createCheckoutSession).mockResolvedValue({ sessionId: "cs_1", url: "https://checkout.stripe.com/c/pay/cs_1" });
    const redirect = vi.fn();
    const remember = vi.fn();

    await placeOrderAndPay(address, { redirect, remember });

    expect(ordersApi.checkout).toHaveBeenCalledWith({ shippingAddress: address });
    expect(paymentsApi.createCheckoutSession).toHaveBeenCalledWith(42);
    expect(redirect).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/cs_1");
    expect(remember).toHaveBeenCalledWith(42);
  });

  it("sends no amounts or items from the client", async () => {
    vi.mocked(ordersApi.checkout).mockResolvedValue(order);
    vi.mocked(paymentsApi.createCheckoutSession).mockResolvedValue({ sessionId: "s", url: "https://x" });

    await placeOrderAndPay(address, { redirect: vi.fn(), remember: vi.fn() });

    expect(Object.keys(vi.mocked(ordersApi.checkout).mock.calls[0][0])).toEqual(["shippingAddress"]);
    expect(vi.mocked(paymentsApi.createCheckoutSession).mock.calls[0]).toEqual([42]);
  });

  it("does not redirect and does not create a session when the order fails", async () => {
    vi.mocked(ordersApi.checkout).mockRejectedValue(new Error("insufficient stock"));
    const redirect = vi.fn();

    await expect(placeOrderAndPay(address, { redirect, remember: vi.fn() })).rejects.toThrow("insufficient stock");

    expect(paymentsApi.createCheckoutSession).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("reports the saved order when the session cannot be created", async () => {
    vi.mocked(ordersApi.checkout).mockResolvedValue(order);
    vi.mocked(paymentsApi.createCheckoutSession).mockRejectedValue(new Error("stripe down"));
    const redirect = vi.fn();

    await expect(placeOrderAndPay(address, { redirect, remember: vi.fn() })).rejects.toMatchObject({
      name: "CheckoutSessionError",
      orderId: 42,
      cause: new Error("stripe down"),
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("payForOrder", () => {
  it("opens a session for an existing order", async () => {
    vi.mocked(paymentsApi.createCheckoutSession).mockResolvedValue({ sessionId: "s", url: "https://pay" });
    const redirect = vi.fn();
    await payForOrder(7, { redirect, remember: vi.fn() });
    expect(redirect).toHaveBeenCalledWith("https://pay");
  });
});

describe("address validation", () => {
  it("requires the mandatory fields", () => {
    const errors = validateAddress(emptyAddress);
    expect(Object.keys(errors).sort()).toEqual(["city", "country", "line1", "name", "postalCode"]);
  });

  it("accepts a complete address and rejects a long country name", () => {
    expect(validateAddress(address)).toEqual({});
    expect(validateAddress({ ...address, country: "Germany" }).country).toMatch(/2-letter/);
  });

  it("normalizes whitespace, case and empty optionals", () => {
    expect(normalizeAddress({ ...address, name: " Ann ", country: "us", line2: " ", state: "" })).toMatchObject({
      name: "Ann",
      country: "US",
      line2: null,
      state: null,
    });
  });
});
