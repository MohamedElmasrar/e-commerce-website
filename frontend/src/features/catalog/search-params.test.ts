import { describe, expect, it } from "vitest";
import { buildProductsHref, parseProductSearchParams } from "./search-params";

describe("catalog search params", () => {
  it("falls back to defaults", () => {
    expect(parseProductSearchParams({})).toEqual({ page: 0, size: 12, sort: "createdAt,desc" });
  });

  it("converts the one-based URL page to a zero-based API page", () => {
    expect(parseProductSearchParams({ page: "3" }).page).toBe(2);
    expect(parseProductSearchParams({ page: "-4" }).page).toBe(0);
    expect(parseProductSearchParams({ page: "abc" }).page).toBe(0);
  });

  it("rejects sorts that are not offered", () => {
    expect(parseProductSearchParams({ sort: "id,desc" }).sort).toBe("createdAt,desc");
    expect(parseProductSearchParams({ sort: "price,asc" }).sort).toBe("price,asc");
  });

  it("keeps search term and category", () => {
    expect(parseProductSearchParams({ q: " tea ", category: "drinks" })).toMatchObject({ q: "tea", category: "drinks" });
  });

  it("builds compact hrefs", () => {
    expect(buildProductsHref({ page: 0, sort: "createdAt,desc" })).toBe("/products");
    expect(buildProductsHref({ page: 1, q: "tea", category: "drinks", sort: "price,asc" })).toBe(
      "/products?q=tea&category=drinks&sort=price%2Casc&page=2",
    );
  });
});
