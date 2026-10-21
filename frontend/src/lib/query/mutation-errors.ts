import { isApiClientError } from "@/lib/api/errors";

export interface MutationErrorMessage {
  title: string;
  message?: string;
}

type Handler = (message: MutationErrorMessage) => void;

let handler: Handler | null = null;

/** Registered by a component that can show toasts; returns an unsubscribe function. */
export function setMutationErrorHandler(next: Handler | null): () => void {
  handler = next;
  return () => {
    if (handler === next) handler = null;
  };
}

/** Turns any thrown value into the text of a toast. */
export function describeMutationError(error: unknown): MutationErrorMessage {
  if (isApiClientError(error)) {
    const detail = error.fieldErrors.length > 0 ? error.fieldErrors.map((f) => f.message).join(", ") : error.message;
    return { title: "Request failed", message: detail };
  }
  return { title: "Something went wrong", message: "Please try again." };
}

/** Called by the MutationCache for every failed mutation unless it sets `meta: { silent: true }`. */
export function reportMutationError(error: unknown, meta: Record<string, unknown> | undefined): void {
  if (meta?.silent) return;
  handler?.(describeMutationError(error));
}
