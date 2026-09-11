'use client';

import { useTranslations } from 'next-intl';

import { AddClassForm } from '@/modules/classes/components/AddClassForm';
import {
  Alert,
  OpsDialog,
  OpsDialogBody,
  OpsDialogContent,
  OpsDialogHeader,
  Skeleton,
} from '@/modules/design-system';
import { useTeachersQuery } from '@/modules/teachers';

import type { AddClassDialogProps } from '@/modules/classes/types/components.types';

// Spec §2 "Add class modal". The teacher list (C-TCH-01) loads before the form
// mounts so the dropdown has its options, but a failed load never blocks the
// modal: assigning a teacher is optional, so the form still creates the class.
// Modal chrome on the OpsDialog kit (School Admin design: class modal, 520px).
export function AddClassDialog({ onClose }: AddClassDialogProps) {
  const t = useTranslations('Classes.addForm');
  const teachersQuery = useTeachersQuery(true);

  return (
    <OpsDialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <OpsDialogContent className="sm:max-w-[520px]">
        <OpsDialogHeader title={t('title')} sub={t('description')} />
        {teachersQuery.isPending ? (
          <OpsDialogBody>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </OpsDialogBody>
        ) : (
          <>
            {teachersQuery.isError ? (
              <div className="px-7 pt-6">
                <Alert variant="warning" title={t('teacherLoadError')}>
                  {t('teacherLoadErrorDescription')}
                </Alert>
              </div>
            ) : null}
            <AddClassForm teachers={teachersQuery.data ?? []} onClose={onClose} />
          </>
        )}
      </OpsDialogContent>
    </OpsDialog>
  );
}
