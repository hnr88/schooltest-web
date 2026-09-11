import { classAverage, resultViewsOf, scoredCount, type RosterRow } from '@/modules/results';

import {
  ATTRIBUTE_LABEL_KEY,
  NOT_YET_ASSESSED_GROUP,
  NOT_YET_ASSESSED_GROUP_KEY,
} from '@/modules/teacher/constants/v2-i18n.constants';
import { cohortAtAGlance } from '@/modules/teacher/lib/v2/cohort';
import { meanShift, signedFg } from '@/modules/teacher/lib/v2/growth';
import { latestSatAt } from '@/modules/teacher/lib/v2/history-series';
import { peerPairings } from '@/modules/teacher/lib/v2/pairings';
import { readingMastery } from '@/modules/teacher/lib/v2/reading-mastery';
import { isAttributeName } from '@/modules/teacher/lib/v2/skill-refs';
import type {
  TeachingDiagnostic,
  TeachingGroup,
  TeachingInsightsView,
} from '@/modules/teacher/types/v2-insights.types';

function groupLabelKey(attribute: string): string | null {
  if (attribute === NOT_YET_ASSESSED_GROUP) return NOT_YET_ASSESSED_GROUP_KEY;
  return isAttributeName(attribute) ? ATTRIBUTE_LABEL_KEY[attribute] : null;
}

function teachingGroups(diagnostic: TeachingDiagnostic | null): TeachingGroup[] {
  return (diagnostic?.groups ?? []).map((group) => ({
    attribute: group.limiting_attribute,
    labelKey: groupLabelKey(group.limiting_attribute),
    count: group.count,
    members: [...group.student_refs],
  }));
}

export function teachingInsights(
  roster: readonly RosterRow[],
  diagnostic: TeachingDiagnostic | null = null,
): TeachingInsightsView {
  const results = resultViewsOf(roster);
  const mastery = readingMastery(results);
  const focus = mastery.find((row) => row.flag?.kind === 'focus') ?? null;
  const shift = meanShift(results);
  const average = classAverage(results);
  const { scored, total } = scoredCount(roster);
  return {
    kpis: {
      lastSitting: { satAt: latestSatAt(results), formCode: diagnostic?.form_code ?? null },
      classAverage: average === null ? null : Math.round(average),
      upSinceLast: { value: shift.value, paired: shift.paired, fg: signedFg(shift.value) },
      topGap: focus === null ? null : { skill: focus.skill, labelKey: focus.labelKey },
      participation: { percent: total === 0 ? null : Math.round((scored / total) * 100), scored, total },
    },
    mastery,
    cohort: cohortAtAGlance(roster),
    pairings: peerPairings(roster, focus === null ? null : focus.skill),
    groups: teachingGroups(diagnostic),
  };
}
