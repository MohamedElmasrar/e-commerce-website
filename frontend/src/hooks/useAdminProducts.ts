"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import type { ProductListParams, ProductRequest, AdminProductResponse } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";

export function useAdminProducts(params: ProductListParams) {
  return useQuery({
    queryKey: queryKeys.admin.products.list(params),
    queryFn: () => adminApi.products.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminProduct(id: number | null) {
  return useQuery({
    queryKey: queryKeys.admin.products.detail(id ?? 0),
    queryFn: () => adminApi.products.get(id as number),
    enabled: id !== null,
  });
}

/** Products appear in the admin lists, the public catalog and the inventory, so all of them are refreshed. */
function useInvalidateCatalog() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.products.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.inventory.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
    ]);
}

export function useCreateProduct() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (payload: ProductRequest) => adminApi.products.create(payload),
    meta: { silent: true },
    onSuccess: invalidate,
  });
}

export function useUpdateProduct(id: number) {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (payload: ProductRequest) => adminApi.products.update(id, payload),
    meta: { silent: true },
    onSuccess: invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (id: number) => adminApi.products.remove(id),
    onSuccess: invalidate,
  });
}

/** Active toggle from the list: the update endpoint takes the whole product, so it is rebuilt from the row. */
export function productToRequest(product: AdminProductResponse, overrides: Partial<ProductRequest> = {}): ProductRequest {
  return {
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: product.price,
    currency: product.currency,
    categoryId: product.category?.id as number,
    active: product.active,
    ...overrides,
  };
}

export function useToggleProductActive() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (product: AdminProductResponse) =>
      adminApi.products.update(product.id, productToRequest(product, { active: !product.active })),
    onMutate: async (product) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.products.all });
      const snapshots = queryClient.getQueriesData<{ content: AdminProductResponse[] }>({ queryKey: queryKeys.admin.products.all });
      queryClient.setQueriesData<{ content: AdminProductResponse[] }>({ queryKey: queryKeys.admin.products.all }, (old) =>
        old && Array.isArray(old.content)
          ? { ...old, content: old.content.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p)) }
          : old,
      );
      return { snapshots };
    },
    onError: (_error, _product, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: invalidate,
  });
}

export function useUploadProductImage(id: number) {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (file: File) => adminApi.products.addImage(id, file),
    meta: { silent: true },
    onSuccess: invalidate,
  });
}

export function useDeleteProductImage(id: number) {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (imageId: number) => adminApi.products.deleteImage(id, imageId),
    onSuccess: invalidate,
  });
}
