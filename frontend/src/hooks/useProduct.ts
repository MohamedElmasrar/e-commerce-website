"use client";

import { useQuery } from "@tanstack/react-query";
import { productDetailQuery } from "@/lib/query/queries";

export function useProduct(slug: string) {
  return useQuery(productDetailQuery(slug));
}
