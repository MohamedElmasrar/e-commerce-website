import { describe, expect, it } from "vitest";
import { validateAdjust } from "./validation";

describe("validateAdjust", () => {
  it("accepts positive and negative whole numbers", () => {
    expect(validateAdjust({ delta: "5", note: "" }, 2)).toEqual({});
    expect(validateAdjust({ delta: "-2", note: "" }, 2)).toEqual({});
  });
  it("rejects zero, fractions and going below zero", () => {
    expect(validateAdjust({ delta: "0", note: "" }, 2).delta).toBeDefined();
    expect(validateAdjust({ delta: "1.5", note: "" }, 2).delta).toBeDefined();
    expect(validateAdjust({ delta: "-3", note: "" }, 2).delta).toMatch(/below 0/);
  });
});
