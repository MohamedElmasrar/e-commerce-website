import type { ProductListParams } from "@/lib/api/types";

/** Central factory so every query and invalidation uses the same keys. */
export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: () => ["auth", "me"] as const,
  },
  profile: {
    all: ["profile"] as const,
    me: () => ["profile", "me"] as const,
  },
  products: {
    all: ["products"] as const,
    lists: () => ["products", "list"] as const,
    list: (params: ProductListParams) => ["products", "list", params] as const,
    detail: (slug: string) => ["products", "detail", slug] as const,
  },
  categories: {
    all: ["categories"] as const,
    tree: () => ["categories", "tree"] as const,
    flat: () => ["categories", "flat"] as const,
  },
  cart: {
    all: ["cart"] as const,
  },
  orders: {
    all: ["orders"] as const,
    list: (page: number, size: number) => ["orders", "list", page, size] as const,
    detail: (id: number) => ["orders", "detail", id] as const,
  },
  admin: {
    all: ["admin"] as const,
    dashboard: () => ["admin", "dashboard"] as const,
    products: {
      all: ["admin", "products"] as const,
      list: (params: unknown) => ["admin", "products", "list", params] as const,
      detail: (id: number) => ["admin", "products", "detail", id] as const,
    },
    orders: {
      all: ["admin", "orders"] as const,
      list: (status: string | undefined, page: number, size: number) =>
        ["admin", "orders", "list", status ?? "ALL", page, size] as const,
      detail: (id: number) => ["admin", "orders", "detail", id] as const,
    },
    inventory: {
      all: ["admin", "inventory"] as const,
      list: (page: number, size: number, lowStock: boolean) => ["admin", "inventory", "list", page, size, lowStock] as const,
    },
  },
} as const;
