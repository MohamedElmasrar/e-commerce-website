"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import type { OrderStatus } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";

export function useAdminOrders(status: OrderStatus | undefined, page: number, size: number) {
  return useQuery({
    queryKey: queryKeys.admin.orders.list(status, page, size),
    queryFn: () => adminApi.orders.list(status, page, size),
    placeholderData: keepPreviousData,
  });
}

export function useAdminOrder(id: number) {
  return useQuery({
    queryKey: queryKeys.admin.orders.detail(id),
    queryFn: () => adminApi.orders.get(id),
  });
}

export function useUpdateOrderStatus(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: OrderStatus) => adminApi.orders.updateStatus(id, status),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.admin.orders.detail(id), order);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.inventory.all }),
      ]);
    },
  });
}
