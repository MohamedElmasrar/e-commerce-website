import { apiClient } from "./client";
import type { PageResponse, ProductListParams, ProductResponse } from "./types";

export const productsApi = {
  list: (params: ProductListParams = {}, init?: RequestInit) =>
    apiClient.get<PageResponse<ProductResponse>>("/api/v1/products", {
      anonymous: true,
      query: { ...params },
      init,
    }),

  getBySlug: (slug: string, init?: RequestInit) =>
    apiClient.get<ProductResponse>(`/api/v1/products/${encodeURIComponent(slug)}`, { anonymous: true, init }),
};
