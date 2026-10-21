const LABELS: Record<string, string> = {
  products: "Products",
  categories: "Categories",
  profile: "Profile",
  password: "Change Password",
  cart: "Cart",
  admin: "Admin",
  orders: "Orders",
  checkout: "Checkout",
  success: "Confirmation",
  cancel: "Cancelled",
  new: "New",
  inventory: "Inventory",
};

export interface Crumb {
  label: string;
  href?: string;
}

/** Builds breadcrumb entries from the URL path, always starting with Home. */
export function buildBreadcrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [{ label: "Home", href: "/" }];
  let href = "";
  segments.forEach((segment, index) => {
    href += `/${segment}`;
    const label = LABELS[segment] ?? decodeURIComponent(segment).replace(/-/g, " ");
    crumbs.push(index === segments.length - 1 ? { label } : { label, href });
  });
  return crumbs;
}
