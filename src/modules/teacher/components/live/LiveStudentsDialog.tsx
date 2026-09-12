'use client';

import { useTranslations } from 'next-intl';

import { OpsConfirmDialog } from '@/modules/ops';
import type { LiveDialog, LiveRowActionKey } from '@/modules/teacher/types/live-students.types';

const DESTRUCTIVE: ReadonlySet<LiveRowActionKey> = new Set<LiveRowActionKey>(['markAbsent', 'forceSubmit']);

// The design's confirms (:3380–3500 rows, :3345–3362 batches) on the shared
// teacher-skinned dialog. A refusal from the server stays in the dialog as its
// own sentence rather than closing over the failure.
function LiveStudentsDialog({
  dialog,
  pending,
  error,
  onConfirm,
  onClose,
}: {
  dialog: LiveDialog | null;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = useTranslations('TeacherPortal.live.students');
  if (dialog === null) return null;

  if (dialog.type === 'nothing') {
    return (
      <OpsConfirmDialog
        open
        skin="teacher"
        variant="advisory"
        onOpenChange={onClose}
        title={t(`batch.${dialog.kind}.nothing`)}
        description={t('batch.nothingBody', {
          students: t('batch.students', { count: dialog.selectedCount }),
          reason: t(`batch.${dialog.kind}.only`),
        })}
        confirmLabel={t('gotIt')}
        cancelLabel={t('gotIt')}
        onConfirm={onClose}
      />
    );
  }

  if (dialog.type === 'batch') {
    const { kind, eligible, selectedCount } = dialog.plan;
    const students = t('batch.students', { count: eligible.length });
    const skipped = selectedCount - eligible.length;
    const note = skipped > 0 ? ` ${t('batch.skipped', { count: skipped, reason: t(`batch.${kind}.only`) })}` : '';
    return (
      <OpsConfirmDialog
        open
        skin="teacher"
        onOpenChange={onClose}
        pending={pending}
        error={error}
        tone={kind === 'absent' ? 'destructive' : 'neutral'}
        title={t(`batch.${kind}.title`, { students })}
        description={`${t(`batch.${kind}.body`, { students })}${note}`}
        confirmLabel={t(`batch.${kind}.cta`)}
        cancelLabel={t('cancel')}
        onConfirm={onConfirm}
      />
    );
  }

  const { key, row } = dialog;
  const copy = key === 'forceSubmit' && row.emptyAttempt ? 'forceEmpty' : key;
  return (
    <OpsConfirmDialog
      open
      skin="teacher"
      onOpenChange={onClose}
      pending={pending}
      error={error}
      tone={DESTRUCTIVE.has(key) ? 'destructive' : 'neutral'}
      title={t(`confirm.${copy}.title`, { name: row.name })}
      description={t(`confirm.${copy}.body`, { name: row.name })}
      confirmLabel={t(`confirm.${copy}.cta`)}
      cancelLabel={t('cancel')}
      onConfirm={onConfirm}
    />
  );
}

export { LiveStudentsDialog };
