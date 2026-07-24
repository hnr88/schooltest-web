import type { AssessedAttributeStatus } from '@/modules/report/types/attribute.types';

// E11-06. One teaching observation as a KEY plus the values it names — never a
// composed sentence. The wording lives in the six message catalogs, so the
// generator stays pure and no copy is assembled at a render site.
export type Observation =
  | { key: 'noAttributeEvidence' }
  | { key: 'jaggedProfile'; mastered: string[]; gap: string[] }
  | { key: 'comprehensionNotAssessedWithGap'; gap: string[] }
  | { key: 'comprehensionNotAssessedFoundationSecure'; foundation: string[] }
  | { key: 'foundationBottleneck'; blocked: string[]; gap: string[] }
  | { key: 'foundationSecureComprehensionGap'; gap: string[] }
  | { key: 'allMastered' }
  | { key: 'vocabularyBandMeasured'; code: string; status: AssessedAttributeStatus; b1: number }
  | { key: 'vocabularyBandNotAdministered'; code: string; status: AssessedAttributeStatus }
  | { key: 'vocabularyNotAssessedBandMeasured'; b1: number }
  | {
      key: 'evidenceCaveat';
      assessed: number;
      total: number;
      minItems: number;
      maxItems: number;
      lowConfidence: boolean;
    };

export type ObservationKey = Observation['key'];

// The block resolves absence through the SAME machine as every other block on
// this report. `unclassified` is not a fallback: it is the honest report that a
// code carries no readable ladder position, emitted instead of guessing which
// layer it belongs to.
export type ObservationsView =
  | { state: 'observations'; observations: Observation[] }
  | { state: 'not_derived' }
  | { state: 'not_applicable' }
  | { state: 'unclassified' };
