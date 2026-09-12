'use client';

import { CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { ReactNode } from 'react';

import {
  Input,
  Label,
  OPS_CONTROL_CLASS,
  OpsDialog,
  OpsDialogCancel,
  OpsDialogClose,
  OpsDialogContent,
  OpsDialogCta,
  OpsDialogDescription,
  OpsDialogTitle,
} from '@/modules/design-system';
import { typedNameMatches } from '@/modules/ops/actions';
import { OPS_CONFIRM_SKIN_CLASSES } from '@/modules/ops/constants/components.constants';
import { cn } from '@/lib/utils';

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

/** `ops` — the portal's own chrome (the default). `teacher` — Teacher Portal v2's confirm. */
export type OpsConfirmSkin = keyof typeof OPS_CONFIRM_SKIN_CLASSES;

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
 * still legible to an operator who presses it. A matched press (or no gate
 * at all) reaches `onConfirm` unchanged.
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
  /**
   * Absent (`ops`): the portal's confirm, unchanged. `teacher`: Teacher Portal v2's
   * confirm (`Teacher Portal v2.dc.html:1846-1853`) — no tone tile, the action leads
   * a left-aligned row, and the panel, type and buttons take the design's values.
   */
  skin?: OpsConfirmSkin;
  className?: string;
  onConfirm: () => void;
}

// The portal's ONE confirm, rebuilt on the ops modal chrome (`:819-841`:
// 460px, panel padding 28, 44px tone icon tile, 19px title, 14px body, 46px
// typed input, right-aligned pill row) with `disablePointerDismissal` so every
// variant still dismisses only through its explicit buttons, and while pending
// BOTH buttons disable, so an in-flight action can neither be double-fired nor
// lose its confirmation state. The destructive tone differs from the neutral
// one semantically, not just in colour: it carries the warning icon and the
// destructive button, and is for copy that names the irreversible consequence.
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
  skin = 'ops',
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
  const skinClasses = OPS_CONFIRM_SKIN_CLASSES[skin];
  // The teacher design has no tone tile and leads its row with the action (`:1850-1852`).
  const teacher = skin === 'teacher';
  const action = actionable ? (
    <OpsDialogCta
      type="button"
      loading={pending}
      aria-disabled={dimmed || undefined}
      className={cn(skinClasses.cta, destructive && 'bg-[#B42318] hover:bg-[#91201A]', dimmed && 'opacity-55')}
      onClick={() => {
        if (dimmed) {
          setMismatchFlash(true);
          return;
        }
        onConfirm();
      }}
    >
      {confirmLabel}
    </OpsDialogCta>
  ) : null;
  return (
    <OpsDialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <OpsDialogContent role="alertdialog" className={cn(skinClasses.panel, className)}>
        <div className={skinClasses.inner}>
          {media ? <div className="mb-4">{media}</div> : null}
          {teacher ? null : (
            <div
              aria-hidden="true"
              className={
                'mb-4 grid size-11 place-items-center rounded-[14px] ' +
                (destructive ? 'bg-[#FEE4E2] text-[#B42318]' : 'bg-[#F4F6FA] text-[#0E2350]')
              }
            >
              <CircleAlert className="size-5" />
            </div>
          )}
          <OpsDialogTitle className={skinClasses.title}>{title}</OpsDialogTitle>
          <OpsDialogDescription className={skinClasses.description}>{description}</OpsDialogDescription>
          {notice ? (
            <div className="mt-4 rounded-[14px] bg-[#F4F6FA] px-4 py-3 text-[13px] leading-relaxed text-[#3D4A5C]">
              <p className="font-semibold text-[#0E2350]">{notice.title}</p>
              <p className="mt-1">{notice.body}</p>
            </div>
          ) : null}
          {typed === undefined ? null : (
            <div className="mt-[18px] flex flex-col">
              <Label htmlFor={typedInputId} className="mb-[7px] text-[12.5px] font-semibold text-[#0E2350]">
                {/* `name` is the rich TAG; the name itself interpolates through
                    `schoolName` — the old `<name>{name}</name>` message made
                    next-intl interpolate the tag callback, which dropped the
                    name and logged a functions-as-children error. */}
                {tTyped.rich('typeToConfirm', {
                  name: (chunks) => <span className="font-semibold">{chunks}</span>,
                  schoolName: typed.requiredName,
                })}
              </Label>
              <Input
                id={typedInputId}
                value={typed.value}
                autoComplete="off"
                disabled={pending}
                className={`h-[46px] rounded-xl ${OPS_CONTROL_CLASS}`}
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
            <p
              id={`${typedInputId}-error`}
              role="alert"
              className="mt-3 flex items-center gap-2 text-[12.5px] font-semibold text-[#B42318]"
            >
              <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
              {alertMessage}
            </p>
          )}
          <div className={skinClasses.actions}>
            {teacher ? action : null}
            <OpsDialogClose render={<OpsDialogCancel disabled={pending} className={skinClasses.cancel} />}>
              {cancelLabel}
            </OpsDialogClose>
            {teacher ? null : action}
          </div>
        </div>
      </OpsDialogContent>
    </OpsDialog>
  );
}
