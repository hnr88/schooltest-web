'use client';

import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
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
  Input,
  Label,
} from '@/modules/design-system';
import { typedNameMatches } from '@/modules/ops/actions';

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

/**
 * The design's typed-name gate (`Ops Portal.dc.html:830-842`, `:1633-1649`),
 * carried as ONE additive prop so the generic dialog stays a plain confirm for
 * every existing caller. Unlike the kit's `OpsTypedNameConfirm` — which
 * disables its action until the name matches — the design keeps the confirming
 * action CLICKABLE at 0.55 opacity (`:1638` `ctaOpacity: (busy || !typedOk) ?
 * 0.55 : 1`) and answers a mismatched press with
 * "Type the name exactly as shown to confirm." (`:1649`), so a locked gate is
 * still legible to an operator who presses it. A matched press (or no gate at
 * all) reaches `onConfirm` unchanged.
 */
export interface OpsConfirmTypedGate {
  /** The exact name the operator must retype. */
  requiredName: string;
  value: string;
  onChange: (value: string) => void;
  /** Shown when the action is pressed while the name does not match. */
  mismatchMessage: string;
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
  /** The typed-name gate. Absent: a plain confirm, byte-identical to before. */
  typed?: OpsConfirmTypedGate;
  /**
   * A failure the dialog owns (the server's refusal, kept by the confirm hook).
   * One alert line; the typed mismatch flash takes precedence while it is live.
   */
  error?: string | null;
  className?: string;
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
  typed,
  error = null,
  className,
  onConfirm,
}: OpsConfirmDialogProps) {
  const tTyped = useTranslations('Ops.typedNameConfirm');
  const typedInputId = 'ops-confirm-typed-name';
  // A mismatched press flashes the design's message; typing clears it. The
  // dialog mounts fresh per open (consumers render it only while open), so no
  // stale flash survives a reopen.
  const [mismatchFlash, setMismatchFlash] = useState(false);
  const destructive = tone === 'destructive';
  // An advisory has nothing to accept; a dispatched two-step can no longer be
  // recalled. In both cases the footer is a single dismissal.
  const actionable = variant === 'advisory' ? false : !(variant === 'two-step' && dispatched);
  const nameOk = typed === undefined || typedNameMatches(typed.value, typed.requiredName);
  // The design dims a not-yet-satisfied typed action without disabling it.
  const dimmed = typed !== undefined && !nameOk;
  const alertMessage =
    (typed !== undefined && mismatchFlash ? typed.mismatchMessage : null) ?? error;
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm" className={className}>
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
        {typed === undefined ? null : (
          <div className="flex flex-col gap-2">
            <Label htmlFor={typedInputId}>
              {tTyped.rich('typeToConfirm', {
                name: (chunks) => <span className="font-semibold">{chunks}</span>,
              })}
            </Label>
            <Input
              id={typedInputId}
              value={typed.value}
              autoComplete="off"
              disabled={pending}
              aria-invalid={alertMessage !== null}
              aria-describedby={alertMessage === null ? undefined : `${typedInputId}-error`}
              onChange={(event) => {
                setMismatchFlash(false);
                typed.onChange(event.target.value);
              }}
            />
          </div>
        )}
        {alertMessage === null ? null : (
          <p id={`${typedInputId}-error`} role="alert" className="text-sm text-destructive">
            {alertMessage}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 px-4" disabled={pending}>
            {cancelLabel}
          </AlertDialogCancel>
          {actionable ? (
            <Button
              type="button"
              variant={destructive ? 'destructive' : 'default'}
              className={dimmed ? 'h-11 px-4 opacity-55' : 'h-11 px-4'}
              loading={pending}
              aria-disabled={dimmed || undefined}
              onClick={() => {
                if (dimmed) {
                  setMismatchFlash(true);
                  return;
                }
                onConfirm();
              }}
            >
              {confirmLabel}
            </Button>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
