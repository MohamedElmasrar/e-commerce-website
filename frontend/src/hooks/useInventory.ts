"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import type { AdjustStockRequest } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";

export function useInventory(page: number, size: number, lowStock: boolean) {
  return useQuery({
    queryKey: queryKeys.admin.inventory.list(page, size, lowStock),
    queryFn: () => adminApi.inventory.list(page, size, lowStock),
    placeholderData: keepPreviousData,
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: number; payload: AdjustStockRequest }) =>
      adminApi.inventory.adjust(productId, payload),
    meta: { silent: true },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.inventory.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.products.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
      ]),
  });
}
