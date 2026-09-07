import type { AssessedBand, AttributeName } from '@/modules/report/schemas/result-view.schema';

// E11-09. A zero-evidence attribute has NO domain_score field to default to 0
// and NO delta field to default to 0 — the shape itself makes the false claim
// unrepresentable. Posterior fields are audit-only and never reach a view.
export type AttributeRowView =
  | {
      state: 'assessed';
      name: AttributeName;
      status: AssessedBand;
      domainScore: number;
      itemsSeen: number;
      deltaDisplay: string | null;
      deltaReliable: boolean | null;
    }
  | {
      state: 'not_assessed';
      name: AttributeName;
      insufficientEvidence?: boolean;
      itemsSeen: number;
    };

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
    };
