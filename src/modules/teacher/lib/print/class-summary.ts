import {
  classAverage,
  resultViewsOf,
  scoredCount,
  secureCounts,
  subskillAverages,
  vocabStrandMeans,
  weakestFirstAverages,
} from '@/modules/results';
import type { ResultView, RosterRow } from '@/modules/results';
import type {
  ClassSkillMean,
  ClassSummary,
} from '@/modules/teacher/types/class-summary-print.types';

/**
 * Summarises the roster read for the printed class report, on the results
 * module's own aggregation layer — an unscored student is never a zero, the
 * Critical gate carries no band, and growth comes only from the server's delta
 * and its reliability flag (no difference is computed here).
 */

function rounded(value: number | null): number | null {
  return value === null ? null : Math.round(value);
}

function growthCounts(views: readonly ResultView[]): Pick<ClassSummary, 'improved' | 'held' | 'slipped'> {
  let improved = 0;
  let held = 0;
  let slipped = 0;
  for (const { overall } of views) {
    if (overall.delta === null || overall.delta_reliable === null) continue;
    if (overall.delta_reliable && overall.delta > 0) improved += 1;
    else if (overall.delta_reliable && overall.delta < 0) slipped += 1;
    else held += 1;
  }
  return { improved, held, slipped };
}

export function summariseClassResults(rows: readonly RosterRow[]): ClassSummary {
  const views = resultViewsOf(rows);
  const { scored, total } = scoredCount(rows);
  const secure = new Map(secureCounts(views).map((count) => [count.skill, count]));
  const subskills = subskillAverages(views).map((average) => {
    const counted = secure.get(average.skill);
    return {
      skill: average.skill,
      mean: Math.round(average.average),
      secure: counted?.secure ?? null,
      assessed: counted?.assessed ?? average.assessed,
    };
  });
  const ranked = weakestFirstAverages(views).map(
    (average): ClassSkillMean => ({ skill: average.skill, mean: Math.round(average.average) }),
  );
  const vocab = vocabStrandMeans(views);

  return {
    scored,
    total,
    mean: rounded(classAverage(views)),
    ...growthCounts(views),
    subskills,
    gap: ranked[0] ?? null,
    strength: ranked.length > 1 ? (ranked[ranked.length - 1] ?? null) : null,
    vocab: { a2: rounded(vocab.a2.average), b1: rounded(vocab.b1.average) },
  };
}
