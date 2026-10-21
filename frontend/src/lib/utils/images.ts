import { getApiBaseUrl } from "@/lib/api/config";
import type { ProductImage } from "@/lib/api/types";

const PLACEHOLDERS = [
  "/dist/images/food-beverage-1.jpg",
  "/dist/images/food-beverage-2.jpg",
  "/dist/images/food-beverage-3.jpg",
  "/dist/images/food-beverage-4.jpg",
  "/dist/images/food-beverage-5.jpg",
  "/dist/images/food-beverage-6.jpg",
  "/dist/images/food-beverage-7.jpg",
  "/dist/images/food-beverage-8.jpg",
];

/** Stable placeholder for products without an image, chosen from the product id. */
export function placeholderImage(seed: number): string {
  return PLACEHOLDERS[Math.abs(seed) % PLACEHOLDERS.length];
}

/** Backend image URLs are relative (/api/v1/products/images/{key}); the browser loads them through the proxy. */
export function resolveImageUrl(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  return `${typeof window === "undefined" ? "" : getApiBaseUrl()}${url}`;
}

export function productImageUrls(images: ProductImage[], seed: number): string[] {
  if (images.length === 0) return [placeholderImage(seed)];
  return [...images].sort((a, b) => a.position - b.position).map((image) => resolveImageUrl(image.url));
}
