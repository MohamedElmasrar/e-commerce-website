import { getApiBaseUrl } from "./config";
import { ApiClientError } from "./errors";
import { tokenStore } from "./token-store";
import type { ApiErrorBody, AuthResponse } from "./types";

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, QueryValue>;
  body?: unknown;
  /** Skip the Authorization header (public endpoints, login, refresh). */
  anonymous?: boolean;
  signal?: AbortSignal;
  /** Extra init options, for example Next.js `next: { revalidate }` on the server. */
  init?: RequestInit;
}

export function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  });
  const qs = params.toString();
  return `${getApiBaseUrl()}${path}${qs ? `?${qs}` : ""}`;
}

async function parseError(response: Response): Promise<ApiClientError> {
  let body: Partial<ApiErrorBody> | null = null;
  try {
    body = (await response.json()) as Partial<ApiErrorBody>;
  } catch {
    body = null;
  }
  return new ApiClientError(response.status, body, response.statusText || undefined);
}

let refreshInFlight: Promise<string | null> | null = null;

/** Exchanges the refresh cookie for a new access token. Concurrent callers share one request. */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(buildUrl("/api/v1/auth/refresh"), {
          method: "POST",
          credentials: "include",
        });
        if (!response.ok) {
          tokenStore.set(null);
          return null;
        }
        const data = (await response.json()) as AuthResponse;
        tokenStore.set(data.accessToken);
        return data.accessToken;
      } catch {
        tokenStore.set(null);
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

async function send(path: string, options: RequestOptions, token: string | null): Promise<Response> {
  const headers = new Headers(options.init?.headers);
  headers.set("Accept", "application/json");
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !options.anonymous) headers.set("Authorization", `Bearer ${token}`);

  return fetch(buildUrl(path, options.query), {
    ...options.init,
    method: options.method ?? "GET",
    headers,
    credentials: "include",
    signal: options.signal,
    body:
      options.body === undefined
        ? undefined
        : options.body instanceof FormData
          ? options.body
          : JSON.stringify(options.body),
  });
}

/**
 * Typed JSON request. Attaches the bearer token, retries once after a 401 by refreshing the
 * access token, and throws ApiClientError for every failed response.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(path, options, tokenStore.get());

  if (response.status === 401 && !options.anonymous) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await send(path, options, refreshed);
    }
  }

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
