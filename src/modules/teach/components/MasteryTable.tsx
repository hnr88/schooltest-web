'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { StatusPill, type StatusPillTone } from '@/modules/design-system';
import type { DiagnosticMasteryRow, DiagnosticStatus } from '@/modules/teach/types/diagnostic.types';

// The wire status drives the pill tone directly — no re-thresholding of prob
// on this surface (the scoring engine already applied the cuts, task 50).
const STATUS_TONE: Record<DiagnosticStatus, StatusPillTone> = {
  mastered: 'success',
  emerging: 'warning',
  not_mastered: 'danger',
  not_assessed: 'neutral',
};

interface MasteryTableProps {
  rows: DiagnosticMasteryRow[];
  selectedRef: string | null;
  onSelect: (studentRef: string) => void;
}

// Class mastery list (task 75, mvp-updates §4.9): deliberately NOT a grid —
// one row per student with the seven reading areas as labelled pills, so the
// mastery view and the heat-map grid can never be read as the same kind of
// answer. Selecting a row drills one click down to the student profile.
export function MasteryTable({ rows, selectedRef, onSelect }: MasteryTableProps) {
  const t = useTranslations('Teach.diagnostic');

  return (
    <ul data-slot="mastery-table" className="flex flex-col gap-3">
      {rows.map((row) => {
        const selected = row.student_ref === selectedRef;
        return (
          <li key={row.student_ref}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(row.student_ref)}
              className={cn(
                'flex w-full flex-col gap-3 rounded-xl border bg-card px-4 py-3 text-left transition-colors duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                selected ? 'border-primary' : 'border-border',
              )}
            >
              <span className="text-sm font-semibold text-foreground">{row.student_ref}</span>
              <span className="flex flex-wrap items-center gap-2">
                {row.attributes.map((attribute) => (
                  <span key={attribute.code} className="flex items-center gap-1">
                    <span className="text-xs text-body">{t(`areas.${attribute.code}`)}</span>
                    <StatusPill tone={STATUS_TONE[attribute.status]}>
                      {t(`status.${attribute.status}`)}
                    </StatusPill>
                  </span>
                ))}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
