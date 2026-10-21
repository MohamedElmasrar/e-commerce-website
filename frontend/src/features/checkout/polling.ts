import type { OrderStatus } from "@/lib/api/types";

export const POLL_LIMIT_MS = 60_000;

/** The webhook may arrive a few seconds after the redirect. Poll until the order leaves PENDING_PAYMENT. */
export function shouldKeepPolling(status: OrderStatus | undefined, timedOut = false): boolean {
  return !timedOut && (status === undefined || status === "PENDING_PAYMENT");
}
