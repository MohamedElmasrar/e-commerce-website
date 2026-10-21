import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("is hidden from assistive technology while closed and shown when open", () => {
    const { rerender } = render(
      <Modal open={false} onClose={() => {}} label="Demo">
        <p>content</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog", { hidden: true }).getAttribute("aria-hidden")).toBe("true");
    rerender(
      <Modal open onClose={() => {}} label="Demo">
        <p>content</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog", { name: "Demo" }).className).toContain("show");
  });

  it("closes on Escape and on a backdrop click, but not on a click inside", () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} label="Demo">
        <button>inside</button>
      </Modal>,
    );
    fireEvent.mouseDown(screen.getByText("inside"));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.mouseDown(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("does not listen for Escape while closed", () => {
    const onClose = vi.fn();
    render(
      <Modal open={false} onClose={onClose}>
        x
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("ConfirmDialog", () => {
  it("calls onConfirm and onCancel from the matching buttons", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog open title="Delete it?" onConfirm={onConfirm} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Delete it?")).toBeTruthy();
  });

  it("disables the confirm button while busy", () => {
    render(<ConfirmDialog open busy onConfirm={() => {}} onCancel={() => {}} />);
    expect((screen.getByRole("button", { name: "Delete" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
