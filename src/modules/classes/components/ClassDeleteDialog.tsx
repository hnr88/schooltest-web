'use client';

import { useTranslations } from 'next-intl';

import { OpsConfirmDialog } from '@/modules/ops';

import type { ClassDeleteDialogProps } from '@/modules/classes/types/components.types';

// C-CLS-04 confirm. The description carries the contract promise in plain
// language: students are unlinked, never deleted.
//
// De-duplicated onto the portal's ONE confirm (U-24 / R-19). The copy keys are
// unchanged — `Classes.deleteDialog.*` still owns every string here.
export function ClassDeleteDialog({
  schoolClass,
  open,
  onOpenChange,
  pending,
  onConfirm,
}: ClassDeleteDialogProps) {
  const t = useTranslations('Classes.deleteDialog');

  return (
    <OpsConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('title', { name: schoolClass.name })}
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
