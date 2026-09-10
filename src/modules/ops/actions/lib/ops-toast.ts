import { toast } from 'sonner';

import type { OpsActionSummary } from '@/modules/ops/actions/types/ops-action.types';

import { describeRunOutcome } from './ops-action-feedback';

export type OpsToastTone = 'ok' | 'warn' | 'error';

export interface OpsToastAction {
  label: string;
  run: () => void | Promise<void>;
}

export interface OpsToastInput {
  tone: OpsToastTone;
  message: string;
  action?: OpsToastAction;
}

const TONE_CLASS: Record<OpsToastTone, string> = {
  ok: '!border-navy-900 !bg-navy-900 !text-white',
  warn: '!border-warning-ink !bg-warning-ink !text-white',
  error: '!border-destructive !bg-destructive !text-destructive-foreground',
};

/** Design-matched Sonner entry point: three tones, one-shot optional action. */
export function showOpsToast({ tone, message, action }: OpsToastInput): string | number {
  let id: string | number = '';
  let ran = false;
  const options = {
    className: TONE_CLASS[tone],
    duration: action === undefined ? 2_800 : 6_000,
    ...(action === undefined
      ? {}
      : {
          action: {
            label: action.label,
            onClick: () => {
              if (ran) return;
              ran = true;
              toast.dismiss(id);
              void action.run();
            },
          },
        }),
  };
  const show = tone === 'ok' ? toast.success : tone === 'warn' ? toast.warning : toast.error;
  id = show(message, options);

  return id;
}

const TONE_OF = { success: 'ok', warning: 'warn', error: 'error' } as const;

/**
 * R-21 — the one outcome entry point for a settled bulk run: tone and message
 * come from `describeRunOutcome`, which derives every count from the run's own
 * results, never from the selection size. A `needsReconciliation` run offers
 * Refresh instead of claiming a verdict; an `allSucceeded` run offers the
 * caller's `undo` action when one was proven.
 */
export function outcomeToast(
  summary: OpsActionSummary,
  entityLabel: string,
  undo?: OpsToastAction,
): string | number {
  const feedback = describeRunOutcome(summary, entityLabel, undo);
  return showOpsToast({
    tone: TONE_OF[feedback.tone],
    message: feedback.message,
    action: feedback.needsReconciliation
      ? { label: 'Refresh', run: () => window.location.reload() }
      : feedback.action,
  });
}
