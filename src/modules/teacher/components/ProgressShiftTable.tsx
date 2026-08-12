'use client';

import { useTranslations } from 'next-intl';

import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import { ProgressShiftRow } from '@/modules/teacher/components/ProgressShiftRow';
import { PROGRESS_SHIFT_SCROLL_CLASS } from '@/modules/teacher/constants/class-progress.constants';
import type { ProgressShiftTableProps } from '@/modules/teacher/types/class-progress.types';

// .qa/DESIGN.md §Progress tab: the "Subskill mastery shift" table — columns
// `Subskill · Test A · Test B · Change`, one row per subskill, `14 / 19`, `+2`.
//
// The wireframe's caption reads "Students mastered (≥80%) per subskill". The 80 is
// NOT reproduced: that cut is `Config.teacher_mastery_bands` and is configurable
// server-side, so printing it here would be a client-side copy of a server number
// that can change under it. The caption says the server applied the threshold,
// exactly as the Teaching insights caption already does.
//
// Rows keep C-TR-4's order (ATTRIBUTE_ORDER.reading) and are never re-sorted by
// change; names are the server's `name` (the active crosswalk descriptors), never
// a client codebook.
function ProgressShiftTable({ shift, compared }: ProgressShiftTableProps) {
  const t = useTranslations('Teacher.results.progress');

  return (
    <section
      data-slot="progress-shift"
      aria-labelledby="progress-shift-heading"
      className="flex flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
    >
      <div className="flex flex-col gap-1">
        <h2 id="progress-shift-heading" className="text-panel-title font-bold text-foreground">
          {t('shiftTitle')}
        </h2>
        <p className="text-meta text-muted-foreground">
          {t('shiftCaption', { count: compared })}
        </p>
      </div>

      <div className={PROGRESS_SHIFT_SCROLL_CLASS}>
        <Table data-slot="progress-shift-table" className="min-w-lg">
          <TableCaption className="sr-only">{t('shiftTableCaption')}</TableCaption>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead scope="col" className="px-3 text-meta text-muted-foreground">
                {t('subskill')}
              </TableHead>
              <TableHead scope="col" className="px-3 text-meta text-muted-foreground">
                {t('testA')}
              </TableHead>
              <TableHead scope="col" className="px-3 text-meta text-muted-foreground">
                {t('testB')}
              </TableHead>
              <TableHead scope="col" className="px-3 text-meta text-muted-foreground">
                {t('change')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shift.map((entry) => (
              <ProgressShiftRow key={entry.attribute} entry={entry} compared={compared} />
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export { ProgressShiftTable };
