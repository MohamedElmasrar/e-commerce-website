import { describe, expect, it } from "vitest";
import { shouldKeepPolling } from "./polling";

describe("shouldKeepPolling", () => {
  it("polls while the order is pending or unknown", () => {
    expect(shouldKeepPolling("PENDING_PAYMENT")).toBe(true);
    expect(shouldKeepPolling(undefined)).toBe(true);
  });
  it("stops once the order is paid or cancelled", () => {
    expect(shouldKeepPolling("PAID")).toBe(false);
    expect(shouldKeepPolling("CANCELLED")).toBe(false);
  });
  it("gives up after the limit", () => {
    expect(shouldKeepPolling("PENDING_PAYMENT", true)).toBe(false);
  });
});
