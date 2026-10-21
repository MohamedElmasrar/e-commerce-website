import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Pagination, pageWindow } from "./Pagination";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("pageWindow", () => {
  it("shows a gap on both sides in the middle", () => {
    expect(pageWindow(5, 12, 5)).toEqual([null, 3, 4, 5, 6, 7, null]);
  });
  it("sticks to the edges", () => {
    expect(pageWindow(0, 12, 5)).toEqual([0, 1, 2, 3, 4, null]);
    expect(pageWindow(11, 12, 5)).toEqual([null, 7, 8, 9, 10, 11]);
  });
  it("shows everything for short lists", () => {
    expect(pageWindow(1, 3, 5)).toEqual([0, 1, 2]);
  });
});

describe("Pagination", () => {
  it("renders nothing for a single page", () => {
    const { container } = render(<Pagination page={0} totalPages={1} buildHref={(p) => `/x?page=${p}`} />);
    expect(container.innerHTML).toBe("");
  });

  it("marks the current page and links to the others", () => {
    render(<Pagination page={1} totalPages={3} buildHref={(p) => `/products?page=${p + 1}`} />);
    expect(screen.getByRole("link", { name: "2" }).closest("li")).toHaveProperty("className", "page-item active");
    expect(screen.getByRole("link", { name: "3" }).getAttribute("href")).toBe("/products?page=3");
    expect(screen.getByRole("link", { name: "Previous page" }).getAttribute("href")).toBe("/products?page=1");
  });
});
