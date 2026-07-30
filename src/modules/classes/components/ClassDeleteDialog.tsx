'use client';

import { useTranslations } from 'next-intl';

import type { SchoolClass } from '@/modules/classes/types/classes.types';
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

interface ClassDeleteDialogProps {
  schoolClass: SchoolClass;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onConfirm: () => void;
}

// C-CLS-04 confirm. The description carries the contract promise in plain
// language: students are unlinked, never deleted.
export function ClassDeleteDialog({
  schoolClass,
  open,
  onOpenChange,
  pending,
  onConfirm,
}: ClassDeleteDialogProps) {
  const t = useTranslations('Classes.deleteDialog');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title', { name: schoolClass.name })}</AlertDialogTitle>
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
