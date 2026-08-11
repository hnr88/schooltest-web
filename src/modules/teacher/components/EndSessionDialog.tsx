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
import type { EndSessionDialogProps } from '@/modules/teacher/types/end-session.types';

// The confirmation step for C-TS-4. Deliberately the repo's AlertDialog (the
// `ArchiveConfirmDialog` precedent) and NOT `window.confirm`: the native dialog
// blocks the renderer, cannot be styled or translated, and is invisible to both
// a screen reader's dialog semantics and to automation.
//
// Closing is irreversible for the students mid-test (the cascade terminates
// in-flight sessions), so the description says so in words and the confirm button
// is `destructive`. Both actions are 44px tall (WCAG 2.2 AA target size).
function EndSessionDialog({
  sessionClassName,
  open,
  isPending,
  onOpenChange,
  onConfirm,
}: EndSessionDialogProps) {
  const t = useTranslations('Teacher.testSessions.live');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm" data-slot="end-session-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('endDialogTitle', { className: sessionClassName })}
          </AlertDialogTitle>
          <AlertDialogDescription>{t('endDialogDescription')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 px-4" disabled={isPending}>
            {t('endDialogCancel')}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            className="h-11 px-4"
            data-slot="end-session-confirm"
            loading={isPending}
            onClick={onConfirm}
          >
            {t('endDialogConfirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { EndSessionDialog };
