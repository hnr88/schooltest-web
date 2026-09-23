import {
  attributeNameSchema,
  type AssessedBand,
  type AttributeName,
  type DisplaySkill,
  type ResultView,
} from '@schooltest/scoring-contracts';

import { displaySkills } from '@/modules/results';

import { SKILL_LABEL_KEY } from '@/modules/teacher/constants/v2-i18n.constants';
import type { ScoredSkill } from '@/modules/teacher/types/v2-view-common.types';

export function isAttributeName(value: string): value is AttributeName {
  return attributeNameSchema.safeParse(value).success;
}

export function toScoredSkill(found: { skill: DisplaySkill; score: number } | null): ScoredSkill | null {
  return found === null ? null : { skill: found.skill, labelKey: SKILL_LABEL_KEY[found.skill], score: found.score };
}

/** The skill's band on this result — its ACARA phase step — or null when it carries none. */
export function assessedBandOf(result: ResultView, skill: DisplaySkill): AssessedBand | null {
  const status = displaySkills(result).find((tile) => tile.skill === skill)?.status ?? null;
  return status === null || status === 'not_assessed' ? null : status;
}
