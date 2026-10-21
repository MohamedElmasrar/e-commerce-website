import { describe, expect, it } from "vitest";
import { emptyCategoryForm, slugify, toCategoryRequest, validateCategoryForm } from "./validation";

describe("category form", () => {
  it("slugifies names", () => {
    expect(slugify("  Café & Tea!  ")).toBe("cafe-tea");
  });
  it("requires name and slug", () => {
    expect(Object.keys(validateCategoryForm(emptyCategoryForm)).sort()).toEqual(["name", "slug"]);
  });
  it("builds the request with a null parent", () => {
    expect(toCategoryRequest({ name: " A ", slug: "a", description: "", parentId: "" })).toEqual({
      name: "A",
      slug: "a",
      description: null,
      parentId: null,
    });
  });
});
