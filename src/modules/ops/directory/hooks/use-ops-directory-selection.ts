'use client';

/**
 * Task 04 — row selection for the directory kit, as a THIN ADAPTER over the
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

import { useOpsSelection, type OpsActionTarget } from '@/modules/ops/actions';

import type { OpsDirectorySelectionApi } from '../types/ops-directory.types';

export interface OpsDirectorySelectionOptions<Row> {
  /** The rows currently on screen — "select all" means exactly these. */
  page: readonly Row[];
  /** Names a row as a bulk-action target (`kind` + `documentId`). */
  getRowTarget: (row: Row) => OpsActionTarget;
  /**
   * Everything that scopes the page — school, tab, filters, page number. Any
   * change clears the selection (the engine's wrong-tenant guard).
   */
  scope: readonly unknown[];
}

export function useOpsDirectorySelection<Row>({
  page,
  getRowTarget,
  scope,
}: OpsDirectorySelectionOptions<Row>): OpsDirectorySelectionApi<Row> {
  const targets = useMemo(() => page.map(getRowTarget), [page, getRowTarget]);
  const selection = useOpsSelection({ page: targets, scope });

  return {
    count: selection.count,
    atCap: selection.atCap,
    headerState: selection.headerState,
    targets: selection.targets,
    isSelected: (row: Row) => selection.isRowSelected(getRowTarget(row)),
    toggleRow: (row: Row) => selection.toggleRow(getRowTarget(row)),
    toggleAllOnPage: selection.toggleAllOnPage,
    clear: selection.clear,
  };
}
