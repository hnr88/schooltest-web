'use client';

import { TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  Button,
} from '@/modules/design-system';
import { shouldApplyConfirmOpenChange } from '@/modules/teacher/lib/teacher-overlays';
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
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen, details) => {
        if (shouldApplyConfirmOpenChange('destructive', nextOpen, details.reason)) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <AlertDialogContent size="sm" data-slot="end-session-dialog">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-danger-surface text-danger-strong">
            <TriangleAlert aria-hidden="true" />
          </AlertDialogMedia>
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
