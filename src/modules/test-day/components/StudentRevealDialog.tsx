'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/modules/design-system';
import type { SittingStatus } from '../types/test-day.types';

interface StudentRevealDialogProps {
  open: boolean;
  onClose: () => void;
  code: string | null;
  status: SittingStatus;
  studentName: string;
  studentEmail: string | null;
}

// C-SIT-05 per-student reveal (mvp-updates §4.5.3): the code is class-wide, so
// revealing it to one student is purely a UI flow over the already-loaded
// monitor payload - no query, no mutation. The audit entry is appended by the
// row action that opens this dialog (use-reveal-audit-store). When the sitting
// is closed or the code is not minted yet, the dialog nudges the teacher to
// use the class-wide reveal first (minting stays with CodeRevealCard).
export function StudentRevealDialog({
  open,
  onClose,
  code,
  status,
  studentName,
  studentEmail,
}: StudentRevealDialogProps) {
  const t = useTranslations('TestDay.studentReveal');
  const tMonitor = useTranslations('TestDay.monitor');
  const canShare = status === 'open' && code !== null;

  function handleCopy() {
    if (code === null) return;
    void navigator.clipboard
      .writeText(code)
      .then(() => toast.success(t('copiedToast')))
      .catch(() => toast.error(t('copyErrorToast')));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent>
        <div data-slot="student-reveal-dialog" className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t('title', { name: studentName })}</DialogTitle>
            <DialogDescription>{t('intro', { name: studentName })}</DialogDescription>
          </DialogHeader>
          <p className="text-sm font-medium text-foreground">
            {studentEmail ?? tMonitor('emailMissing')}
          </p>
          {studentEmail === null ? (
            <p role="alert" className="text-sm text-danger-ink">
              {t('emailMissingNote')}
            </p>
          ) : null}
          {canShare ? (
            <>
              <p
                data-slot="reveal-code-value"
                className="text-4xl font-bold tracking-widest text-foreground"
              >
                {code}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('onlyThisStudent', { name: studentName })}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {status === 'closed' ? t('closedNote') : t('unmintedNote')}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-11 px-4" onClick={onClose}>
              {t('closeCta')}
            </Button>
            {canShare ? (
              <Button
                type="button"
                data-slot="reveal-copy-button"
                className="min-h-11 px-4"
                onClick={handleCopy}
              >
                {t('copyCta')}
              </Button>
            ) : null}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
