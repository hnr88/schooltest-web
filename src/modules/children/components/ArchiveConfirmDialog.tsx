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

interface ArchiveConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  pending: boolean;
  onConfirm: () => void;
}

// C-UI-MYCHILDREN §11 confirm dialog for archive only (unarchive is immediate).
// Base UI AlertDialog carries the data-state open/close animations (D-UI-2).
export function ArchiveConfirmDialog({
  open,
  onOpenChange,
  name,
  pending,
  onConfirm,
}: ArchiveConfirmDialogProps) {
  const t = useTranslations('Children');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('archiveDialogTitle', { name })}</AlertDialogTitle>
          <AlertDialogDescription>{t('archiveDialogDescription')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 px-4" disabled={pending}>
            {t('archiveCancel')}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            className="h-11 px-4"
            loading={pending}
            onClick={onConfirm}
          >
            {t('archiveConfirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
