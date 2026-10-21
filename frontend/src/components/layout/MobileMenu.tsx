"use client";

import { BarChart2, ChevronDown, XCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { adminNav, customerNav, isItemActive, type NavItem } from "@/config/navigation";
import { useAuth } from "@/hooks/useAuth";

function MobileEntry({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate: () => void }) {
  const active = isItemActive(pathname, item);
  const [openState, setOpenState] = useState<boolean | null>(null);
  const hasChildren = Boolean(item.children?.length);
  const open = openState ?? active;
  const Icon = item.icon;

  const body = (
    <>
      <div className="menu__icon">
        <Icon />
      </div>
      <div className="menu__title">
        {item.title}
        {hasChildren ? <ChevronDown className={`menu__sub-icon${open ? " transform rotate-180" : ""}`} /> : null}
      </div>
    </>
  );

  return (
    <li>
      {hasChildren ? (
        <button
          type="button"
          className={`menu w-full text-left${active ? " menu--active" : ""}`}
          aria-expanded={open}
          onClick={() => setOpenState(!open)}
        >
          {body}
        </button>
      ) : (
        <Link href={item.href ?? "#"} className={`menu${active ? " menu--active" : ""}`} onClick={onNavigate}>
          {body}
        </Link>
      )}
      {hasChildren ? (
        <ul className={open ? "menu__sub-open" : ""}>
          {item.children?.map((child) => (
            <MobileEntry key={child.title} item={child} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/** Replacement for the template mobile menu; the toggler flips `mobile-menu--active`. */
export function MobileMenu() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const [active, setActive] = useState(false);
  const close = () => setActive(false);

  return (
    <div className={`mobile-menu md:hidden${active ? " mobile-menu--active" : ""}`}>
      <div className="mobile-menu-bar">
        <Link href="/" className="flex mr-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Icewall Shop" className="w-6" src="/dist/images/logo.svg" />
        </Link>
        <button type="button" className="mobile-menu-toggler" aria-label="Open menu" onClick={() => setActive(true)}>
          <BarChart2 className="w-8 h-8 text-white transform -rotate-90" />
        </button>
      </div>
      <div className="scrollable">
        <button type="button" className="mobile-menu-toggler" aria-label="Close menu" onClick={close}>
          <XCircle className="w-8 h-8 text-white transform -rotate-90" />
        </button>
        <ul className="scrollable__content py-2">
          {customerNav.map((item) => (
            <MobileEntry key={item.title} item={item} pathname={pathname} onNavigate={close} />
          ))}
          {isAdmin ? (
            <>
              <li className="menu__devider my-6"></li>
              {adminNav.map((item) => (
                <MobileEntry key={item.title} item={item} pathname={pathname} onNavigate={close} />
              ))}
            </>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
