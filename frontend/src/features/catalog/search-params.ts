import type { ProductListParams } from "@/lib/api/types";

export const PAGE_SIZE = 12;
export const DEFAULT_SORT = "createdAt,desc";

export const SORT_OPTIONS = [
  { value: "createdAt,desc", label: "Newest" },
  { value: "price,asc", label: "Price: low to high" },
  { value: "price,desc", label: "Price: high to low" },
  { value: "name,asc", label: "Name: A to Z" },
  { value: "name,desc", label: "Name: Z to A" },
] as const;

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Reads the catalog state from the URL. Invalid values fall back to defaults. */
export function parseProductSearchParams(raw: RawSearchParams): ProductListParams {
  const pageNumber = Number.parseInt(first(raw.page) ?? "", 10);
  const sort = first(raw.sort);
  const q = first(raw.q)?.trim();
  const category = first(raw.category)?.trim();
  return {
    page: Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber - 1 : 0,
    size: PAGE_SIZE,
    sort: SORT_OPTIONS.some((option) => option.value === sort) ? sort : DEFAULT_SORT,
    ...(q ? { q } : {}),
    ...(category ? { category } : {}),
  };
}

/** Builds the URL for a catalog state. The page is one-based in the URL and zero-based in the API. */
export function buildProductsHref(params: ProductListParams, basePath = "/products"): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.sort && params.sort !== DEFAULT_SORT) search.set("sort", params.sort);
  if (params.page && params.page > 0) search.set("page", String(params.page + 1));
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
