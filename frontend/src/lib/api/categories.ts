import { apiClient } from "./client";
import type { CategoryResponse } from "./types";

export const categoriesApi = {
  /** Nested tree by default, flat list with `flat: true`. */
  list: (flat = false, init?: RequestInit) =>
    apiClient.get<CategoryResponse[]>("/api/v1/categories", {
      anonymous: true,
      query: { flat },
      init,
    }),
};
