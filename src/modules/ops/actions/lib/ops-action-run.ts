import {
  envelopeOfDisposition,
  statusOfDisposition,
  type OpsActionDisposition,
} from '@/modules/ops/actions/lib/ops-action-disposition';
import type {
  OpsActionDefinition,
  OpsActionResultItem,
  OpsActionSummary,
  OpsActionTarget,
} from '@/modules/ops/actions/types/ops-action.types';

export function summariseOpsActionRun(
  results: readonly OpsActionResultItem[],
  total: number,
): OpsActionSummary {
  const count = (outcome: OpsActionResultItem['outcome']) =>
    results.filter((item) => item.outcome === outcome).length;
  const succeeded = count('success');
  const uncertain = count('uncertain');
  return {
    succeeded,
    failed: count('failed'),
    notStarted: count('not_started'),
    uncertain,
    allSucceeded: total > 0 && results.length === total && succeeded === total,
    hasUnresolved: uncertain > 0,
  };
}

async function readBackOrUnknown<T extends OpsActionTarget>(
  definition: OpsActionDefinition<T>,
  target: T,
): Promise<boolean | null> {
  try {
    return await definition.readBack(target);
  } catch {
    return null;
  }
}

/** Settle from the transport plus an authorized read; never invent rollback. */
export async function settleOpsActionItem<T extends OpsActionTarget>(
  definition: OpsActionDefinition<T>,
  target: T,
  disposition: OpsActionDisposition,
): Promise<OpsActionResultItem> {
  const base = {
    documentId: target.documentId,
    kind: target.kind,
    status: statusOfDisposition(disposition),
    error: envelopeOfDisposition(disposition),
  };

  if (
    disposition.kind === 'refused' ||
    disposition.kind === 'denied' ||
    disposition.kind === 'unauthenticated' ||
    disposition.kind === 'cooldown'
  ) {
    return { ...base, outcome: 'failed' };
  }

  const applied = await readBackOrUnknown(definition, target);
  return { ...base, outcome: applied === true ? 'success' : 'uncertain' };
}
