import { apiClient } from "./client";
import type { CheckoutSessionResponse, PaymentResponse } from "./types";

export const paymentsApi = {
  createCheckoutSession: (orderId: number) =>
    apiClient.post<CheckoutSessionResponse>(`/api/v1/payments/checkout-session/${orderId}`),
  statusForOrder: (orderId: number) => apiClient.get<PaymentResponse[]>(`/api/v1/payments/order/${orderId}`),
};
