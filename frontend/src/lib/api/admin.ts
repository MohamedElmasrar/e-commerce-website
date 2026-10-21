import { apiClient } from "./client";
import type {
  AdminProductResponse,
  AdjustStockRequest,
  CategoryRequest,
  CategoryResponse,
  DashboardStats,
  InventoryResponse,
  OrderResponse,
  OrderStatus,
  PageResponse,
  ProductListParams,
  ProductRequest,
} from "./types";

/** Admin endpoints, used by the (admin) route group. The backend enforces ROLE_ADMIN on all of them. */
export const adminApi = {
  dashboard: () => apiClient.get<DashboardStats>("/api/v1/admin/dashboard/stats"),

  products: {
    list: (params: ProductListParams = {}) =>
      apiClient.get<PageResponse<AdminProductResponse>>("/api/v1/admin/products", { query: { ...params } }),
    get: (id: number) => apiClient.get<AdminProductResponse>(`/api/v1/admin/products/${id}`),
    create: (payload: ProductRequest) => apiClient.post<AdminProductResponse>("/api/v1/admin/products", payload),
    update: (id: number, payload: ProductRequest) =>
      apiClient.put<AdminProductResponse>(`/api/v1/admin/products/${id}`, payload),
    remove: (id: number) => apiClient.delete<void>(`/api/v1/admin/products/${id}`),
    addImage: (id: number, file: File) => {
      const form = new FormData();
      form.append("file", file);
      return apiClient.post<AdminProductResponse>(`/api/v1/admin/products/${id}/images`, form);
    },
    deleteImage: (id: number, imageId: number) =>
      apiClient.delete<AdminProductResponse>(`/api/v1/admin/products/${id}/images/${imageId}`),
    reorderImages: (id: number, imageIds: number[]) =>
      apiClient.put<AdminProductResponse>(`/api/v1/admin/products/${id}/images/order`, { imageIds }),
  },

  categories: {
    create: (payload: CategoryRequest) => apiClient.post<CategoryResponse>("/api/v1/admin/categories", payload),
    update: (id: number, payload: CategoryRequest) =>
      apiClient.put<CategoryResponse>(`/api/v1/admin/categories/${id}`, payload),
    remove: (id: number) => apiClient.delete<void>(`/api/v1/admin/categories/${id}`),
  },

  orders: {
    list: (status?: OrderStatus, page = 0, size = 20) =>
      apiClient.get<PageResponse<OrderResponse>>("/api/v1/admin/orders", { query: { status, page, size } }),
    get: (id: number) => apiClient.get<OrderResponse>(`/api/v1/admin/orders/${id}`),
    updateStatus: (id: number, status: OrderStatus) =>
      apiClient.patch<OrderResponse>(`/api/v1/admin/orders/${id}/status`, { status }),
  },

  inventory: {
    list: (page = 0, size = 20, lowStock = false) =>
      apiClient.get<PageResponse<InventoryResponse>>("/api/v1/admin/inventory", { query: { page, size, lowStock } }),
    adjust: (productId: number, payload: AdjustStockRequest) =>
      apiClient.post<InventoryResponse>(`/api/v1/admin/inventory/${productId}/adjust`, payload),
  },
};
