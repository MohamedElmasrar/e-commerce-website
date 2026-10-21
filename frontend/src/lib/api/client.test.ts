import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./client";
import { ApiClientError } from "./errors";
import { tokenStore } from "./token-store";

const fetchMock = vi.fn<typeof fetch>();

function json(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function authHeader(call: number): string | null {
  const init = fetchMock.mock.calls[call][1];
  return new Headers(init?.headers).get("Authorization");
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  tokenStore.set(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiClient", () => {
  it("attaches the bearer token", async () => {
    tokenStore.set("token-1");
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }));

    const result = await apiClient.get<{ ok: boolean }>("/api/v1/cart");

    expect(result).toEqual({ ok: true });
    expect(authHeader(0)).toBe("Bearer token-1");
  });

  it("omits the token for anonymous requests and builds the query string", async () => {
    tokenStore.set("token-1");
    fetchMock.mockResolvedValueOnce(json(200, []));

    await apiClient.get("/api/v1/products", { anonymous: true, query: { q: "tea", page: 2, empty: "", none: undefined } });

    expect(authHeader(0)).toBeNull();
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/v1\/products\?q=tea&page=2$/);
  });

  it("sends JSON bodies", async () => {
    fetchMock.mockResolvedValueOnce(json(200, {}));
    await apiClient.post("/api/v1/cart/items", { productId: 1, quantity: 2 });
    const init = fetchMock.mock.calls[0][1];
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ productId: 1, quantity: 2 }));
    expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
  });

  it("refreshes once after a 401 and retries with the new token", async () => {
    tokenStore.set("expired");
    fetchMock
      .mockResolvedValueOnce(json(401, { status: 401, message: "Token expired" }))
      .mockResolvedValueOnce(json(200, { accessToken: "fresh", user: { id: 1 } }))
      .mockResolvedValueOnce(json(200, { items: [] }));

    const result = await apiClient.get("/api/v1/cart");

    expect(result).toEqual({ items: [] });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[1][0])).toContain("/api/v1/auth/refresh");
    expect(authHeader(0)).toBe("Bearer expired");
    expect(authHeader(2)).toBe("Bearer fresh");
    expect(tokenStore.get()).toBe("fresh");
  });

  it("does not loop when the retry is also unauthorized", async () => {
    tokenStore.set("expired");
    fetchMock
      .mockResolvedValueOnce(json(401, { status: 401, message: "no" }))
      .mockResolvedValueOnce(json(200, { accessToken: "fresh" }))
      .mockResolvedValueOnce(json(401, { status: 401, message: "still no" }));

    await expect(apiClient.get("/api/v1/cart")).rejects.toMatchObject({ status: 401, message: "still no" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("clears the token when the refresh fails", async () => {
    tokenStore.set("expired");
    fetchMock
      .mockResolvedValueOnce(json(401, { status: 401, message: "expired" }))
      .mockResolvedValueOnce(json(401, { status: 401, message: "no refresh cookie" }));

    await expect(apiClient.get("/api/v1/cart")).rejects.toBeInstanceOf(ApiClientError);
    expect(tokenStore.get()).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shares one refresh between concurrent 401s", async () => {
    tokenStore.set("expired");
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes("/auth/refresh")) return json(200, { accessToken: "fresh" });
      return new Headers(init?.headers).get("Authorization") === "Bearer fresh" ? json(200, {}) : json(401, { status: 401 });
    });

    await Promise.all([apiClient.get("/api/v1/cart"), apiClient.get("/api/v1/orders")]);

    const refreshCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes("/auth/refresh"));
    expect(refreshCalls).toHaveLength(1);
  });

  it("does not try to refresh anonymous requests", async () => {
    fetchMock.mockResolvedValueOnce(json(401, { status: 401, message: "Bad credentials" }));
    await expect(apiClient.post("/api/v1/auth/login", {}, { anonymous: true })).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("parses the backend error body", async () => {
    fetchMock.mockResolvedValueOnce(
      json(400, {
        status: 400,
        error: "Bad Request",
        message: "Validation failed",
        path: "/api/v1/auth/register",
        requestId: "req-1",
        fieldErrors: [{ field: "email", message: "must be a well-formed email address" }],
      }),
    );

    const error = (await apiClient.post("/api/v1/auth/register", {}, { anonymous: true }).catch((e: unknown) => e)) as ApiClientError;

    expect(error).toBeInstanceOf(ApiClientError);
    expect(error.status).toBe(400);
    expect(error.message).toBe("Validation failed");
    expect(error.requestId).toBe("req-1");
    expect(error.fieldMessage("email")).toBe("must be a well-formed email address");
    expect(error.fieldMessage("password")).toBeUndefined();
  });

  it("falls back to a generic error when the body is not JSON", async () => {
    fetchMock.mockResolvedValueOnce(new Response("<html>bad gateway</html>", { status: 502, statusText: "Bad Gateway" }));
    await expect(apiClient.get("/api/v1/products", { anonymous: true })).rejects.toMatchObject({
      status: 502,
      message: "Bad Gateway",
      fieldErrors: [],
    });
  });

  it("returns undefined for 204 responses", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(apiClient.delete("/api/v1/cart/items/1")).resolves.toBeUndefined();
  });
});
