/** Reads the one-based ?page= URL value and returns the zero-based page the API expects. */
export function parsePageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isInteger(page) && page >= 1 ? page - 1 : 0;
}

/** Link to a zero-based page; the first page has no query string. */
export function pageHref(base: string, page: number, extra: Record<string, string | undefined> = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(extra)) if (value) params.set(key, value);
  if (page > 0) params.set("page", String(page + 1));
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
