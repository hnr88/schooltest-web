'use client';

import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { StatusPill, type StatusPillTone } from '@/modules/design-system';
import { REPORTS_HREF } from '@/modules/shell';
import type { DiagnosticMasteryRow, DiagnosticStatus } from '@/modules/teach/types/diagnostic.types';

const STATUS_TONE: Record<DiagnosticStatus, StatusPillTone> = {
  mastered: 'success',
  emerging: 'warning',
  not_mastered: 'danger',
  not_assessed: 'neutral',
};

interface StudentMasteryDrilldownProps {
  row: DiagnosticMasteryRow;
  onClose: () => void;
}

// Individual level, one click down from the class view (tasks 75 and 96,
// mvp-updates §4.9): the selected student's seven reading areas as a list
// (never a grid). A null prob renders as "not yet assessed" - an absence,
// never 0%. When the student has a finished result behind the row
// (C-RPT-01 v2 latest_result_document_id), the drill links one click further
// to the full teacher report for that result; students with no result yet get
// the not-assessed note instead, never a dead link.
export function StudentMasteryDrilldown({ row, onClose }: StudentMasteryDrilldownProps) {
  const t = useTranslations('Teach.diagnostic');

  return (
    <section
      data-slot="student-mastery-drilldown"
      aria-label={t('drilldownTitle', { student: row.student_ref })}
      className="flex flex-col gap-3 rounded-xl border border-primary bg-card px-4 py-4"
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-foreground">
          {t('drilldownTitle', { student: row.student_ref })}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('drilldownClose')}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-body transition-colors duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <ul className="flex flex-col gap-2">
        {row.attributes.map((attribute) => (
          <li
            key={attribute.code}
            className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2"
          >
            <span className="text-sm font-medium text-foreground">
              {t(`areas.${attribute.code}`)}
            </span>
            <StatusPill tone={STATUS_TONE[attribute.status]}>
              {t(`status.${attribute.status}`)}
            </StatusPill>
          </li>
        ))}
      </ul>
      {row.latest_result_document_id ? (
        <Link
          data-slot="drilldown-report-link"
          href={`${REPORTS_HREF}/${row.latest_result_document_id}`}
          className="w-fit text-sm font-semibold text-primary transition-colors duration-150 hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t('reportLink')}
        </Link>
      ) : (
        <p className="max-w-xl text-xs text-muted-foreground">{t('notAssessedNote')}</p>
      )}
    </section>
  );
}
