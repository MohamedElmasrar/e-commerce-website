export interface AdjustValues {
  delta: string;
  note: string;
}

export function validateAdjust(values: AdjustValues, onHand: number): { delta?: string; note?: string } {
  const errors: { delta?: string; note?: string } = {};
  const raw = values.delta.trim();
  if (!/^[+-]?\d+$/.test(raw)) errors.delta = "Enter a whole number, for example 10 or -3";
  else if (Number(raw) === 0) errors.delta = "The change cannot be 0";
  else if (onHand + Number(raw) < 0) errors.delta = `Stock cannot go below 0 (on hand: ${onHand})`;
  if (values.note.length > 255) errors.note = "Note must be at most 255 characters";
  return errors;
}
