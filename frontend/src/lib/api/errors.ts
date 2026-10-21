import type { ApiErrorBody, ApiFieldError } from "./types";

/** Typed error thrown by the API client for every non-2xx response. */
export class ApiClientError extends Error {
  readonly status: number;
  readonly error: string;
  readonly path?: string;
  readonly requestId?: string;
  readonly fieldErrors: ApiFieldError[];

  constructor(status: number, body?: Partial<ApiErrorBody> | null, fallbackMessage?: string) {
    super(body?.message || fallbackMessage || `Request failed with status ${status}`);
    this.name = "ApiClientError";
    this.status = status;
    this.error = body?.error ?? "";
    this.path = body?.path;
    this.requestId = body?.requestId;
    this.fieldErrors = body?.fieldErrors ?? [];
  }

  /** Message for one form field, if the backend reported a validation error for it. */
  fieldMessage(field: string): string | undefined {
    return this.fieldErrors.find((e) => e.field === field)?.message;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}
