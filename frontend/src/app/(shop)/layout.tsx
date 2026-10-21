import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { RootDocument } from "@/components/layout/RootDocument";
import { AppProviders } from "@/providers/AppProviders";

export const metadata: Metadata = {
  title: { default: "Icewall Shop", template: "%s | Icewall Shop" },
  description: "Browse the catalog, manage your cart and orders.",
};

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <RootDocument bodyClass="main">
      <AppProviders>
        <AppShell>{children}</AppShell>
      </AppProviders>
    </RootDocument>
  );
}
