"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { queryKeys } from "@/lib/query-keys";

export function useDashboardStats() {
  return useQuery({ queryKey: queryKeys.admin.dashboard(), queryFn: adminApi.dashboard, staleTime: 30_000 });
}
