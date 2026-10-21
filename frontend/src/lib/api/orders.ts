import { apiClient } from "./client";
import type { CheckoutRequest, OrderResponse, PageResponse } from "./types";

export const ordersApi = {
  checkout: (payload: CheckoutRequest) => apiClient.post<OrderResponse>("/api/v1/orders", payload),
  list: (page = 0, size = 10) =>
    apiClient.get<PageResponse<OrderResponse>>("/api/v1/orders", { query: { page, size } }),
  get: (id: number) => apiClient.get<OrderResponse>(`/api/v1/orders/${id}`),
  cancel: (id: number) => apiClient.post<OrderResponse>(`/api/v1/orders/${id}/cancel`),
};
