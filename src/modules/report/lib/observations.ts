import { ATTRIBUTE_CODE_PATTERN } from '@/modules/report/constants/mastery.constants';
import { buildAttributePanel } from '@/modules/report/lib/attribute-view-model';
import { getCrosswalkFieldState } from '@/modules/report/lib/display-label';
import { buildSupplementaryStrand } from '@/modules/report/lib/supplementary-view-model';
import type { AttributeEvidence, AttributeRowView } from '@/modules/report/types/attribute.types';
import type { Observation, ObservationsView } from '@/modules/report/types/observation.types';
import type { ResultView } from '@/modules/report/types/report.types';
import type { SupplementaryStrandView } from '@/modules/report/types/supplementary.types';

// Doc 2a s.2, verbatim: "Foundation (Stage 1, A1-A2): decoding (R1/L1),
// vocabulary (R2/L2), grammar (R3/L3). Comprehension (Stages 2-3, B1-B2): gist
// (R4/L4), detail (R5/L5), propositional inference (R6/L6), critical/pragmatic
// (R7/L7)." These two integers are the ONLY structural constants here. There is
// deliberately no per-code table: a client-side attribute dictionary is exactly
// the codebook Doc 1 s.11.4 forbids, so attributes are named by their contract
// code — the same chip the attribute bars already render.
const FOUNDATION_MAX_LADDER_INDEX = 3;
const VOCABULARY_LADDER_INDEX = 2;

type AssessedRow = Extract<AttributeRowView, { state: 'assessed' }>;
type PlacedRow = { row: AssessedRow; index: number };

function ladderIndex(code: string): number | null {
  const match = ATTRIBUTE_CODE_PATTERN.exec(code);
  return match === null ? null : Number(match[2]);
}

function codesOf(rows: readonly PlacedRow[]): string[] {
  return rows.map((placed) => placed.row.code);
}

// Sentence 1 — the contrast. Reads the WIRE `status` only: no probability is
// compared against any cut here, because the cut lives in Config and is applied
// once, server-side (see F-WEB-ATTRIBUTE-BARS). `not_assessed` rows are absent
// from both layers — an unadministered attribute makes no claim and is never
// counted as a failure. The arms are ordered and exhaustive; exactly one fires.
function contrastObservation(
  foundation: readonly PlacedRow[],
  comprehension: readonly PlacedRow[],
): Observation {
  const foundationGap = foundation.filter((placed) => placed.row.status !== 'mastered');
  const comprehensionGap = comprehension.filter((placed) => placed.row.status !== 'mastered');
  const comprehensionMastered = comprehension.filter((placed) => placed.row.status === 'mastered');

  if (foundation.length === 0 && comprehension.length === 0) return { key: 'noAttributeEvidence' };

  // The audit's headline contrast: mastered comprehension over an unmastered
  // foundation. Doc 2a s.2 places such a profile outside the 24-pattern valid
  // space, so it is named first and the comprehension claim is flagged.
  if (comprehensionMastered.length > 0 && foundationGap.length > 0) {
    return {
      key: 'jaggedProfile',
      mastered: codesOf(comprehensionMastered),
      gap: codesOf(foundationGap),
    };
  }

  if (comprehension.length === 0) {
    return foundationGap.length > 0
      ? { key: 'comprehensionNotAssessedWithGap', gap: codesOf(foundationGap) }
      : { key: 'comprehensionNotAssessedFoundationSecure', foundation: codesOf(foundation) };
  }

  // Reached only after the jagged arm, so an empty comprehension gap here also
  // means an empty foundation gap.
  if (comprehensionGap.length === 0) return { key: 'allMastered' };

  return foundationGap.length > 0
    ? {
        key: 'foundationBottleneck',
        blocked: codesOf(comprehensionGap),
        gap: codesOf(foundationGap),
      }
    : { key: 'foundationSecureComprehensionGap', gap: codesOf(comprehensionGap) };
}

// Sentence 2 — the B1 band folded in. Doc 2a s.2: "R2/L2 Vocabulary = A2-band
// lexicon secure. Vocabulary above A2 is measured by the supplementary B1
// strand and reported as band accuracy, never as the switch." The accuracy is
// stated as the proportion it is and is NEVER classified as low or as a gap —
// that would be a client-side cut score on an out-of-model indicator. Returns
// null (the sentence is omitted) when there is nothing measured to fold in.
function vocabularyObservation(
  placed: readonly PlacedRow[],
  strand: SupplementaryStrandView,
): Observation | null {
  if (strand.state !== 'bands') return null;
  const b1 = strand.bands.find((band) => band.code === 'b1');
  const accuracy = b1 !== undefined && b1.state === 'measured' ? b1.accuracy : null;
  const vocabulary = placed.find((entry) => entry.index === VOCABULARY_LADDER_INDEX);

  if (vocabulary === undefined) {
    return accuracy === null ? null : { key: 'vocabularyNotAssessedBandMeasured', b1: accuracy };
  }
  return accuracy === null
    ? {
        key: 'vocabularyBandNotAdministered',
        code: vocabulary.row.code,
        status: vocabulary.row.status,
      }
    : {
        key: 'vocabularyBandMeasured',
        code: vocabulary.row.code,
        status: vocabulary.row.status,
        b1: accuracy,
      };
}

// Sentence 3 — how thinly the two sentences above are evidenced. Item counts are
// never summed across attributes (one item may load several Q-matrix columns).
function evidenceObservation(
  evidence: AttributeEvidence,
  lowConfidence: boolean | null,
): Observation | null {
  if (evidence.state !== 'assessed') return null;
  return {
    key: 'evidenceCaveat',
    assessed: evidence.assessed,
    total: evidence.total,
    minItems: evidence.minItems,
    maxItems: evidence.maxItems,
    lowConfidence: lowConfidence === true,
  };
}

// E11-06 — the observation generator. Pure: no I/O, no clock, no randomness. It
// reasons over the SAME view models the page renders (`buildAttributePanel`,
// `buildSupplementaryStrand`), so an observation can never disagree with the bar
// it describes, and it resolves absence through the SAME machine as every other
// block on this report.
export function buildObservations(result: ResultView): ObservationsView {
  // The two-layer ladder is defined for the receptive skills only (Doc 2a s.2),
  // so a productive ladder or a placement parent is not_applicable rather than
  // split into layers it does not have.
  if (getCrosswalkFieldState(result, null) === 'not_applicable') return { state: 'not_applicable' };

  const panel = buildAttributePanel(result);
  if (panel.state !== 'rows') {
    return { state: panel.state === 'not_applicable' ? 'not_applicable' : 'not_derived' };
  }

  const placed: PlacedRow[] = [];
  for (const row of panel.rows) {
    const index = ladderIndex(row.code);
    // A code with no readable ladder position has no readable layer. Reporting
    // that is honest; dropping it into a layer would be a guess.
    if (index === null) return { state: 'unclassified' };
    if (row.state === 'assessed') placed.push({ row, index });
  }

  const observations = [
    contrastObservation(
      placed.filter((entry) => entry.index <= FOUNDATION_MAX_LADDER_INDEX),
      placed.filter((entry) => entry.index > FOUNDATION_MAX_LADDER_INDEX),
    ),
    vocabularyObservation(placed, buildSupplementaryStrand(result)),
    evidenceObservation(panel.evidence, result.low_confidence),
  ].filter((observation): observation is Observation => observation !== null);

  return { state: 'observations', observations };
}
