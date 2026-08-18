'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { StatusPill, TableCell } from '@/modules/design-system';
import { ResultsMissingValue } from '@/modules/teacher/components/ResultsMissingValue';
import {
  STUDENTS_TABLE_GROUP_EDGE_CLASS,
  TEST_STATE_LABEL_KEY,
  TEST_STATE_TONE,
} from '@/modules/teacher/constants/students-table.constants';
import type { StudentTestCellsProps } from '@/modules/teacher/types/students-table.types';

// The three cells under one test group: Status · Score · ACARA (.qa/DESIGN.md
// §Students tab). The status pill is toned from the server's `state` and prints
// that state's WORD, so the three tones are never the only signal; the score is
// the server's number, formatted for the active locale but not recomputed.
//
// Review G2: a `scoring_failed` result (Lane E's terminal status — retries
// exhausted, the score will NEVER arrive) OVERRIDES the pill even when the
// session itself is `done`: a "Done" pill on a test that can never be scored
// is the dishonest rendering. Danger tone + its own word; the score cell
// stays an honest blank, never 0.
function StudentTestCells({ variant, cell }: StudentTestCellsProps) {
  const t = useTranslations('Teacher.results.students');
  const format = useFormatter();
  const scoringFailed = cell.result_status === 'scoring_failed';

  return (
    <>
      <TableCell
        data-slot="student-test-state"
        data-variant={variant}
        data-state={cell.state}
        data-result-status={cell.result_status ?? undefined}
        className={cn(STUDENTS_TABLE_GROUP_EDGE_CLASS, 'px-3 py-3')}
      >
        {scoringFailed ? (
          <StatusPill tone="danger">{t('stateScoringFailed')}</StatusPill>
        ) : (
          <StatusPill tone={TEST_STATE_TONE[cell.state]}>
            {t(TEST_STATE_LABEL_KEY[cell.state])}
          </StatusPill>
        )}
      </TableCell>

      <TableCell
        data-slot="student-test-score"
        data-variant={variant}
        className="px-3 py-3 font-semibold tabular-nums text-foreground"
      >
        {cell.score === null ? <ResultsMissingValue /> : format.number(cell.score)}
      </TableCell>

      <TableCell
        data-slot="student-test-acara"
        data-variant={variant}
        className="px-3 py-3 text-body-sm text-body"
      >
        {cell.acara_phase === null ? <ResultsMissingValue /> : cell.acara_phase}
      </TableCell>
    </>
  );
}

export { StudentTestCells };
