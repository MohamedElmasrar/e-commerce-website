import { describe, expect, it } from "vitest";
import { parseId } from "./parse-id";

describe("parseId", () => {
  it("accepts positive integers", () => {
    expect(parseId("12")).toBe(12);
    expect(parseId(["7", "8"])).toBe(7);
  });
  it("rejects everything else", () => {
    for (const bad of [undefined, "", "0", "-1", "1.5", "abc", "1e3x"]) expect(parseId(bad)).toBeNull();
  });
});
