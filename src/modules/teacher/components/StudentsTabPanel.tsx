'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { StudentsResultsTable } from '@/modules/teacher/components/StudentsResultsTable';
import { sortRosterRows } from '@/modules/results/lib/roster-order';
import type { StudentsTabPanelProps } from '@/modules/teacher/types/students-table.types';

// The Students tab (task 33). It renders the ONE roster read the class-detail
// screen already made — no second request, no client-side merge and no
// placeholder row: an empty array is only ever an EMPTY ROSTER, because a
// failed read never reaches this panel (ClassResultsScreen renders its error
// branch instead).
//
// ops/34: search, the ACARA phase filter, the sorts and every state are the
// directory kit's (the bespoke phase select retired into the kit's filter
// def — same field, same semantics). The panel keeps only the loaded order:
// `sortRosterRows` is what the kit's default `roster` sort preserves.
function StudentsTabPanel({ classDocumentId, rows }: StudentsTabPanelProps) {
  const t = useTranslations('Teacher.results.students');
  const ordered = useMemo(() => sortRosterRows(rows), [rows]);

  return (
    <section
      data-slot="students-tab-panel"
      data-student-count={rows.length}
      aria-labelledby="students-tab-heading"
      className="flex flex-col gap-4 rounded-card bg-card px-4 py-6 shadow-sm sm:px-6"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h2 id="students-tab-heading" className="text-panel-title font-semibold text-foreground">
          {t('title')}
        </h2>
        <p className="text-meta text-muted-foreground">{t('hint')}</p>
      </div>

      <StudentsResultsTable classDocumentId={classDocumentId} rows={ordered} />
    </section>
  );
}

export { StudentsTabPanel };
