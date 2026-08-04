import type { AssessedAttributeStatus } from '@/modules/report/types/attribute.types';
import type { Observation } from '@/modules/report/types/observation.types';

import type { ObservationFormatters, ObservationValues } from '@/modules/report/types/lib.types';

// E11-06 — one observation to the ICU values its catalog sentence declares.
// Every branch is exhaustive over the union, so a new observation kind cannot be
// added without its values; nothing here composes prose.
export function observationValues(
  observation: Observation,
  format: ObservationFormatters,
): ObservationValues {
  switch (observation.key) {
    case 'noAttributeEvidence':
    case 'allMastered':
      return {};
    case 'jaggedProfile':
      return {
        mastered: format.list(observation.mastered),
        masteredCount: observation.mastered.length,
        gap: format.list(observation.gap),
        gapCount: observation.gap.length,
      };
    case 'comprehensionNotAssessedWithGap':
    case 'foundationSecureComprehensionGap':
      return { gap: format.list(observation.gap), gapCount: observation.gap.length };
    case 'comprehensionNotAssessedFoundationSecure':
      return {
        foundation: format.list(observation.foundation),
        foundationCount: observation.foundation.length,
      };
    case 'foundationBottleneck':
      return {
        blocked: format.list(observation.blocked),
        blockedCount: observation.blocked.length,
        gap: format.list(observation.gap),
        gapCount: observation.gap.length,
      };
    case 'vocabularyBandMeasured':
      return {
        code: observation.code,
        status: format.status(observation.status),
        b1: format.percent(observation.b1),
      };
    case 'vocabularyBandNotAdministered':
      return { code: observation.code, status: format.status(observation.status) };
    case 'vocabularyNotAssessedBandMeasured':
      return { b1: format.percent(observation.b1) };
    case 'evidenceCaveat':
      return {
        assessed: observation.assessed,
        total: observation.total,
        minItems: observation.minItems,
        maxItems: observation.maxItems,
        spread: observation.minItems === observation.maxItems ? 'uniform' : 'range',
        lowConfidence: observation.lowConfidence ? 'true' : 'false',
      };
  }
}
