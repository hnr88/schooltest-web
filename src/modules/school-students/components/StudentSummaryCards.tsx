'use client';

import { useTranslations } from 'next-intl';

import {
  toAcaraPhase,
  toDiagnosticStatus,
} from '@/modules/school-students/lib/student-level';

import type { SchoolStudentRecord } from '@/modules/school-students/types/school-students.types';

interface StudentSummaryCardsProps {
  student: SchoolStudentRecord;
}

interface SummaryCard {
  label: string;
  value: string;
  sub?: string;
}

// School Admin Portal design (:457-470) — the drill-down's KPI strip: auto-fit
// 180px-floor cards, radius 20, the 12/600 uppercase label, the 26/700 value
// and the 12.5px sub. Every figure is a field the record already carries
// (level, diagnostic, class, lifecycle status) — nothing is invented.
export function StudentSummaryCards({ student }: StudentSummaryCardsProps) {
  const t = useTranslations('SchoolStudents');
  const level = toAcaraPhase(student.acara_phase);

  const cards: SummaryCard[] = [
    {
      label: t('table.columnLevel'),
      value: level ? t(`form.acaraPhaseOption.${level}`) : t('table.notSet'),
      sub: t('form.acaraPhase'),
    },
    {
      label: t('table.columnDiagnostic'),
      value: t(`table.diagnosticOption.${toDiagnosticStatus(student.diagnostic_status)}`),
    },
    {
      label: t('table.columnClass'),
      value: student.class?.name ?? t('table.classNone'),
    },
    {
      label: t('filters.statusLabel'),
      value:
        student.status === null
          ? t('table.notSet')
          : t(student.status === 'archived' ? 'table.statusArchived' : 'table.statusActive'),
    },
  ];

  return (
    <div data-slot="student-summary-cards" className="flex flex-wrap gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          data-slot="student-summary-card"
          className="min-w-[180px] flex-1 rounded-[20px] bg-card px-[22px] py-5 shadow-sm"
        >
          <div className="text-xs font-semibold tracking-[0.05em] text-[#9AA6B8] uppercase">
            {card.label}
          </div>
          <div className="mt-[9px] truncate text-[26px] font-bold tracking-[-0.02em] text-foreground">
            {card.value}
          </div>
          {card.sub === undefined ? null : (
            <div className="mt-1 text-meta text-[#7C8698]">{card.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}
