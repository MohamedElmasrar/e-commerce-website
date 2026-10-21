import { describe, expect, it } from "vitest";
import { ALLOWED_TRANSITIONS, ORDER_STATUSES, nextStatuses, parseStatus } from "./status";

describe("order status helpers", () => {
  it("offers only the allowed next statuses", () => {
    expect(nextStatuses("PENDING_PAYMENT")).toEqual(["PAID", "CANCELLED"]);
    expect(nextStatuses("SHIPPED")).toEqual(["DELIVERED", "REFUNDED"]);
  });
  it("treats CANCELLED and REFUNDED as final", () => {
    expect(nextStatuses("CANCELLED")).toEqual([]);
    expect(nextStatuses("REFUNDED")).toEqual([]);
  });
  it("defines transitions for every status", () => {
    expect(Object.keys(ALLOWED_TRANSITIONS).sort()).toEqual([...ORDER_STATUSES].sort());
  });
  it("parses status filters safely", () => {
    expect(parseStatus("PAID")).toBe("PAID");
    expect(parseStatus("nope")).toBeUndefined();
    expect(parseStatus(undefined)).toBeUndefined();
  });
});
