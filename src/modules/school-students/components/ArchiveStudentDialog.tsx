'use client';

import { useTranslations } from 'next-intl';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@/modules/design-system';
import { studentDisplayName } from '@/modules/school-students/hooks/use-student-row-actions';
import type { SchoolStudent } from '@/modules/school-students/types/school-students.types';

import type { ArchiveStudentDialogProps } from '@/modules/school-students/types/components.types';

// C-CHD-04 confirm. The description carries the contract promise in plain
// language: the seat is freed, the record and results stay on file.
export function ArchiveStudentDialog({
  student,
  open,
  onOpenChange,
  pending,
  onConfirm,
}: ArchiveStudentDialogProps) {
  const t = useTranslations('SchoolStudents.archiveDialog');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title', { name: studentDisplayName(student) })}</AlertDialogTitle>
          <AlertDialogDescription>{t('description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 px-4" disabled={pending}>
            {t('cancel')}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            className="h-11 px-4"
            loading={pending}
            onClick={onConfirm}
          >
            {t('confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
