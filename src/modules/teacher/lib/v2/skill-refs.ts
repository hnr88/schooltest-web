import { attributeNameSchema, type AttributeName, type DisplaySkill } from '@schooltest/scoring-contracts';

import { SKILL_LABEL_KEY } from '@/modules/teacher/constants/v2-i18n.constants';
import type { ScoredSkill } from '@/modules/teacher/types/v2-view-common.types';

export function isAttributeName(value: string): value is AttributeName {
  return attributeNameSchema.safeParse(value).success;
}

export function toScoredSkill(found: { skill: DisplaySkill; score: number } | null): ScoredSkill | null {
  return found === null ? null : { skill: found.skill, labelKey: SKILL_LABEL_KEY[found.skill], score: found.score };
}
