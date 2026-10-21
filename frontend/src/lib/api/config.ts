/**
 * Browser calls use NEXT_PUBLIC_API_URL (empty means same-origin through the Next.js rewrite).
 * Server Components call the backend directly through API_URL.
 */
export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env.API_URL ?? "http://localhost:8080";
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "";
}
