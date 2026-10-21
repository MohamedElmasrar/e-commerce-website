/** Reads an id from a URL value; anything that is not a positive integer is ignored. */
export function parseId(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = Number(raw);
  return raw && Number.isInteger(id) && id > 0 ? id : null;
}
