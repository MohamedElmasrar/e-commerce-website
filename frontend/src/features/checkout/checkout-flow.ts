import { ordersApi } from "@/lib/api/orders";
import { paymentsApi } from "@/lib/api/payments";
import type { OrderResponse, ShippingAddress } from "@/lib/api/types";

const PENDING_ORDER_KEY = "checkout.pendingOrderId";

export interface CheckoutDeps {
  /** Sends the browser to the Stripe-hosted page. */
  redirect: (url: string) => void;
  remember?: (orderId: number) => void;
}

export class CheckoutSessionError extends Error {
  constructor(readonly orderId: number, cause: unknown) {
    super("Could not open the payment page.", { cause });
    this.name = "CheckoutSessionError";
  }
}

/** Remembers the order across the Stripe redirect, because the success and cancel URLs carry no order id. */
export function rememberPendingOrder(orderId: number): void {
  try {
    window.sessionStorage.setItem(PENDING_ORDER_KEY, String(orderId));
  } catch {
    // Storage can be unavailable (private mode); the pages then fall back to the order list.
  }
}

export function readPendingOrder(): number | null {
  try {
    const value = Number(window.sessionStorage.getItem(PENDING_ORDER_KEY));
    return Number.isInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

/** Starts the Stripe Checkout redirect for an existing order. The server computes every amount. */
export async function payForOrder(orderId: number, deps: CheckoutDeps): Promise<void> {
  const session = await paymentsApi.createCheckoutSession(orderId);
  (deps.remember ?? rememberPendingOrder)(orderId);
  deps.redirect(session.url);
}

/**
 * Creates the order from the server-side cart (the request carries only the address),
 * then opens a Stripe Checkout session for it and redirects.
 * If the session cannot be created the order stays PENDING_PAYMENT and can be paid from the order page.
 */
export async function placeOrderAndPay(address: ShippingAddress, deps: CheckoutDeps): Promise<OrderResponse> {
  const order = await ordersApi.checkout({ shippingAddress: address });
  try {
    await payForOrder(order.id, deps);
  } catch (error) {
    throw new CheckoutSessionError(order.id, error);
  }
  return order;
}
