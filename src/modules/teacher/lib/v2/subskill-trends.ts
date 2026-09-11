import type { ResultView } from '@schooltest/scoring-contracts';

import { DISPLAY_SKILL_ORDER } from '@/modules/results';

import { SKILL_LABEL_KEY } from '@/modules/teacher/constants/v2-i18n.constants';
import { sparkline } from '@/modules/teacher/lib/v2/chart-geometry';
import { signedFg } from '@/modules/teacher/lib/v2/growth';
import { alignedClassSeries, skillOf } from '@/modules/teacher/lib/v2/history-series';
import { classMeanTone } from '@/modules/teacher/lib/v2/tone';
import type { SubskillTrend } from '@/modules/teacher/types/v2-class-tabs.types';

function weakestNowFirst(a: SubskillTrend, b: SubskillTrend): number {
  if (a.now === null || b.now === null) {
    if (a.now === b.now) return 0;
    return a.now === null ? 1 : -1;
  }
  return a.now - b.now;
}

export function subskillTrends(results: readonly ResultView[]): SubskillTrend[] {
  return DISPLAY_SKILL_ORDER.map((skill): SubskillTrend => {
    const values = alignedClassSeries(results, skillOf(skill)).map((point) => point.value);
    const now = values.at(-1) ?? null;
    const first = values.at(0);
    const difference = values.length < 2 || now === null || first === undefined ? null : now - first;
    return {
      skill,
      labelKey: SKILL_LABEL_KEY[skill],
      values,
      now,
      difference,
      differenceFg: signedFg(difference),
      stroke: classMeanTone(now).fg,
      spark: sparkline(values),
    };
  }).sort(weakestNowFirst);
}
