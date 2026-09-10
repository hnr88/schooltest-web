'use client';

import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { TeacherPortalRow } from '@schooltest/ops-contracts';

import { cn } from '@/lib/utils';
import { EmptyState } from '@/modules/design-system';
import { opsTeacherLabel } from '@/modules/ops/lib/ops-class-detail.helpers';

export interface OpsTeacherPickerProps {
  teachers: readonly TeacherPortalRow[];
  selectedDocumentId: string | null;
  onSelect: (documentId: string) => void;
  /** Caller-supplied so each surface (this row's dialog, task 23's form) keeps its own wording. */
  ariaLabel: string;
}

// Task 22 — the design's radio-row teacher picker (`Ops Portal.dc.html:722-
// 731`), shared by this row's Assign Teacher modal and task 23's class form
// (D-57: presentational only, no `useDirectoryState`, no search toolbar — a
// second directory-kit instance inside a modal fights the host list page's
// own URL-scoped state, which is exactly what sank row 26's import table).
// Suspended teachers (`blocked: true`) are excluded, matching the design's
// own filter (`:1599`); the eligibility the API enforces is unaffected by
// this display-side filter alone. Every row carries the email so a long or
// duplicate name is never ambiguous — the same rule task 20's picker kept.
export function OpsTeacherPicker({
  teachers,
  selectedDocumentId,
  onSelect,
  ariaLabel,
}: OpsTeacherPickerProps) {
  const t = useTranslations('Ops.teacherPicker');
  const eligible = teachers.filter((teacher) => !teacher.blocked);

  if (eligible.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={t('emptyTitle')}
        description={t('emptyDescription')}
        className="border-border"
      />
    );
  }

  return (
    <div role="radiogroup" aria-label={ariaLabel} className="overflow-hidden rounded-card border border-border">
      {eligible.map((teacher, index) => {
        const selected = teacher.documentId === selectedDocumentId;
        const label = opsTeacherLabel(teacher);
        return (
          <button
            key={teacher.documentId}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(teacher.documentId)}
            className={cn(
              'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
              index > 0 && 'border-t border-border',
              selected ? 'bg-secondary/60' : 'bg-card hover:bg-surface-inset',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'grid size-5 flex-none place-items-center rounded-full border-2',
                selected ? 'border-foreground' : 'border-border',
              )}
            >
              {selected ? <span className="size-2 rounded-full bg-foreground" /> : null}
            </span>
            <span
              aria-hidden="true"
              className="grid size-8 flex-none place-items-center rounded-full bg-secondary text-xs font-semibold text-foreground"
            >
              {label.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">{label}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {t('subLabel', { email: teacher.email ?? '—', count: teacher.classes.length })}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
