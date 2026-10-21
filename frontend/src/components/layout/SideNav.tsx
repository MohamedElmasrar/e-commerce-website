"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { adminNav, customerNav, isItemActive, type NavItem } from "@/config/navigation";
import { useAuth } from "@/hooks/useAuth";

function NavEntry({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isItemActive(pathname, item);
  const [openState, setOpenState] = useState<boolean | null>(null);
  const hasChildren = Boolean(item.children?.length);
  // Parents containing the current page start open; a click overrides that.
  const open = openState ?? active;
  const Icon = item.icon;

  const body = (
    <>
      <div className="side-menu__icon">
        <Icon />
      </div>
      <div className="side-menu__title">
        {item.title}
        {hasChildren ? (
          <div className={`side-menu__sub-icon${open ? " transform rotate-180" : ""}`}>
            <ChevronDown />
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    <li>
      {hasChildren ? (
        <button
          type="button"
          className={`side-menu w-full text-left${active ? " side-menu--active" : ""}`}
          aria-expanded={open}
          onClick={() => setOpenState(!open)}
        >
          {body}
        </button>
      ) : (
        <Link href={item.href ?? "#"} className={`side-menu${active ? " side-menu--active" : ""}`}>
          {body}
        </Link>
      )}
      {hasChildren ? (
        <ul className={open ? "side-menu__sub-open" : ""}>
          {item.children?.map((child) => (
            <NavEntry key={child.title} item={child} pathname={pathname} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function SideNav() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  return (
    <nav className="side-nav">
      <ul>
        {customerNav.map((item) => (
          <NavEntry key={item.title} item={item} pathname={pathname} />
        ))}
        {isAdmin ? (
          <>
            <li className="side-nav__devider my-6"></li>
            {adminNav.map((item) => (
              <NavEntry key={item.title} item={item} pathname={pathname} />
            ))}
          </>
        ) : null}
      </ul>
    </nav>
  );
}
