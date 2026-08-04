import type { SkillVerdictTone } from '@/modules/design-system';
import type { ChildProgressResult } from '@/modules/children/types/children.types';

import type { Readiness } from '@/modules/children/types/lib.types';
import { READINESS_RANK, READINESS_VERDICTS } from '@/modules/children/constants/lib.constants';

export function getReadinessTone(readiness: Readiness | null): SkillVerdictTone {
  return readiness ? READINESS_VERDICTS[readiness] : 'notAssessed';
}

// The §B.5 skill bar encodes READINESS, not a score: three real steps on a
// three-step enum. `null` (and `not_assessed`) return null so the track renders
// EMPTY — "never measured" is a different fact from "measured at zero".
export function getReadinessValue(readiness: Readiness | null): number | null {
  if (readiness === null || readiness === 'not_assessed') return null;
  return Math.round(((READINESS_RANK[readiness] + 1) / 3) * 100);
}
