"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api/orders";
import type { OrderResponse } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "./useAuth";

export function useOrders(page = 0, size = 10) {
  const { status } = useAuth();
  return useQuery({
    queryKey: queryKeys.orders.list(page, size),
    queryFn: () => ordersApi.list(page, size),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  });
}

interface UseOrderOptions {
  /** Poll while the callback returns a number of milliseconds; return false to stop. */
  refetchInterval?: (order: OrderResponse | undefined) => number | false;
  enabled?: boolean;
}

export function useOrder(id: number, options: UseOrderOptions = {}) {
  const { status } = useAuth();
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => ordersApi.get(id),
    enabled: status === "authenticated" && Number.isInteger(id) && id > 0 && options.enabled !== false,
    refetchInterval: options.refetchInterval ? (query) => options.refetchInterval!(query.state.data) : undefined,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ordersApi.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
  });
}
