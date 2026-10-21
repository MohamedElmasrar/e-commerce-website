"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import type { ChangePasswordRequest, UpdateProfileRequest } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "./useAuth";

export function useProfile() {
  const { status } = useAuth();
  return useQuery({
    queryKey: queryKeys.profile.me(),
    queryFn: authApi.getProfile,
    enabled: status === "authenticated",
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => authApi.updateProfile(payload),
    meta: { silent: true },
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.profile.me(), user);
      setUser(user);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) => authApi.changePassword(payload),
    meta: { silent: true },
  });
}
