"use client";

import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Adds modal-sm, modal-lg or modal-xl to the dialog. */
  size?: "sm" | "md" | "lg" | "xl";
  /** Shown to assistive technology. */
  label?: string;
}

/** Replacement for data-tw-toggle="modal". Same classes and transitions as the template. */
export function Modal({ open, onClose, children, size = "md", label }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const sizeClass = size === "md" ? "" : ` modal-${size}`;

  return (
    <div
      className={`modal${open ? " show" : ""}`}
      style={open ? { marginTop: 0, marginLeft: 0, zIndex: 10000 } : undefined}
      tabIndex={-1}
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={`modal-dialog${sizeClass}`}>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}
