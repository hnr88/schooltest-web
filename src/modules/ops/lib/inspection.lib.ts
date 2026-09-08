/**
 * Ledger row 11 / D-007 helpers.
 *
 * The inspection surfaces render values the contract types as `unknown`
 * (`attribute_vector`, `key`) beside ordinary nullable strings. One function
 * handles both so the table cannot show `[object Object]` for one column and an
 * em dash for another: a null/absent value is the repo's em-dash fallback,
 * everything else is shown verbatim — a primitive as itself, a structure as
 * compact JSON.
 */
const EM_DASH = '—';

export function inspectionCell(value: unknown): string {
  if (value === null || value === undefined) return EM_DASH;
  if (typeof value === 'string') return value === '' ? EM_DASH : value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}
