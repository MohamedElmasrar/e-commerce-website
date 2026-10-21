import { apiClient } from "./client";
import { tokenStore } from "./token-store";
import type {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  UserResponse,
} from "./types";

export const authApi = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const result = await apiClient.post<AuthResponse>("/api/v1/auth/login", payload, { anonymous: true });
    tokenStore.set(result.accessToken);
    return result;
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const result = await apiClient.post<AuthResponse>("/api/v1/auth/register", payload, { anonymous: true });
    tokenStore.set(result.accessToken);
    return result;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post<void>("/api/v1/auth/logout", undefined, { anonymous: true });
    } finally {
      tokenStore.set(null);
    }
  },

  me: () => apiClient.get<UserResponse>("/api/v1/auth/me"),

  getProfile: () => apiClient.get<UserResponse>("/api/v1/users/me"),
  updateProfile: (payload: UpdateProfileRequest) => apiClient.put<UserResponse>("/api/v1/users/me", payload),
  changePassword: (payload: ChangePasswordRequest) => apiClient.put<void>("/api/v1/users/me/password", payload),
};
