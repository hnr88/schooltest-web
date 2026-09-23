import { buildAttributePanel } from '@/modules/report/lib/attribute-view-model';
import { getCrosswalkFieldState } from '@/modules/report/lib/display-label';
import type { AttributeEvidence } from '@/modules/report/types/attribute.types';
import type { AssessedRow } from '@/modules/report/types/lib.types';
import type { Observation, ObservationsView } from '@/modules/report/types/observation.types';
import type { ResultView } from '@/modules/report/types/report.types';
import type { AttributeName } from '@/modules/report/schemas/result-view.schema';

// The two layers of the split Q-matrix, named by contract attribute. Matrix 1
// (stage 1 core) is the foundation; Matrix 2 (stage 2 core) is comprehension.
// Membership is by NAME, so a panel row can never fail to land in a layer.
const FOUNDATION: readonly AttributeName[] = ['Decoding', 'Vocab_A2', 'Grammar'];
const COMPREHENSION: readonly AttributeName[] = ['Vocab_B1', 'Gist', 'Detail', 'Inference'];

function namesOf(rows: readonly AssessedRow[]): AttributeName[] {
  return rows.map((row) => row.name);
}

// Sentence 1 — the contrast. Reads the WIRE `status` only: no score is compared
// against any cut here, because the cut lives in Config and is applied once,
// server-side (see F-WEB-ATTRIBUTE-BARS). `not_assessed` rows are absent from
// both layers — an unadministered attribute makes no claim and is never counted
// as a failure. The arms are ordered and exhaustive; exactly one fires.
function contrastObservation(
  foundation: readonly AssessedRow[],
  comprehension: readonly AssessedRow[],
): Observation {
  const foundationGap = foundation.filter((row) => row.status !== 'secure');
  const comprehensionGap = comprehension.filter((row) => row.status !== 'secure');
  const comprehensionSecure = comprehension.filter((row) => row.status === 'secure');

  if (foundation.length === 0 && comprehension.length === 0) return { key: 'noAttributeEvidence' };

  // The audit's headline contrast: secure comprehension over an insecure
  // foundation. Such a profile sits outside the admissible Matrix 1/Matrix 2
  // profile spaces, so it is named first and the comprehension claim is flagged.
  if (comprehensionSecure.length > 0 && foundationGap.length > 0) {
    return {
      key: 'jaggedProfile',
      mastered: namesOf(comprehensionSecure),
      gap: namesOf(foundationGap),
    };
  }

  if (comprehension.length === 0) {
    return foundationGap.length > 0
      ? { key: 'comprehensionNotAssessedWithGap', gap: namesOf(foundationGap) }
      : { key: 'comprehensionNotAssessedFoundationSecure', foundation: namesOf(foundation) };
  }

  // Reached only after the jagged arm, so an empty comprehension gap here also
  // means an empty foundation gap.
  if (comprehensionGap.length === 0) return { key: 'allMastered' };

  return foundationGap.length > 0
    ? {
        key: 'foundationBottleneck',
        blocked: namesOf(comprehensionGap),
        gap: namesOf(foundationGap),
      }
    : { key: 'foundationSecureComprehensionGap', gap: namesOf(comprehensionGap) };
}

// Sentence 2 — how thinly the sentence above is evidenced. Item counts are
// never summed across attributes (one item may load several Q-matrix columns).
// A field-test result is flagged as such; it is never called low-confidence,
// because the contract's low_confidence rule is unconfigured and always null.
function evidenceObservation(
  evidence: AttributeEvidence,
  provisional: ResultView['provisional'],
): Observation | null {
  if (evidence.state !== 'assessed') return null;
  return {
    key: 'evidenceCaveat',
    assessed: evidence.assessed,
    total: evidence.total,
    minItems: evidence.minItems,
    maxItems: evidence.maxItems,
    fieldTest: provisional === 'field_test',
  };
}

// E11-06 — the observation generator. Pure: no I/O, no clock, no randomness. It
// reasons over the SAME view model the page renders (`buildAttributePanel`), so an
// observation can never disagree with the bar it describes, and it resolves
// absence through the SAME machine as every other block on this report. Both
// vocabulary attributes run through the contrast like every other modelled
// attribute: Vocab_A2 in the foundation layer, Vocab_B1 in comprehension.
export function buildObservations(result: ResultView): ObservationsView {
  // The two-layer model is defined for the receptive skills only (memo s.2-3),
  // so a productive skill or a placement parent is not_applicable rather than
  // split into layers it does not have.
  if (getCrosswalkFieldState(result, null) === 'not_applicable') return { state: 'not_applicable' };

  const panel = buildAttributePanel(result);
  if (panel.state !== 'rows') {
    return { state: panel.state === 'not_applicable' ? 'not_applicable' : 'not_derived' };
  }

  const assessed = panel.rows.filter((row): row is AssessedRow => row.state === 'assessed');

  const observations = [
    contrastObservation(
      assessed.filter((row) => FOUNDATION.includes(row.name)),
      assessed.filter((row) => COMPREHENSION.includes(row.name)),
    ),
    evidenceObservation(panel.evidence, result.provisional),
  ].filter((observation): observation is Observation => observation !== null);

  return { state: 'observations', observations };
}
