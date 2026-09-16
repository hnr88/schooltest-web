'use client';

import { useTranslations } from 'next-intl';

import { OpsConfirmDialog } from '@/modules/ops';
import { studentDisplayName } from '@/modules/school-students/hooks/use-student-row-actions';

import type { UnarchiveStudentDialogProps } from '@/modules/school-students/types/components.types';

// D10 — C-CHD-04b's confirm: the exact mirror of the C-CHD-04 archive
// confirm, on the portal's ONE confirm kit. The description carries the
// contract promise in plain language: the student rejoins the active roster
// and re-occupies their seat; nothing is rewritten. `tone` stays neutral —
// restoring is not the destructive act archiving is.
export function UnarchiveStudentDialog({
  student,
  open,
  onOpenChange,
  pending,
  onConfirm,
}: UnarchiveStudentDialogProps) {
  const t = useTranslations('SchoolStudents.unarchiveDialog');

  return (
    <OpsConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('title', { name: studentDisplayName(student) })}
      description={t('description')}
      cancelLabel={t('cancel')}
      confirmLabel={t('confirm')}
      tone="neutral"
      className="sm:max-w-[450px]"
      pending={pending}
      onConfirm={onConfirm}
    />
  );
}
