import { Activity, Box, Home, Layers, LayoutGrid, Lock, Receipt, ShoppingBag, ShoppingCart, Tag, User, type LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  icon: LucideIcon;
  /** Leaf items have an href; parents have children. */
  href?: string;
  children?: NavItem[];
}

export const customerNav: NavItem[] = [
  { title: "Home", icon: Home, href: "/" },
  {
    title: "Shop",
    icon: ShoppingBag,
    children: [
      { title: "Products", icon: Activity, href: "/products" },
      { title: "Categories", icon: Activity, href: "/categories" },
    ],
  },
  { title: "Cart", icon: ShoppingCart, href: "/cart" },
  { title: "My Orders", icon: Receipt, href: "/orders" },
  {
    title: "My Account",
    icon: User,
    children: [
      { title: "Profile", icon: Activity, href: "/profile" },
      { title: "Change Password", icon: Lock, href: "/profile/password" },
    ],
  },
];

/** Shown to admins below the customer menu. Backed by the (admin) route group. */
export const adminNav: NavItem[] = [
  { title: "Dashboard", icon: LayoutGrid, href: "/admin" },
  {
    title: "Catalog",
    icon: Box,
    children: [
      { title: "Products", icon: Activity, href: "/admin/products" },
      { title: "Categories", icon: Tag, href: "/admin/categories" },
      { title: "Inventory", icon: Layers, href: "/admin/inventory" },
    ],
  },
  { title: "Orders", icon: ShoppingBag, href: "/admin/orders" },
];

export function isPathActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** True when the item or any descendant matches the path. */
export function isItemActive(pathname: string, item: NavItem): boolean {
  if (item.href && isPathActive(pathname, item.href)) return true;
  return (item.children ?? []).some((child) => isItemActive(pathname, child));
}
