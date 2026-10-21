"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode, type Ref } from "react";

interface DropdownProps {
  /** Renders the toggle element. Spread `toggleProps` on it. */
  renderToggle: (api: {
    open: boolean;
    toggleProps: { ref: Ref<HTMLButtonElement>; onClick: () => void; "aria-expanded": boolean; "aria-controls": string };
  }) => ReactNode;
  children: ReactNode | ((api: { close: () => void }) => ReactNode);
  /** Width classes of the menu, for example "w-56". */
  menuClassName?: string;
  /** Classes of the inner `dropdown-content` list wrapper. */
  contentClassName?: string;
  className?: string;
  placement?: "bottom-start" | "bottom-end";
}

/** Replacement for data-tw-toggle="dropdown". Uses the template `dropdown-menu` + `show` classes. */
export function Dropdown({
  renderToggle,
  children,
  menuClassName = "w-40",
  contentClassName = "",
  className = "",
  placement = "bottom-start",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const position: CSSProperties =
    placement === "bottom-end"
      ? { inset: "100% 0px auto auto", paddingTop: "0.25rem" }
      : { inset: "100% auto auto 0px", paddingTop: "0.25rem" };

  return (
    // The template's .dropdown wrapper moves its popup offscreen until its JavaScript positions it.
    <div
      ref={rootRef}
      className={`relative ${className}`.trim()}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (!open || event.key !== "Escape") return;
        event.preventDefault();
        setOpen(false);
        toggleRef.current?.focus();
      }}
    >
      {renderToggle({
        open,
        toggleProps: {
          ref: toggleRef,
          onClick: () => setOpen((value) => !value),
          "aria-expanded": open,
          "aria-controls": menuId,
        },
      })}
      <div id={menuId} hidden={!open} className={`dropdown-menu ${menuClassName}${open ? " show" : ""}`} style={position}>
        <ul className={`dropdown-content ${contentClassName}`.trim()}>
          {typeof children === "function" ? children({ close: () => setOpen(false) }) : children}
        </ul>
      </div>
    </div>
  );
}
