import { describe, expect, it } from "vitest";
import { safeRedirect, validateChangePassword, validateLogin, validateRegister } from "./validation";

describe("auth validation", () => {
  it("requires email and password on login", () => {
    expect(validateLogin({ email: "", password: "" })).toEqual({ email: "Email is required", password: "Password is required" });
    expect(validateLogin({ email: "a@b.co", password: "x" })).toEqual({});
  });

  it("validates registration fields", () => {
    const errors = validateRegister({ fullName: " ", email: "nope", password: "short", confirmPassword: "short" });
    expect(errors.fullName).toBeDefined();
    expect(errors.email).toBe("Enter a valid email address");
    expect(errors.password).toContain("at least 8");
    expect(validateRegister({ fullName: "Ann", email: "ann@x.io", password: "longenough", confirmPassword: "different" }).confirmPassword).toBe(
      "Passwords do not match",
    );
  });

  it("rejects reusing the current password", () => {
    expect(validateChangePassword({ currentPassword: "password1", newPassword: "password1", confirmPassword: "password1" }).newPassword).toBeDefined();
  });

  it("only accepts same-site redirects", () => {
    expect(safeRedirect("/products?page=2")).toBe("/products?page=2");
    expect(safeRedirect("//evil.com")).toBe("/");
    expect(safeRedirect("https://evil.com")).toBe("/");
    expect(safeRedirect(null, "/profile")).toBe("/profile");
  });
});
