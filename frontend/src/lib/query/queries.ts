import { categoriesApi } from "@/lib/api/categories";
import { productsApi } from "@/lib/api/products";
import type { ProductListParams } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";

/**
 * Query option factories shared by Server Components (prefetch) and client hooks.
 * They live outside the "use client" hook files so the server can call them.
 */
export function productListQuery(params: ProductListParams) {
  return {
    queryKey: queryKeys.products.list(params),
    queryFn: () => productsApi.list(params),
  };
}

export function productDetailQuery(slug: string) {
  return {
    queryKey: queryKeys.products.detail(slug),
    queryFn: () => productsApi.getBySlug(slug),
  };
}

export function categoriesQuery(flat: boolean) {
  return {
    queryKey: flat ? queryKeys.categories.flat() : queryKeys.categories.tree(),
    queryFn: () => categoriesApi.list(flat),
    staleTime: 5 * 60_000,
  };
}
