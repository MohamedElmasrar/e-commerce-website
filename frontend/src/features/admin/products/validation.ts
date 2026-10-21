import type { ProductRequest } from "@/lib/api/types";

export type ProductField = "sku" | "slug" | "name" | "description" | "price" | "currency" | "categoryId" | "initialStock";
export const PRODUCT_FIELDS: readonly ProductField[] = ["sku", "slug", "name", "description", "price", "currency", "categoryId", "initialStock"];
export type ProductErrors = Partial<Record<ProductField, string>>;

/** The form keeps every value as text; it is converted by toProductRequest after validation. */
export interface ProductFormValues {
  sku: string;
  slug: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  categoryId: string;
  active: boolean;
  initialStock: string;
}

export const emptyProductForm: ProductFormValues = {
  sku: "",
  slug: "",
  name: "",
  description: "",
  price: "",
  currency: "USD",
  categoryId: "",
  active: true,
  initialStock: "0",
};

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PRICE = /^\d{1,10}(\.\d{1,2})?$/;

export function validateProductForm(values: ProductFormValues, mode: "create" | "edit"): ProductErrors {
  const errors: ProductErrors = {};
  if (!values.sku.trim()) errors.sku = "SKU is required";
  else if (values.sku.trim().length > 64) errors.sku = "SKU must be at most 64 characters";
  if (values.slug.trim() && !SLUG.test(values.slug.trim())) errors.slug = "Use lowercase letters, digits and hyphens";
  else if (values.slug.trim().length > 220) errors.slug = "Slug must be at most 220 characters";
  if (!values.name.trim()) errors.name = "Name is required";
  else if (values.name.trim().length > 200) errors.name = "Name must be at most 200 characters";
  if (values.description.length > 10000) errors.description = "Description must be at most 10000 characters";
  if (!values.price.trim()) errors.price = "Price is required";
  else if (!PRICE.test(values.price.trim())) errors.price = "Enter an amount with up to 2 decimals";
  if (!/^[A-Z]{3}$/.test(values.currency.trim())) errors.currency = "Use a 3-letter uppercase currency code";
  if (!values.categoryId) errors.categoryId = "Choose a category";
  if (mode === "create" && values.initialStock.trim() !== "" && !/^\d+$/.test(values.initialStock.trim())) {
    errors.initialStock = "Stock must be a whole number, 0 or more";
  }
  return errors;
}

export function toProductRequest(values: ProductFormValues, mode: "create" | "edit"): ProductRequest {
  return {
    sku: values.sku.trim(),
    slug: values.slug.trim() || null,
    name: values.name.trim(),
    description: values.description.trim() || null,
    price: Number(values.price.trim()),
    currency: values.currency.trim(),
    categoryId: Number(values.categoryId),
    active: values.active,
    ...(mode === "create" ? { initialStock: Number(values.initialStock.trim() || "0") } : {}),
  };
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Client side pre-check; the backend validates the real file content again. */
export function validateImageFile(file: { type: string; size: number; name: string }): string | undefined {
  if (!IMAGE_TYPES.includes(file.type)) return `${file.name}: only JPEG, PNG and WebP images are allowed`;
  if (file.size > MAX_IMAGE_BYTES) return `${file.name}: the image must be 5 MB or smaller`;
  if (file.size === 0) return `${file.name}: the file is empty`;
  return undefined;
}
