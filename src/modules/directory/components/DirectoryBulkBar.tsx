'use client';

/**
 * Task 02 — the bulk bar, rendered by the task 05 action kit's OpsBulkBar
 * (composed, never reimplemented — house rule 1). The bar shows only while a
 * selection exists; the actions receive the selected targets in page order and
 * decide their own side effects. The cap notice and the "on this page" wording
 * come from the shared bar, so every ops surface states selection the same way.
 */
import { OpsBulkBar } from '@/modules/ops/actions';

import type { DirectoryBulkAction, DirectoryLabels, DirectorySelectionApi } from '../types/directory.types';

interface DirectoryBulkBarProps<Row> {
  selection: DirectorySelectionApi<Row>;
  bulkActions: readonly DirectoryBulkAction[];
  labels: DirectoryLabels;
}

export function DirectoryBulkBar<Row>({
  selection,
  bulkActions,
  labels,
}: DirectoryBulkBarProps<Row>) {
  if (selection.count === 0) return null;
  return (
    <OpsBulkBar
      count={selection.count}
      atCap={selection.atCap}
      entityLabel={labels.selectedEntityNoun}
      actions={bulkActions.map((action) => ({
        id: action.label,
        label: action.label,
        destructive: action.destructive,
        onSelect: () => action.onRun(selection.targets),
      }))}
      onClear={selection.clear}
    />
  );
}
