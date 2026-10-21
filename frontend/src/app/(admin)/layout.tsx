import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RequireAdmin } from "@/features/admin/components/RequireAdmin";
import { AppShell } from "@/components/layout/AppShell";
import { RootDocument } from "@/components/layout/RootDocument";
import { AppProviders } from "@/providers/AppProviders";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin | Icewall Shop" },
  robots: { index: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RootDocument bodyClass="main">
      <AppProviders>
        <AppShell>
          <RequireAdmin>{children}</RequireAdmin>
        </AppShell>
      </AppProviders>
    </RootDocument>
  );
}
