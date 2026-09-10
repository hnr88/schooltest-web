'use client';

/**
 * Task 02 — the bulk bar, rendered by the task 05 action kit's OpsBulkBar
 * (composed, never reimplemented — house rule 1). The bar shows only while a
 * selection exists; the actions receive the selected targets in page order and
 * decide their own side effects. The cap notice and the "on this page" wording
 * come from the shared bar, so every ops surface states selection the same way.
 *
 * teacher/05 (U-14, U-21): each action is partitioned into eligible and
 * skipped rows before dispatch. The button carries the design's per-action
 * "N of M" count label, the skip sentence renders beside the bar from the
 * action's own `skipLabel` copy (R-15 — the kit reads no catalogue), and
 * `onRun` receives ONLY the eligible rows and targets. With zero eligible
 * rows the action still dispatches — `onRun([], [])` exactly once — and the
 * KIT raises no confirm, no toast and no disabled state: the design's
 * "Nothing to <action>" advisory is the SURFACE's, through U-24.
 *
 * U-24 SEAM (school-admin/05, not yet landed): the zero-eligible advisory
 * variant of OpsConfirmDialog does not exist yet. The surface that consumes
 * this bar wires it when school-admin/05 lands — grep this file or
 * mvp/teacher/proof/05.md for U-24; never rebuild the dialog here.
 */
import { OpsBulkBar, type OpsActionTarget } from '@/modules/ops/actions';

import { partitionSelection } from '../lib/directory-eligibility';
import type { DirectoryBulkAction, DirectoryLabels, DirectorySelectionApi } from '../types/directory.types';

interface DirectoryBulkBarProps<Row> {
  selection: DirectorySelectionApi<Row>;
  bulkActions: readonly DirectoryBulkAction<Row>[];
  labels: DirectoryLabels;
}

export function DirectoryBulkBar<Row>({
  selection,
  bulkActions,
  labels,
}: DirectoryBulkBarProps<Row>) {
  if (selection.count === 0) return null;

  // Index-paired rows and targets: selectedRows and targets are pinned to the
  // same order and cap (unit test), so pairs[i] is one selected item whole.
  type SelectionPair = { row: Row; target: OpsActionTarget };
  const pairs: readonly SelectionPair[] = selection.selectedRows.map((row, index) => ({
    row,
    target: selection.targets[index],
  }));

  const mapped = bulkActions.map((action) => {
    const eligibleOf = action.eligible;
    const { eligible, skipped } = partitionSelection(
      pairs,
      eligibleOf === undefined ? {} : { eligible: (pair: SelectionPair) => eligibleOf(pair.row) },
    );
    return {
      id: action.label,
      label:
        eligible.length === selection.selectedRows.length
          ? action.label
          : `${action.label} (${eligible.length} of ${selection.selectedRows.length})`,
      destructive: action.destructive,
      // ops/28 (D-53) — forwarded verbatim to OpsBulkBar's own `disabled`
      // (native HTML disabled); see DirectoryBulkAction.disabled for why a
      // bulk control is allowed to go fully inert where a row's kebab item
      // is not. Unset by every existing consumer, so this changes nothing
      // until a surface starts passing it.
      disabled: action.disabled === true,
      onSelect: () =>
        action.onRun(
          eligible.map((pair) => pair.row),
          eligible.map((pair) => pair.target),
        ),
      skipSentence:
        skipped.length > 0 && action.skipLabel !== undefined
          ? action.skipLabel(skipped.length)
          : null,
    };
  });

  const skipSentences = mapped
    .map((action) => action.skipSentence)
    .filter((sentence): sentence is string => sentence !== null);

  return (
    <div>
      <OpsBulkBar
        count={selection.count}
        atCap={selection.atCap}
        entityLabel={labels.selectedEntityNoun}
        actions={mapped.map(({ skipSentence: _skip, ...action }) => action)}
        onClear={selection.clear}
      />
      {skipSentences.length > 0 ? (
        <p data-slot="directory-bulk-skip" className="text-meta text-muted-foreground">
          {skipSentences.join(' ')}
        </p>
      ) : null}
    </div>
  );
}
