'use client';

/**
 * Task 02 — row selection for the directory kit, as a THIN ADAPTER over the
 * task 05 action kit's useOpsSelection (composed, never reimplemented — house
 * rule 1). All selection semantics live there: keys are `kind:documentId`
 * (never a display name), the header checkbox scopes to the CURRENT page, the
 * selection cap is enforced in the lib, and any scope change (school, filters,
 * page) clears the selection during render so a bulk action can never be aimed
 * at a row the operator can no longer see.
 *
 * The consumer supplies `getRowTarget` to name its rows as action targets —
 * the only assumption the kit makes about a row.
 */
import { useMemo } from 'react';

import { selectedRows as selectedRowsOf, useOpsSelection, type OpsActionTarget } from '@/modules/ops/actions';

import type { DirectorySelectionApi } from '../types/directory.types';

export interface DirectorySelectionOptions<Row> {
  /** The rows currently on screen — "select all" means exactly these. */
  page: readonly Row[];
  /**
   * Names a row as a bulk-action target (`kind` + `documentId`). U-11:
   * OPTIONAL — required by the type only while the surface is `selectable`.
   * When absent the selection is INERT (no checkboxes render, nothing can be
   * toggled) and the hook mints NO fake targets: the engine's page is empty
   * and the row predicates answer false. A non-selectable row's identity is
   * `getRowKey` (or the target fallback) in `resolveRowKey`, never from here.
   */
  getRowTarget?: (row: Row) => OpsActionTarget;
  /**
   * Everything that scopes the page — school, tab, filters, page number. Any
   * change clears the selection (the engine's wrong-tenant guard).
   */
  scope: readonly unknown[];
}

export function useDirectorySelection<Row>({
  page,
  getRowTarget,
  scope,
}: DirectorySelectionOptions<Row>): DirectorySelectionApi<Row> {
  const targets = useMemo(
    () => (getRowTarget ? page.map(getRowTarget) : []),
    [page, getRowTarget],
  );
  const selection = useOpsSelection({ page: targets, scope });
  const selectedRows = useMemo(
    () => (getRowTarget ? selectedRowsOf(selection.selectedKeys, page, getRowTarget) : []),
    [selection.selectedKeys, page, getRowTarget],
  );

  return {
    count: selection.count,
    atCap: selection.atCap,
    headerState: selection.headerState,
    targets: selection.targets,
    selectedRows,
    isSelected: getRowTarget
      ? (row: Row) => selection.isRowSelected(getRowTarget(row))
      : () => false,
    toggleRow: getRowTarget
      ? (row: Row) => selection.toggleRow(getRowTarget(row))
      : () => undefined,
    toggleAllOnPage: selection.toggleAllOnPage,
    clear: selection.clear,
  };
}
