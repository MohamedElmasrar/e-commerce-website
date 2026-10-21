"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ErrorView } from "@/components/ui/ErrorView";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { useAuth } from "@/hooks/useAuth";

function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) {
      const timer = setTimeout(() => router.replace("/"), 1500);
      return () => clearTimeout(timer);
    }
  }, [isAdmin, router]);

  if (!isAdmin) {
    return <ErrorView code="403" title="Administrators only" message="You do not have access to this area. Redirecting..." />;
  }
  return <>{children}</>;
}

/** Client guard for the (admin) route group. The backend enforces ROLE_ADMIN on every admin API anyway. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AdminOnly>{children}</AdminOnly>
    </RequireAuth>
  );
}
