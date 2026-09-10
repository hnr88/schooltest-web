import type { DirectoryBulkAction } from '../types/directory.types';

/**
 * U-14 — the split of one selection into what an action may act on and what it
 * may not, split per action and always in the page's own order.
 *
 * The kit partitions; it does not decide. Whether a row is eligible is the
 * ACTION's `eligible` predicate (synchronous, pre-dispatch — a label-time
 * gate, distinct from `OpsActionDefinition.isEligible`, which is async and
 * re-checked before a retry). An action that declares no predicate takes the
 * whole selection, so an existing consumer's behaviour is byte-identical.
 */
export interface DirectoryPartition<Row> {
  /** Rows the action may run on, in page order — the only rows dispatched. */
  eligible: Row[];
  /** Selected rows the action refuses, in page order — never dispatched. */
  skipped: Row[];
}

export function partitionSelection<Row>(
  rows: readonly Row[],
  action: Pick<DirectoryBulkAction<Row>, 'eligible'>,
): DirectoryPartition<Row> {
  if (action.eligible === undefined) {
    return { eligible: [...rows], skipped: [] };
  }
  const eligible: Row[] = [];
  const skipped: Row[] = [];
  for (const row of rows) {
    if (action.eligible(row)) eligible.push(row);
    else skipped.push(row);
  }
  return { eligible, skipped };
}
