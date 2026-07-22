import type { SkillVerdictTone } from '@/modules/design-system';
import type { ChildProgressResult } from '@/modules/children/types/children.types';

type Readiness = NonNullable<ChildProgressResult['readiness']>;

// The ordinal the parent contract publishes (DOC1 §3.16/3.18). `not_assessed` is a
// first-class value, NOT a zero — it is excluded from every ranking rather than
// ranked last, so a skill that was never measured can never be reported as weak.
export const READINESS_RANK: Record<Readiness, number> = {
  not_yet: 0,
  approaching: 1,
  met: 2,
  not_assessed: -1,
};

const READINESS_VERDICTS: Record<Readiness, SkillVerdictTone> = {
  met: 'mastered',
  approaching: 'emerging',
  not_yet: 'notYet',
  not_assessed: 'notAssessed',
};

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
