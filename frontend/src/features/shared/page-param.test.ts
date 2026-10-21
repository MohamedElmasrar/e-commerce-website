import { describe, expect, it } from "vitest";
import { pageHref, parsePageParam } from "./page-param";

describe("page param", () => {
  it("converts one-based URL pages to zero-based", () => {
    expect(parsePageParam("3")).toBe(2);
    expect(parsePageParam(undefined)).toBe(0);
    expect(parsePageParam("0")).toBe(0);
    expect(parsePageParam("abc")).toBe(0);
  });
  it("builds links", () => {
    expect(pageHref("/orders", 0)).toBe("/orders");
    expect(pageHref("/orders", 2)).toBe("/orders?page=3");
    expect(pageHref("/admin/orders", 1, { status: "PAID" })).toBe("/admin/orders?status=PAID&page=2");
  });
});
