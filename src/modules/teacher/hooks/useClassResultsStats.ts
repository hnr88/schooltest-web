'use client';

import { useTranslations } from 'next-intl';

import type {
  ClassResultsHeaderProps,
  ClassResultsStatItem,
} from '@/modules/teacher/types/results-shell.types';

/**
 * The class-detail header of .qa/DESIGN.md §Results — Test A / Test B completed,
 * Avg score, Top gap — every value read straight out of C-TR-1's `summary`.
 * Nothing here averages, counts or thresholds anything: the portal formats the
 * numbers the server derived and no others.
 *
 * A `null` `avg_score` or `top_gap` renders as an explicit absence WITH the
 * reason — never `0`, never `0 / 100`, never an invented subskill. The server
 * sends `null` exactly when it has no evidence to report
 * (`schooltest-api/src/api/teacher/services/class-students-rows.ts`
 * `classStudentsSummary`).
 *
 * Both are counted over each student's MOST RECENT scored attempt rather than
 * over Test A, so the footnote says so: the wireframe's "Test A" footnote was
 * true only while Test A was the only test that existed.
 */
export function useClassResultsStats(
  summary: ClassResultsHeaderProps['summary'],
): readonly ClassResultsStatItem[] {
  const t = useTranslations('Teacher.results.detail');
  const gap = summary.top_gap;
  const avgScore = summary.avg_score;

  return [
    {
      key: 'test-a',
      label: t('testA'),
      value: t('completionValue', summary.test_a),
      note: t('completedNote'),
    },
    {
      key: 'test-b',
      label: t('testB'),
      value: t('completionValue', summary.test_b),
      note: t('completedNote'),
    },
    {
      key: 'avg-score',
      label: t('avgScore'),
      value: avgScore === null ? t('noValue') : t('scoreValue', { score: avgScore }),
      note: avgScore === null ? t('avgScoreNone') : t('latestTestBasis'),
    },
    {
      key: 'top-gap',
      label: t('topGap'),
      value: gap === null ? t('noValue') : gap.name,
      pill: gap === null ? undefined : t('notYetCount', { count: gap.not_yet_count }),
      note: gap === null ? t('topGapNone') : t('latestTestBasis'),
    },
  ];
}
