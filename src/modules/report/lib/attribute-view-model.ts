import { ATTRIBUTE_CODE_PATTERN } from '@/modules/report/constants/mastery.constants';
import { getCrosswalkFieldState } from '@/modules/report/lib/display-label';
import type {
  AttributeConfidence,
  AttributeEvidence,
  AttributePanelView,
  AttributeRowView,
} from '@/modules/report/types/attribute.types';
import type { ResultAttributeEntry, ResultView } from '@/modules/report/types/report.types';

const NOT_ASSESSED = 'not_assessed';

function codeSortKey(code: string): [string, number] {
  const match = ATTRIBUTE_CODE_PATTERN.exec(code);
  if (!match) return [code.toUpperCase(), Number.MAX_SAFE_INTEGER];
  return [match[1].toUpperCase(), Number(match[2])];
}

// `attributes` is a json object, so its key order is whatever the server
// inserted. Ordering is presentation only.
export function orderAttributeCodes(codes: readonly string[]): string[] {
  return [...codes].sort((a, b) => {
    const [prefixA, indexA] = codeSortKey(a);
    const [prefixB, indexB] = codeSortKey(b);
    if (prefixA !== prefixB) return prefixA < prefixB ? -1 : 1;
    if (indexA !== indexB) return indexA - indexB;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

function confidenceFor(probability: number, se: number | undefined): AttributeConfidence {
  if (se === undefined) return { kind: 'evidence_only' };
  return {
    kind: 'interval',
    se,
    lower: Math.max(0, probability - se),
    upper: Math.min(1, probability + se),
  };
}

// The three ways zero evidence reaches the client, collapsed to the ONE state.
// Each is the producer's own semantics restated as a guard, never a substitute
// value: `assembleEntry` emits the literal sentinel exactly when `prob` is null,
// and Doc 2a s.9 is explicit that no items means not_assessed — so a bar drawn
// over zero administered items would be the false claim CT-7 forbids.
export function resolveAttributeRow(code: string, entry: ResultAttributeEntry): AttributeRowView {
  if (entry === NOT_ASSESSED) return { state: 'not_assessed', code };
  if (entry.prob === null || entry.status === NOT_ASSESSED || entry.items === 0) {
    return { state: 'not_assessed', code };
  }
  return {
    state: 'assessed',
    code,
    status: entry.status,
    probability: entry.prob,
    items: entry.items,
    delta: entry.delta,
    confidence: confidenceFor(entry.prob, entry.prob_se),
  };
}

function evidenceFor(rows: readonly AttributeRowView[]): AttributeEvidence {
  const items = rows.flatMap((row) => (row.state === 'assessed' ? [row.items] : []));
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
  const map = result.attributes;
  const codes = map === null ? [] : orderAttributeCodes(Object.keys(map));
  if (map === null || codes.length === 0) {
    const state = getCrosswalkFieldState(result, null);
    return state === 'not_applicable' ? { state: 'not_applicable' } : { state: 'not_derived' };
  }
  const rows = codes.map((code) => resolveAttributeRow(code, map[code]));
  return {
    state: 'rows',
    rows,
    evidence: evidenceFor(rows),
    missingStandardError: rows.some(
      (row) => row.state === 'assessed' && row.confidence.kind === 'evidence_only',
    ),
  };
}
