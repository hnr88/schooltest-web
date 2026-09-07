import type { AssessedBand, AttributeName } from '@/modules/report/schemas/result-view.schema';

// E11-06. One teaching observation as a KEY plus the values it names — never a
// composed sentence. The wording lives in the six message catalogs, so the
// generator stays pure and no copy is assembled at a render site. Lists name
// attributes by their contract AttributeName; translation to a display label
// happens once, in the component's list formatter.
export type Observation =
  | { key: 'noAttributeEvidence' }
  | { key: 'jaggedProfile'; mastered: AttributeName[]; gap: AttributeName[] }
  | { key: 'comprehensionNotAssessedWithGap'; gap: AttributeName[] }
  | { key: 'comprehensionNotAssessedFoundationSecure'; foundation: AttributeName[] }
  | { key: 'foundationBottleneck'; blocked: AttributeName[]; gap: AttributeName[] }
  | { key: 'foundationSecureComprehensionGap'; gap: AttributeName[] }
  | { key: 'allMastered' }
  | { key: 'vocabularyBandMeasured'; status: AssessedBand; b1: number }
  | { key: 'vocabularyBandNotAdministered'; status: AssessedBand }
  | { key: 'vocabularyNotAssessedBandMeasured'; b1: number }
  | {
      key: 'evidenceCaveat';
      assessed: number;
      total: number;
      minItems: number;
      maxItems: number;
      fieldTest: boolean;
    };

// The block resolves absence through the SAME machine as every other block on
// this report. There is no unclassified state: the panel rows carry the seven
// contract attribute names, so layer assignment by name cannot fail.
export type ObservationsView =
  | { state: 'observations'; observations: Observation[] }
  | { state: 'not_derived' }
  | { state: 'not_applicable' };
