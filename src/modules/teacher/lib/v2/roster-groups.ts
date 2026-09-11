import type { DisplaySkill } from '@schooltest/scoring-contracts';

import { DISPLAY_SKILL_ORDER, weakestSkill, type RosterRow } from '@/modules/results';

import {
  NOT_YET_ASSESSED_GROUP,
  NOT_YET_ASSESSED_GROUP_KEY,
  SKILL_LABEL_KEY,
} from '@/modules/teacher/constants/v2-i18n.constants';
import type { TeachingGroup } from '@/modules/teacher/types/v2-insights.types';

// Suggested groups from the roster (design `insights.groups`: students grouped by the area
// holding them back): each student under their weakest subskill (`weakestSkill` — assessed,
// not the Critical gate, ties by display order; the Students tab's own column), everyone with
// no scored subskill under "Not yet assessed", last. Display order; members in roster order.
export function rosterGroups(roster: readonly RosterRow[]): TeachingGroup[] {
  const bySkill = new Map<DisplaySkill, string[]>();
  const unassessed: string[] = [];
  for (const row of roster) {
    const weakest = row.result === null ? null : weakestSkill(row.result);
    if (weakest === null) unassessed.push(row.student.name);
    else bySkill.set(weakest.skill, [...(bySkill.get(weakest.skill) ?? []), row.student.name]);
  }
  const groups = DISPLAY_SKILL_ORDER.flatMap((skill) => {
    const members = bySkill.get(skill);
    return members === undefined ? [] : [{ attribute: skill, labelKey: SKILL_LABEL_KEY[skill], count: members.length, members }];
  });
  if (unassessed.length === 0) return groups;
  return [
    ...groups,
    { attribute: NOT_YET_ASSESSED_GROUP, labelKey: NOT_YET_ASSESSED_GROUP_KEY, count: unassessed.length, members: unassessed },
  ];
}
