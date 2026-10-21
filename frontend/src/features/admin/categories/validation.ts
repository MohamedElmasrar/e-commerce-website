import type { CategoryRequest } from "@/lib/api/types";

export type CategoryField = "name" | "slug" | "description" | "parentId";
export const CATEGORY_FIELDS: readonly CategoryField[] = ["name", "slug", "description", "parentId"];
export type CategoryErrors = Partial<Record<CategoryField, string>>;

export interface CategoryFormValues {
  name: string;
  slug: string;
  description: string;
  parentId: string;
}

export const emptyCategoryForm: CategoryFormValues = { name: "", slug: "", description: "", parentId: "" };

/** Suggests a URL slug from a name, the same shape the backend accepts. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

export function validateCategoryForm(values: CategoryFormValues): CategoryErrors {
  const errors: CategoryErrors = {};
  if (!values.name.trim()) errors.name = "Name is required";
  else if (values.name.trim().length > 120) errors.name = "Name must be at most 120 characters";
  if (!values.slug.trim()) errors.slug = "Slug is required";
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(values.slug.trim())) errors.slug = "Use lowercase letters, digits and hyphens";
  else if (values.slug.trim().length > 140) errors.slug = "Slug must be at most 140 characters";
  if (values.description.length > 2000) errors.description = "Description must be at most 2000 characters";
  return errors;
}

export function toCategoryRequest(values: CategoryFormValues): CategoryRequest {
  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    description: values.description.trim() || null,
    parentId: values.parentId ? Number(values.parentId) : null,
  };
}
