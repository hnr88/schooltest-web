'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { progressDelta } from '@/modules/teacher/lib/class-progress';
import type { ProgressStatItem } from '@/modules/teacher/types/class-progress.types';
import type { ProgressSummary } from '@/modules/teacher/types/teacher-progress.types';

/**
 * The four cells of .qa/DESIGN.md §Progress tab's stat row: `Avg score change
 * 62 → 71 ↑9`, `Students improved 15/19`, `No change 2/19`, `Regressed 2/19`.
 *
 * Every number is C-TR-4's own — `avg_a`, `avg_b`, `avg_delta`,
 * `improved`/`unchanged`/`regressed` — printed through the locale formatter and
 * NOT recomputed. `compared` is the size of the cohort the server actually
 * summarised (improved + unchanged + regressed), so the denominator can never
 * claim more students than were compared.
 *
 * Only the average carries a direction; the three counts are tone-free, because a
 * count has no direction of its own to colour.
 */
export function useProgressStats(summary: ProgressSummary, compared: number): ProgressStatItem[] {
  const t = useTranslations('Teacher.results.progress');
  const format = useFormatter();
  const score = (value: number) => format.number(value, { maximumFractionDigits: 1 });
  const count = (value: number) => t('ofCompared', { count: value, compared });
  const average = progressDelta(summary.avg_delta);

  return [
    {
      key: 'avg-change',
      label: t('avgScoreChange'),
      value: t('avgScoreValue', { from: score(summary.avg_a), to: score(summary.avg_b) }),
      direction: average.direction,
      change: score(average.magnitude),
    },
    {
      key: 'improved',
      label: t('studentsImproved'),
      value: count(summary.improved),
      direction: null,
      change: null,
    },
    {
      key: 'unchanged',
      label: t('noChange'),
      value: count(summary.unchanged),
      direction: null,
      change: null,
    },
    {
      key: 'regressed',
      label: t('regressed'),
      value: count(summary.regressed),
      direction: null,
      change: null,
    },
  ];
}
