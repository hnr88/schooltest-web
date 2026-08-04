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
import { childDisplayName } from '@/modules/school-children/hooks/use-child-row-actions';
import type { SchoolChild } from '@/modules/school-children/types/school-children.types';

import type { ArchiveChildDialogProps } from '@/modules/school-children/types/components.types';

// C-CHD-04 confirm. The description carries the contract promise in plain
// language: the seat is freed, the record and results stay on file.
export function ArchiveChildDialog({
  child,
  open,
  onOpenChange,
  pending,
  onConfirm,
}: ArchiveChildDialogProps) {
  const t = useTranslations('SchoolChildren.archiveDialog');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title', { name: childDisplayName(child) })}</AlertDialogTitle>
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
