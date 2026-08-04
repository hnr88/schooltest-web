/**
 * Form value -> DOM value for a controlled settings input. The form holds real
 * numbers and booleans, and an emptied number input yields NaN, which must
 * render as an empty box rather than the literal text "NaN"; a value the query
 * has not delivered yet is `undefined` and renders empty too.
 */
export function settingsInputValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number' && Number.isNaN(value)) return '';
  return String(value);
}
