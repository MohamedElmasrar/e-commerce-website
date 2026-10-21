"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildBreadcrumbs } from "@/config/breadcrumbs";

export function Breadcrumb() {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);
  return (
    <nav aria-label="breadcrumb" className="-intro-x h-full mr-auto">
      <ol className="breadcrumb breadcrumb-light">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className={`breadcrumb-item${last ? " active" : ""}`} aria-current={last ? "page" : undefined}>
              {crumb.href && !last ? <Link href={crumb.href}>{crumb.label}</Link> : crumb.label}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
