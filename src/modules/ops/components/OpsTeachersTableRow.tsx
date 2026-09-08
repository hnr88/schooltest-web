'use client';

import { useTranslations } from 'next-intl';
import { Check, Eye, Pencil, Trash2, X } from 'lucide-react';

import { Button, FieldShell, Input } from '@/modules/design-system';
import {
  teacherClassLabel,
  teacherLastActiveLabel,
} from '@/modules/ops/lib/teachers-list.lib';
import type { OpsTeacherRow as TeacherRow } from '@/modules/ops/types/ops.types';

import type { OpsPortalTeacherRowProps } from '@/modules/ops/types/teachers-list.types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COLUMN_COUNT = 7;

// One staff row of the OPS teachers dialog: read mode, edit mode (the exact
// C-TCH-04 whitelist — first/last/email) or the inline remove-confirm.
// C-OPS-PORTAL-021 (OPS-031) adds the Specialty and Last activity columns; both
// are stored values, and a null one renders the source-style empty fallback
// rather than a guess. Class, Specialty and Last activity are read-only: no
// backing write exists anywhere (⚠️ ruling open with the client).
export function OpsTeachersTableRow({
  row,
  editing,
  onEditingChange,
  removing,
  onRemovingChange,
  onSave,
  onRemove,
  savePending,
  removePending,
  error,
  onViewAs,
}: OpsPortalTeacherRowProps) {
  const t = useTranslations('Ops.teachers');
  const viewAs = useTranslations('Ops.viewAsTeacher');
  const classes = teacherClassLabel(row.classes);
  const specialty = row.teaching_specialty ?? t('noSpecialty');
  const lastActive = teacherLastActiveLabel(row.last_active_at) ?? t('noActivity');

  const setField = (key: 'first_name' | 'last_name' | 'email', value: string) =>
    editing &&
    onEditingChange({ documentId: row.documentId, values: { ...editing.values, [key]: value } });

  if (removing) {
    return (
      <tr className="border-b border-border/60" data-slot="ops-teacher-remove-confirm">
        <td colSpan={COLUMN_COUNT} className="py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{error ?? t('removeConfirm', { email: row.email ?? '' })}</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                loading={removePending}
                onClick={onRemove}
              >
                {t('removeConfirmAction')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemovingChange(null)}
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  if (editing) {
    const invalidEmail = editing.values.email !== '' && !EMAIL_PATTERN.test(editing.values.email);
    return (
      <tr
        className="border-b border-border/60"
        data-slot="ops-teacher-edit-row"
        data-teacher-email={row.email ?? undefined}
      >
        {(['first_name', 'last_name', 'email'] as const).map((key) => (
          <td key={key} className="py-2 pr-3">
            <FieldShell
              id={`ops-teacher-${key}-${row.documentId}`}
              label={t(
                `column${key === 'first_name' ? 'FirstName' : key === 'last_name' ? 'LastName' : 'Email'}`,
              )}
              errorText={
                key === 'email'
                  ? invalidEmail
                    ? t('invalidEmail')
                    : (error ?? undefined)
                  : undefined
              }
            >
              <Input
                id={`ops-teacher-${key}-${row.documentId}`}
                type={key === 'email' ? 'email' : 'text'}
                value={editing.values[key]}
                onChange={(e) => setField(key, e.target.value)}
              />
            </FieldShell>
          </td>
        ))}
        <td className="py-2 pr-3 text-muted-foreground">{specialty}</td>
        <td className="py-2 pr-3 text-muted-foreground">{classes || t('noClasses')}</td>
        <td className="py-2 pr-3 text-muted-foreground">{lastActive}</td>
        <td className="py-2">
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={t('save')}
              loading={savePending}
              disabled={
                !editing.values.first_name.trim() ||
                !editing.values.last_name.trim() ||
                invalidEmail
              }
              onClick={onSave}
            >
              <Check aria-hidden="true" className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={t('cancel')}
              onClick={() => onEditingChange(null)}
            >
              <X aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr
      className="border-b border-border/60"
      data-slot="ops-teacher-row"
      data-teacher-email={row.email ?? undefined}
    >
      <td className="py-2 pr-3">{row.first_name ?? '—'}</td>
      <td className="py-2 pr-3">{row.last_name ?? '—'}</td>
      <td className="py-2 pr-3">{row.email ?? '—'}</td>
      <td className="py-2 pr-3 text-muted-foreground" data-slot="ops-teacher-specialty">
        {specialty}
      </td>
      <td className="py-2 pr-3 text-muted-foreground" data-slot="ops-teacher-classes">
        {classes || t('noClasses')}
      </td>
      <td className="py-2 pr-3 text-muted-foreground" data-slot="ops-teacher-last-active">
        {lastActive}
      </td>
      <td className="py-2">
        <div className="flex justify-end gap-1">
          {/* Ledger 11c — the audited impersonation read. The visible label
              says "View as teacher" and the accessible name says it is
              impersonation, because the operator must know what the click is
              before it is recorded against them. */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-slot="ops-view-as-teacher-open"
            data-teacher={row.documentId}
            aria-label={viewAs('openAriaLabel', { teacher: row.email ?? row.documentId })}
            onClick={() => onViewAs(row.documentId)}
          >
            <Eye aria-hidden="true" className="size-4" />
            {viewAs('openCta')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={t('edit')}
            onClick={() =>
              onEditingChange({
                documentId: row.documentId,
                values: {
                  first_name: row.first_name ?? '',
                  last_name: row.last_name ?? '',
                  email: row.email ?? '',
                },
              })
            }
          >
            <Pencil aria-hidden="true" className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={t('remove')}
            onClick={() => onRemovingChange(row.documentId)}
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export type { TeacherRow };
