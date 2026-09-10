import type { SkillScopeValue } from '@/modules/teacher/types/results-shell.types';

/**
 * The four skills, in the design export's chip order (`Teacher Portal
 * v2.dc.html:601–638`: Reading · Listening · Writing · Speaking). This file is
 * the ONE place they are written — the class skill tabs (`SkillTabs`) and task
 * 15's student-page skill select both consume it, so the presentation can never
 * disagree about the set or the order.
 *
 * The set is a contract truth, not a feature flag: `teacherTestSchema.skill` is
 * `skillSchema.extract(['reading'])` (teacher.ts:206–211), so Reading is the
 * only skill a sitting can score today. Listening, Writing and Speaking are
 * presentation of "Soon" — the tabs stay clickable and swap the body for the
 * coming-soon panel (logic.md #sm-skill: no enum change, no feature flag).
 */
export const SKILL_SCOPE_ORDER = ['reading', 'listening', 'writing', 'speaking'] as const;

export const DEFAULT_SKILL_SCOPE: SkillScopeValue = 'reading';

/**
 * The `dReading` gate (`:4568–4569`): Reading is live; every other skill hides
 * the reading tab strip and swaps the body for the coming-soon panel.
 */
export function isSkillLive(skill: SkillScopeValue): boolean {
  return skill === 'reading';
}

/**
 * Narrow instead of cast — the same shape `isResultsTabValue` uses, so an
 * unknown value from the tab primitive is ignored rather than becoming state.
 */
export function isSkillScopeValue(value: unknown): value is SkillScopeValue {
  return typeof value === 'string' && SKILL_SCOPE_ORDER.some((skill) => skill === value);
}
