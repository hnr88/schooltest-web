'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { SelectField } from '@/modules/design-system';
import { EmptyState } from '@/modules/design-system';
import { StudentsResultsTable } from '@/modules/teacher/components/StudentsResultsTable';
import { filterByPhase, phasesOf, sortRosterRows } from '@/modules/results/lib/roster-order';
import type { RosterRow } from '@/modules/results/types/roster.types';
import type { StudentsTabPanelProps } from '@/modules/teacher/types/students-table.types';

// The Students tab (task 33). It renders the ONE roster read the class-detail
// screen already made — no second request, no client-side merge and no
// placeholder row: an empty array is only ever an EMPTY ROSTER, because a
// failed read never reaches this panel (ClassResultsScreen renders its error
// branch instead).
//
// Presentation order and the ACARA phase filter are pure (roster-order.ts):
// lowest score first, result-less students LAST, never as a zero. The filter
// narrows the table only — the tiles in the header always describe the whole
// roster, so a filtered view can never be mistaken for the class summary.
function StudentsTabPanel({ classDocumentId, rows }: StudentsTabPanelProps) {
  const t = useTranslations('Teacher.results.students');
  const [phase, setPhase] = useState<string | null>(null);

  const phases = phasesOf(rows);
  const visible = sortRosterRows(filterByPhase(rows, phase));

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

      {phases.length > 0 ? (
        <div data-slot="roster-phase-filter" className="max-w-64">
          <SelectField
            id="roster-phase-filter-select"
            label={t('filterLabel')}
            placeholder={t('filterAll')}
            value={phase ?? ''}
            onValueChange={(next) => setPhase(next === '' ? null : next)}
            options={[
              { value: '', label: t('filterAll') },
              ...phases.map((name) => ({ value: name, label: name })),
            ]}
          />
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          tone="brand"
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          className="border-none px-0 py-2"
        />
      ) : (
        <StudentsResultsTable classDocumentId={classDocumentId} rows={visible} />
      )}
    </section>
  );
}

export { StudentsTabPanel };
