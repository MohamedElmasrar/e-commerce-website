import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface PaginationProps {
  /** Zero-based current page, as returned by the backend. */
  page: number;
  totalPages: number;
  /** Builds the link of a zero-based page, so the page lives in the URL. */
  buildHref: (page: number) => string;
  /** Number of page links shown around the current page. */
  window?: number;
}

/** Returns the zero-based page numbers to show, with null for a gap. */
export function pageWindow(page: number, totalPages: number, size: number): (number | null)[] {
  if (totalPages <= 0) return [];
  const start = Math.max(0, Math.min(page - Math.floor(size / 2), totalPages - size));
  const end = Math.min(totalPages, start + size);
  const pages: (number | null)[] = [];
  if (start > 0) pages.push(null);
  for (let p = start; p < end; p++) pages.push(p);
  if (end < totalPages) pages.push(null);
  return pages;
}

function Item({ href, children, active, disabled, label }: { href?: string; children: ReactNode; active?: boolean; disabled?: boolean; label?: string }) {
  return (
    <li className={`page-item${active ? " active" : ""}${disabled ? " is-disabled" : ""}`}>
      {href && !disabled ? (
        <Link className="page-link" href={href} aria-label={label} aria-current={active ? "page" : undefined}>
          {children}
        </Link>
      ) : (
        <span className="page-link" aria-disabled={disabled ? true : undefined}>
          {children}
        </span>
      )}
    </li>
  );
}

/** Markup copied from the template pagination, driven by links instead of JS. */
export function Pagination({ page, totalPages, buildHref, window: size = 5 }: PaginationProps) {
  if (totalPages <= 1) return null;
  const first = page <= 0;
  const last = page >= totalPages - 1;
  return (
    <nav className="w-full sm:w-auto sm:mr-auto" aria-label="Pagination">
      <ul className="pagination">
        <Item href={buildHref(0)} disabled={first} label="First page">
          <ChevronsLeft className="w-4 h-4" />
        </Item>
        <Item href={buildHref(page - 1)} disabled={first} label="Previous page">
          <ChevronLeft className="w-4 h-4" />
        </Item>
        {pageWindow(page, totalPages, size).map((p, index) =>
          p === null ? (
            <Item key={`gap-${index}`} disabled>
              ...
            </Item>
          ) : (
            <Item key={p} href={buildHref(p)} active={p === page}>
              {p + 1}
            </Item>
          ),
        )}
        <Item href={buildHref(page + 1)} disabled={last} label="Next page">
          <ChevronRight className="w-4 h-4" />
        </Item>
        <Item href={buildHref(totalPages - 1)} disabled={last} label="Last page">
          <ChevronsRight className="w-4 h-4" />
        </Item>
      </ul>
    </nav>
  );
}
