'use client';

import { useTranslations } from 'next-intl';

import { OpsConfirmDialog } from '@/modules/ops';
import { studentDisplayName } from '@/modules/school-students/hooks/use-student-row-actions';

import type { ArchiveStudentDialogProps } from '@/modules/school-students/types/components.types';

// C-CHD-04 confirm. The description carries the contract promise in plain
// language: the seat is freed, the record and results stay on file.
//
// De-duplicated onto the portal's ONE confirm (U-24 / R-19). The copy keys are
// unchanged — `SchoolStudents.archiveDialog.*` still owns every string here.
export function ArchiveStudentDialog({
  student,
  open,
  onOpenChange,
  pending,
  onConfirm,
}: ArchiveStudentDialogProps) {
  const t = useTranslations('SchoolStudents.archiveDialog');

  return (
    <OpsConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('title', { name: studentDisplayName(student) })}
      description={t('description')}
      cancelLabel={t('cancel')}
      confirmLabel={t('confirm')}
      tone="destructive"
      className="sm:max-w-[450px]"
      pending={pending}
      onConfirm={onConfirm}
    />
  );
}
