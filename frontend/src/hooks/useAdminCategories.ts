"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import type { CategoryRequest } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";

function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.products.all }),
    ]);
}

export function useSaveCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | null; payload: CategoryRequest }) =>
      id === null ? adminApi.categories.create(payload) : adminApi.categories.update(id, payload),
    meta: { silent: true },
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (id: number) => adminApi.categories.remove(id),
    onSuccess: invalidate,
  });
}
