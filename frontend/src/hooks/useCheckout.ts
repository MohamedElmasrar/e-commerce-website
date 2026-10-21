"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { payForOrder, placeOrderAndPay } from "@/features/checkout/checkout-flow";
import type { ShippingAddress } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";

function redirectToStripe(url: string) {
  window.location.assign(url);
}

/** Order creation plus the Stripe redirect. Cart and orders are refreshed whatever the outcome. */
export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (address: ShippingAddress) => placeOrderAndPay(address, { redirect: redirectToStripe }),
    meta: { silent: true },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

/** Pay-now / retry for an order that is still PENDING_PAYMENT. */
export function usePayOrder() {
  return useMutation({
    mutationFn: (orderId: number) => payForOrder(orderId, { redirect: redirectToStripe }),
  });
}
