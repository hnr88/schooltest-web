import { getCrosswalkFieldState } from '@/modules/report/lib/display-label';
import {
  assessedBandSchema,
  attributeNameSchema,
} from '@/modules/report/schemas/result-view.schema';
import type {
  AttributeDeltaView,
  AttributeEvidence,
  AttributePanelView,
  AttributeRowView,
} from '@/modules/report/types/attribute.types';
import type {
  AttributeName,
  ResultView,
  ResultViewAttribute,
} from '@/modules/report/schemas/result-view.schema';

// `attributes` is a partial record, so its key order is whatever the server
// inserted. Ordering is presentation only: the memo's attribute order, with
// any key outside the contract enum appended at the end rather than dropped.
export function orderAttributeNames(names: readonly string[]): AttributeName[] {
  const known = attributeNameSchema.options.filter((name) => names.includes(name));
  const unknown = names.filter((name) => !attributeNameSchema.options.includes(name as AttributeName));
  return [...known, ...unknown] as AttributeName[];
}

// `delta_display` is a claim, not copy: `steady` and `band_movement` are
// contract tokens and a band pair is two band keys, so the row is handed the
// resolved kind and renders words. Printing the token was the defect.
export function resolveAttributeDelta(entry: ResultViewAttribute): AttributeDeltaView | null {
  if (entry.status === 'not_assessed' || entry.delta_display === null) return null;
  if (entry.delta_display === 'steady') return { kind: 'steady' };
  if (entry.delta_display !== 'band_movement') {
    return { kind: 'points', display: entry.delta_display };
  }
  const before = assessedBandSchema.safeParse(entry.band_before);
  const after = assessedBandSchema.safeParse(entry.band_after);
  return before.success && after.success
    ? { kind: 'bands', before: before.data, after: after.data }
    : { kind: 'band_movement' };
}

// Zero evidence reaches the client as the literal `not_assessed` status, and
// the row keeps NO score field — a bar drawn over zero administered items
// would be the false claim the union type exists to forbid.
export function resolveAttributeRow(
  name: AttributeName,
  entry: ResultViewAttribute,
): AttributeRowView {
  if (entry.status === 'not_assessed') {
    return {
      state: 'not_assessed',
      name,
      insufficientEvidence: entry.insufficient_evidence,
      itemsSeen: entry.items_seen,
    };
  }
  return {
    state: 'assessed',
    name,
    status: entry.status,
    domainScore: entry.domain_score,
    itemsSeen: entry.items_seen,
    delta: resolveAttributeDelta(entry),
    deltaReliable: entry.delta_reliable,
  };
}

function evidenceFor(rows: readonly AttributeRowView[]): AttributeEvidence {
  const items = rows.flatMap((row) => (row.state === 'assessed' ? [row.itemsSeen] : []));
  if (items.length === 0) return { state: 'none_assessed', total: rows.length };
  return {
    state: 'assessed',
    assessed: items.length,
    total: rows.length,
    minItems: Math.min(...items),
    maxItems: Math.max(...items),
  };
}

// An absent evidence map splits into the SAME two absences every other
// crosswalk-derived field on this report splits into, through the same
// function — so the panel can never disagree with the header about which
// absence this result is.
export function buildAttributePanel(result: ResultView): AttributePanelView {
  const names = orderAttributeNames(Object.keys(result.attributes));
  if (names.length === 0) {
    const state = getCrosswalkFieldState(result, null);
    return state === 'not_applicable' ? { state: 'not_applicable' } : { state: 'not_derived' };
  }
  const rows = names.flatMap((name) => {
    const entry = result.attributes[name];
    return entry ? [resolveAttributeRow(name, entry)] : [];
  });
  return { state: 'rows', rows, evidence: evidenceFor(rows) };
}
