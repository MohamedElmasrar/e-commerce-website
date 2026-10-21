"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { setMutationErrorHandler } from "@/lib/query/mutation-errors";

/** Shows a toast for every failed mutation (the global mutation error handler). */
export function MutationErrorToaster() {
  const toast = useToast();
  useEffect(() => setMutationErrorHandler(({ title, message }) => toast.error(title, message)), [toast]);
  return null;
}
