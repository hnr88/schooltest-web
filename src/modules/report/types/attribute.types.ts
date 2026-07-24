import type { AttributeStatus } from '@/modules/report/types/report.types';

// The three statuses an ASSESSED attribute can carry. `not_assessed` is not one
// of them: it is the absence, and it lives on the row union below rather than
// inside a status field (E11-09).
export type AssessedAttributeStatus = Exclude<AttributeStatus, 'not_assessed'>;

// E11-03. `interval` is a REAL +/- standard error read off `prob_se`;
// `evidence_only` is the honest absence of one. No interval is ever synthesised
// from item counts, from `low_confidence`, or from anything else.
export type AttributeConfidence =
  { kind: 'interval'; se: number; lower: number; upper: number } | { kind: 'evidence_only' };

// E11-09. A zero-evidence attribute has NO probability field to default to 0 and
// NO delta field to default to 0 — the shape itself makes the false claim
// unrepresentable.
export type AttributeRowView =
  | {
      state: 'assessed';
      code: string;
      status: AssessedAttributeStatus;
      probability: number;
      items: number;
      delta: number | null;
      confidence: AttributeConfidence;
    }
  | { state: 'not_assessed'; code: string };

// E11-04. Item counts are never summed across attributes — one item may load
// several attributes in the Q-matrix, so a total would be a fabricated number.
// The range is the honest statement of how unevenly the claim is evidenced.
export type AttributeEvidence =
  | { state: 'none_assessed'; total: number }
  | { state: 'assessed'; assessed: number; total: number; minItems: number; maxItems: number };

export type AttributePanelView =
  | { state: 'not_derived' }
  | { state: 'not_applicable' }
  | {
      state: 'rows';
      rows: AttributeRowView[];
      evidence: AttributeEvidence;
      missingStandardError: boolean;
    };
