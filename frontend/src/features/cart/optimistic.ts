import type { CartItem, CartResponse } from "@/lib/api/types";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Recomputes the totals from the items. Only used for the optimistic preview; the server response replaces it. */
export function withTotals(cart: CartResponse, items: CartItem[]): CartResponse {
  const normalized = items.map((item) => ({ ...item, lineTotal: round2(item.unitPrice * item.quantity) }));
  return {
    ...cart,
    items: normalized,
    totalQuantity: normalized.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: round2(normalized.reduce((sum, item) => sum + item.lineTotal, 0)),
  };
}

/** Adds to an existing line. A product that is not in the cart yet cannot be previewed (no name or price). */
export function previewAdd(cart: CartResponse, productId: number, quantity: number): CartResponse {
  if (!cart.items.some((item) => item.productId === productId)) return cart;
  return withTotals(
    cart,
    cart.items.map((item) => (item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item)),
  );
}

export function previewSetQuantity(cart: CartResponse, productId: number, quantity: number): CartResponse {
  if (quantity <= 0) return previewRemove(cart, productId);
  return withTotals(
    cart,
    cart.items.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
  );
}

export function previewRemove(cart: CartResponse, productId: number): CartResponse {
  return withTotals(
    cart,
    cart.items.filter((item) => item.productId !== productId),
  );
}

export function previewClear(cart: CartResponse): CartResponse {
  return withTotals(cart, []);
}
