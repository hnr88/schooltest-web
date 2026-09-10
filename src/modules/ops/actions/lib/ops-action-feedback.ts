import type { OpsActionSummary } from '@/modules/ops/actions/types/ops-action.types';
import type { OpsToastAction } from '@/modules/ops/actions/lib/ops-toast';

export type OpsActionFeedbackTone = 'success' | 'warning' | 'error';

export interface OpsActionFeedback {
  tone: OpsActionFeedbackTone;
  message: string;
  /** Set when some items are neither applied nor refused; drives a Refresh CTA. */
  needsReconciliation: boolean;
  /** Present only when the caller can prove and perform an inverse write. */
  action?: OpsToastAction;
}

function plural(count: number, entityLabel: string): string {
  return `${count} ${count === 1 ? entityLabel : `${entityLabel}s`}`;
}

/**
 * Optional per-surface sentences (R-17). Every member is optional and every
 * default is the English sentence this file shipped with, so omitting the bundle
 * — or any single member of it — returns BYTE-IDENTICAL copy to before.
 *
 * This exists so the wave-5/6 bulk scopes (SchoolAdmin / Classes / Teachers /
 * SchoolStudents) can pass their own copy WITHOUT four separate tasks each
 * editing this file. It adds no behaviour: the branch chosen, the counts, and
 * `needsReconciliation` are unchanged.
 */
export interface OpsRunOutcomeCopy {
  /** allSucceeded. */
  updated?: (items: string) => string;
  /** hasUnresolved — the confirmed prefix, present only when some succeeded. */
  confirmedPrefix?: (items: string) => string;
  /** hasUnresolved — the unconfirmed remainder plus the refresh instruction. */
  unconfirmed?: (items: string) => string;
  /** Nothing applied. */
  nothingChanged?: (refused: string) => string;
  /** Partial: some applied, some refused, optionally some not started. */
  partial?: (applied: string, failed: number, skipped: string) => string;
  /** Partial: the ", N not started" fragment. */
  notStartedFragment?: (items: string) => string;
}

const DEFAULT_COPY: Required<OpsRunOutcomeCopy> = {
  updated: (items) => `${items} updated.`,
  confirmedPrefix: (items) => `${items} confirmed. `,
  unconfirmed: (items) =>
    `${items} could not be confirmed. Refresh to see the current state before retrying.`,
  nothingChanged: (refused) => `Nothing was changed. ${refused} were refused.`,
  partial: (applied, failed, skipped) => `${applied} updated, ${failed} refused${skipped}.`,
  notStartedFragment: (items) => `, ${items} not started`,
};

/**
 * Turn a settled run into the one sentence the operator is told.
 *
 * Every count comes from the run's own results, never from the selection size:
 * saying "12 schools suspended" because twelve were selected is the invented
 * total this whole kit exists to prevent. The success line is reachable ONLY
 * when every accepted target was read back as applied, and any unresolved item
 * downgrades the message to a reconciliation prompt rather than a verdict.
 */
export function describeRunOutcome(
  summary: OpsActionSummary,
  entityLabel: string,
  successAction?: OpsToastAction,
  copy?: OpsRunOutcomeCopy,
): OpsActionFeedback {
  const c = { ...DEFAULT_COPY, ...copy };
  if (summary.allSucceeded) {
    return {
      tone: 'success',
      message: c.updated(plural(summary.succeeded, entityLabel)),
      needsReconciliation: false,
      ...(successAction === undefined ? {} : { action: successAction }),
    };
  }

  if (summary.hasUnresolved) {
    const applied =
      summary.succeeded > 0 ? c.confirmedPrefix(plural(summary.succeeded, entityLabel)) : '';
    return {
      tone: 'warning',
      message: `${applied}${c.unconfirmed(plural(summary.uncertain, entityLabel))}`,
      needsReconciliation: true,
    };
  }

  if (summary.succeeded === 0) {
    return {
      tone: 'error',
      message: c.nothingChanged(plural(summary.failed, entityLabel)),
      needsReconciliation: false,
    };
  }

  const skipped =
    summary.notStarted > 0 ? c.notStartedFragment(plural(summary.notStarted, entityLabel)) : '';
  return {
    tone: 'warning',
    message: c.partial(plural(summary.succeeded, entityLabel), summary.failed, skipped),
    needsReconciliation: false,
  };
}
