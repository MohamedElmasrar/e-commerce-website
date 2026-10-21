"use client";

import { useQuery } from "@tanstack/react-query";
import { categoriesQuery } from "@/lib/query/queries";

export function useCategories(flat = false) {
  return useQuery(categoriesQuery(flat));
}
