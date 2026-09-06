import type { OpsActionSummary } from '@/modules/ops/actions/types/ops-action.types';

export type OpsActionFeedbackTone = 'success' | 'warning' | 'error';

export interface OpsActionFeedback {
  tone: OpsActionFeedbackTone;
  message: string;
  /** Set when some items are neither applied nor refused; drives a Refresh CTA. */
  needsReconciliation: boolean;
}

function plural(count: number, entityLabel: string): string {
  return `${count} ${count === 1 ? entityLabel : `${entityLabel}s`}`;
}

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
): OpsActionFeedback {
  if (summary.allSucceeded) {
    return {
      tone: 'success',
      message: `${plural(summary.succeeded, entityLabel)} updated.`,
      needsReconciliation: false,
    };
  }

  if (summary.hasUnresolved) {
    const applied =
      summary.succeeded > 0 ? `${plural(summary.succeeded, entityLabel)} confirmed. ` : '';
    return {
      tone: 'warning',
      message: `${applied}${plural(summary.uncertain, entityLabel)} could not be confirmed. Refresh to see the current state before retrying.`,
      needsReconciliation: true,
    };
  }

  if (summary.succeeded === 0) {
    return {
      tone: 'error',
      message: `Nothing was changed. ${plural(summary.failed, entityLabel)} were refused.`,
      needsReconciliation: false,
    };
  }

  const skipped =
    summary.notStarted > 0 ? `, ${plural(summary.notStarted, entityLabel)} not started` : '';
  return {
    tone: 'warning',
    message: `${plural(summary.succeeded, entityLabel)} updated, ${summary.failed} refused${skipped}.`,
    needsReconciliation: false,
  };
}
