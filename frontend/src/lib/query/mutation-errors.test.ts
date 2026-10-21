import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/errors";
import { describeMutationError, reportMutationError, setMutationErrorHandler } from "./mutation-errors";

describe("global mutation errors", () => {
  const handler = vi.fn();
  beforeEach(() => {
    handler.mockClear();
    setMutationErrorHandler(handler);
  });

  it("reports API errors with their message", () => {
    reportMutationError(new ApiClientError(409, { message: "Out of stock" }), undefined);
    expect(handler).toHaveBeenCalledWith({ title: "Request failed", message: "Out of stock" });
  });

  it("joins field errors and falls back for unknown errors", () => {
    expect(describeMutationError(new ApiClientError(400, { message: "Validation failed", fieldErrors: [{ field: "a", message: "bad a" }] })).message).toBe("bad a");
    expect(describeMutationError(new Error("x")).title).toBe("Something went wrong");
  });

  it("skips mutations marked silent and works without a handler", () => {
    reportMutationError(new Error("x"), { silent: true });
    expect(handler).not.toHaveBeenCalled();
    setMutationErrorHandler(null);
    expect(() => reportMutationError(new Error("x"), undefined)).not.toThrow();
  });
});
