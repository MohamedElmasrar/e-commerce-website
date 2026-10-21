"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { PageResponse, ProductListParams, ProductResponse } from "@/lib/api/types";
import { productListQuery } from "@/lib/query/queries";

export function useProducts(params: ProductListParams, initialData?: PageResponse<ProductResponse>) {
  return useQuery({
    ...productListQuery(params),
    initialData,
    placeholderData: keepPreviousData,
  });
}
