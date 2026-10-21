import { describe, expect, it } from "vitest";
import { emptyProductForm, toProductRequest, validateImageFile, validateProductForm } from "./validation";

const valid = { ...emptyProductForm, sku: "TEA-1", name: "Tea", price: "3.50", categoryId: "2" };

describe("product form", () => {
  it("requires sku, name, price and category", () => {
    expect(Object.keys(validateProductForm(emptyProductForm, "create")).sort()).toEqual(["categoryId", "name", "price", "sku"]);
  });
  it("accepts a valid form and builds the request", () => {
    expect(validateProductForm(valid, "create")).toEqual({});
    expect(toProductRequest({ ...valid, initialStock: "5" }, "create")).toMatchObject({ price: 3.5, categoryId: 2, slug: null, initialStock: 5 });
    expect(toProductRequest(valid, "edit")).not.toHaveProperty("initialStock");
  });
  it("rejects bad price, slug and currency", () => {
    const errors = validateProductForm({ ...valid, price: "1.999", slug: "Bad Slug", currency: "usd" }, "edit");
    expect(Object.keys(errors).sort()).toEqual(["currency", "price", "slug"]);
  });
});

describe("validateImageFile", () => {
  it("accepts small jpeg/png/webp", () => {
    expect(validateImageFile({ name: "a.png", type: "image/png", size: 100 })).toBeUndefined();
  });
  it("rejects other types, empty and oversized files", () => {
    expect(validateImageFile({ name: "a.gif", type: "image/gif", size: 100 })).toMatch(/only JPEG/);
    expect(validateImageFile({ name: "a.png", type: "image/png", size: 6 * 1024 * 1024 })).toMatch(/5 MB/);
    expect(validateImageFile({ name: "a.png", type: "image/png", size: 0 })).toMatch(/empty/);
  });
});
