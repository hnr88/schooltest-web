'use client';

import { AlertTriangle } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Badge, TableCell } from '@/modules/design-system';
import { ResultsMissingValue } from '@/modules/teacher/components/ResultsMissingValue';
import { STUDENTS_TABLE_GROUP_EDGE_CLASS } from '@/modules/teacher/constants/students-table.constants';
import { weakestSkill } from '@/modules/results/lib/class-aggregation';
import type { RosterStudentCellsProps } from '@/modules/teacher/types/students-table.types';

// The five data cells of one roster row (task 33, dashboard §2). Every value is
// printed, never re-derived: the score is `overall.domain_score` ("No result
// yet" where the student has no official Result — never a 0; a present result
// with no score renders the em dash), `delta_display` verbatim, the weakest
// DISPLAY skill from the pure layer (not-assessed is a gap, never weak;
// Critical — no posterior, no band — never compares), the ACARA phase as a chip
// and the ⚠ confidence marker.
//
// CONFIDENCE (the asymmetry ruling): the marker shows when `effort_valid` is
// false OR `low_confidence` is true. `low_confidence: null` is NOT false — null
// means "cannot compute" (task 05/20 ruling) and must never render as either a
// warning or an all-clear. Neither flag censors anything; the row keeps its score.
function RosterStudentCells({ row }: RosterStudentCellsProps) {
  const t = useTranslations('Teacher.results.students');
  const format = useFormatter();
  const view = row.result;
  const score = view?.overall.domain_score ?? null;
  const deltaDisplay = view?.overall.delta_display ?? null;
  const weakest = view === null ? null : weakestSkill(view);
  const phase = view?.acara_phase ?? null;
  const flagged = view !== null && (view.effort_valid === false || view.low_confidence === true);

  return (
    <>
      <TableCell
        data-slot="roster-score"
        className={cn(STUDENTS_TABLE_GROUP_EDGE_CLASS, 'px-3 py-3 font-semibold tabular-nums text-foreground')}
      >
        {view === null ? (
          <span data-slot="roster-no-result" className="font-normal text-muted-foreground">
            {t('noResultYet')}
          </span>
        ) : score === null ? (
          <ResultsMissingValue />
        ) : (
          format.number(score)
        )}
      </TableCell>

      <TableCell data-slot="roster-growth" className="px-3 py-3 tabular-nums text-body">
        {deltaDisplay === null ? <ResultsMissingValue /> : deltaDisplay}
      </TableCell>

      <TableCell data-slot="roster-weakest" className="px-3 py-3 text-body-sm text-body">
        {weakest === null ? <ResultsMissingValue /> : weakest.skill}
      </TableCell>

      <TableCell data-slot="roster-acara" className="px-3 py-3 text-body-sm text-body">
        {phase === null ? <ResultsMissingValue /> : <Badge variant="secondary">{phase}</Badge>}
      </TableCell>

      <TableCell
        data-slot="roster-confidence"
        data-flagged={flagged}
        className="px-3 py-3 text-center"
        {...(flagged ? { 'aria-label': t('flaggedLabel'), title: t('flaggedTooltip') } : {})}
      >
        {flagged ? (
          <span className="inline-flex items-center gap-1 text-warning-ink">
            <AlertTriangle aria-hidden="true" className="size-4" />
            <span className="sr-only">{t('flaggedLabel')}</span>
          </span>
        ) : null}
      </TableCell>
    </>
  );
}

export { RosterStudentCells };
