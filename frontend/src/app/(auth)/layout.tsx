import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RootDocument } from "@/components/layout/RootDocument";
import { AppProviders } from "@/providers/AppProviders";

export const metadata: Metadata = {
  title: { default: "Icewall Shop", template: "%s | Icewall Shop" },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <RootDocument bodyClass="login">
      <AppProviders>{children}</AppProviders>
    </RootDocument>
  );
}
