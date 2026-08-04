'use client';

import { useState } from 'react';

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

import type { ResitButtonProps } from '@/modules/test-day/types/components.types';

// Per-row C-SIT-03 re-sit with a confirm dialog (absent or crashed students
// get another go; the description carries that promise in plain language).
export function ResitButton({ studentName, pending, onConfirm }: ResitButtonProps) {
  const t = useTranslations('TestDay.resit');
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-11 px-3"
        onClick={() => setOpen(true)}
      >
        {t('cta')}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmTitle', { name: studentName })}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 px-4" disabled={pending}>
              {t('cancel')}
            </AlertDialogCancel>
            <Button
              type="button"
              className="h-11 px-4"
              loading={pending}
              onClick={() => {
                onConfirm();
                setOpen(false);
              }}
            >
              {t('confirm')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
