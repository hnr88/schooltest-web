'use client';

import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  Alert,
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@/modules/design-system';

/**
 * `confirm`   — Cancel + a confirming action (the default).
 * `advisory`  — nothing to confirm, so ONE button and no action at all
 *               (design "Nothing to pause"). Not a confirm with a disabled
 *               button: there is no consequence to accept.
 * `two-step`  — the confirming action disappears once `dispatched` is true,
 *               because a dialog cannot recall a request already in the air
 *               (§A-confirm behaviour 1 — `dispatched` is set BEFORE the await
 *               at `use-ops-confirm-action.ts:51`, and `closeDialog` never
 *               claims to undo a dispatch).
 */
export type OpsConfirmVariant = 'confirm' | 'advisory' | 'two-step';

/** The conditional consequence, rendered outside the description's <p>. */
export interface OpsConfirmNotice {
  title: string;
  body: ReactNode;
}

export interface OpsConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: 'neutral' | 'destructive';
  variant?: OpsConfirmVariant;
  pending?: boolean;
  /** Set once the request is in the air; suppresses `two-step`'s action. */
  dispatched?: boolean;
  /** Optional visual above the title (design's icon tile). Collapses when absent. */
  media?: ReactNode;
  /** Optional warning callout. Collapses when absent. */
  notice?: OpsConfirmNotice | null;
  onConfirm: () => void;
}

// The portal's ONE confirm. Built on the AlertDialog primitive so every variant
// dismisses only through its explicit buttons — an alert dialog does not close
// on a backdrop click — and while pending BOTH buttons disable, so an in-flight
// action can neither be double-fired nor lose its confirmation state. The
// destructive tone differs from the neutral one semantically, not just in
// colour: it carries the warning icon and the destructive button variant, and
// is for copy that names the irreversible consequence.
//
// Every string is a prop. That is what lets the three former per-module clones
// (staff action, class delete, student archive) keep their own contractual copy
// while sharing one implementation — de-duplication, not consolidation of copy.
export function OpsConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'neutral',
  variant = 'confirm',
  pending = false,
  dispatched = false,
  media,
  notice,
  onConfirm,
}: OpsConfirmDialogProps) {
  const destructive = tone === 'destructive';
  // An advisory has nothing to accept; a dispatched two-step can no longer be
  // recalled. In both cases the footer is a single dismissal.
  const actionable = variant === 'advisory' ? false : !(variant === 'two-step' && dispatched);
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        {media ? <div className="mb-1">{media}</div> : null}
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {destructive ? (
              <AlertTriangle className="size-4 shrink-0 text-destructive" aria-hidden />
            ) : null}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {notice ? (
          <Alert variant="warning" title={notice.title}>
            {notice.body}
          </Alert>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 px-4" disabled={pending}>
            {cancelLabel}
          </AlertDialogCancel>
          {actionable ? (
            <Button
              type="button"
              variant={destructive ? 'destructive' : 'default'}
              className="h-11 px-4"
              loading={pending}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
