import { isApiClientError } from "@/lib/api/errors";

/** Splits a failed request into per-field messages and a general message. */
export function readFormError<F extends string>(error: unknown, fields: readonly F[]): { fields: Partial<Record<F, string>>; general?: string } {
  if (!isApiClientError(error)) return { fields: {}, general: "Something went wrong. Please try again." };
  const mapped: Partial<Record<F, string>> = {};
  for (const fieldError of error.fieldErrors) {
    if ((fields as readonly string[]).includes(fieldError.field)) mapped[fieldError.field as F] = fieldError.message;
  }
  const hasFieldMessages = Object.keys(mapped).length > 0;
  return { fields: mapped, general: hasFieldMessages ? undefined : error.message };
}
