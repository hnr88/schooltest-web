'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { classifyEndSessionError } from '@/modules/teacher/lib/end-session';
import { useCloseTestSessionMutation } from '@/modules/teacher/queries/use-close-test-session.mutation';
import type { EndSessionState } from '@/modules/teacher/types/end-session.types';

/**
 * "End session" — the confirm-then-close flow behind C-TS-4.
 *
 * Confirmation is the repo's AlertDialog convention (`ArchiveConfirmDialog`),
 * never `window.confirm`: a native dialog is untestable, unstyleable and blocks
 * the whole renderer.
 *
 * The teacher is told what the SERVER said, in three distinguishable outcomes:
 *  · 200                 -> success toast, dialog closes.
 *  · 400 / E2-11         -> INFO toast "already closed". The sitting is closed,
 *                           which is what was asked, so it is not an error; the
 *                           mutation refreshes the reads either way.
 *  · anything else        -> error toast, and the dialog STAYS OPEN so the
 *                           teacher can retry. Nothing is optimistically flipped
 *                           to closed — the grid keeps showing the real payload.
 */
export function useEndSession(sittingDocumentId: string): EndSessionState {
  const t = useTranslations('Teacher.testSessions.live');
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const close = useCloseTestSessionMutation();

  const confirm = () => {
    close.mutate(sittingDocumentId, {
      onSuccess: () => {
        setConfirmOpen(false);
        toast.success(t('endedToast'));
      },
      onError: (error) => {
        if (classifyEndSessionError(error) === 'already_closed') {
          setConfirmOpen(false);
          toast.info(t('alreadyClosedToast'));
          return;
        }
        toast.error(t('endErrorToast'));
      },
    });
  };

  return {
    isConfirmOpen,
    isPending: close.isPending,
    openConfirm: () => setConfirmOpen(true),
    setConfirmOpen,
    confirm,
  };
}
