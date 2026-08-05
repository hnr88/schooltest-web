'use client';

import { useTranslations } from 'next-intl';

import { AddClassForm } from '@/modules/classes/components/AddClassForm';
import {
  Alert,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@/modules/design-system';
import { useTeachersQuery } from '@/modules/teachers';

import type { AddClassDialogProps } from '@/modules/classes/types/components.types';

// Spec §2 "Add class modal". The teacher list (C-TCH-01) loads before the form
// mounts so the dropdown has its options, but a failed load never blocks the
// modal: assigning a teacher is optional, so the form still creates the class.
export function AddClassDialog({ onClose }: AddClassDialogProps) {
  const t = useTranslations('Classes.addForm');
  const teachersQuery = useTeachersQuery(true);

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        {teachersQuery.isPending ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            {teachersQuery.isError ? (
              <Alert variant="warning" title={t('teacherLoadError')}>
                {t('teacherLoadErrorDescription')}
              </Alert>
            ) : null}
            <AddClassForm teachers={teachersQuery.data ?? []} onClose={onClose} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
