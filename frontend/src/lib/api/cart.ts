import { apiClient } from "./client";
import type { CartResponse } from "./types";

export const MAX_CART_ITEM_QUANTITY = 999;

export const cartApi = {
  get: () => apiClient.get<CartResponse>("/api/v1/cart"),
  addItem: (productId: number, quantity: number) =>
    apiClient.post<CartResponse>("/api/v1/cart/items", { productId, quantity }),
  setQuantity: (productId: number, quantity: number) =>
    apiClient.put<CartResponse>(`/api/v1/cart/items/${productId}`, { quantity }),
  removeItem: (productId: number) => apiClient.delete<CartResponse>(`/api/v1/cart/items/${productId}`),
  clear: () => apiClient.delete<CartResponse>("/api/v1/cart"),
};
