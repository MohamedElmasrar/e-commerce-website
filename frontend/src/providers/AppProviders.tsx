"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "./AuthProvider";
import { MutationErrorToaster } from "./MutationErrorToaster";
import { QueryProvider } from "./QueryProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ToastProvider>
          <MutationErrorToaster />
          {children}
        </ToastProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
