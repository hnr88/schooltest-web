'use client';

import { useCallback, useMemo, useState } from 'react';

import {
  clearPage,
  headerCheckboxState,
  isSelected,
  selectPage,
  selectedTargets,
  selectionAtCap,
  toggleTarget,
  type OpsHeaderCheckboxState,
} from '@/modules/ops/actions/lib/ops-selection';
import type { OpsActionTarget } from '@/modules/ops/actions/types/ops-action.types';

export interface OpsSelectionOptions {
  /** The rows currently on screen. "Select all" means exactly these. */
  page: readonly OpsActionTarget[];
  /**
   * Everything that scopes the page — school, tab, filters, page number.
   * Any change clears the selection, because a checkbox ticked against a row
   * the operator can no longer see is a bulk action aimed at the dark.
   */
  scope: readonly unknown[];
}

export interface OpsSelectionApi {
  selectedKeys: ReadonlySet<string>;
  count: number;
  atCap: boolean;
  headerState: OpsHeaderCheckboxState;
  targets: OpsActionTarget[];
  isRowSelected: (target: OpsActionTarget) => boolean;
  toggleRow: (target: OpsActionTarget) => void;
  toggleAllOnPage: () => void;
  clear: () => void;
}

/**
 * Page-scoped selection keyed by entity kind and `documentId`.
 *
 * Never by display name: two schools may share one, and a bulk action resolved
 * by name would silently address the wrong tenant.
 */
export function useOpsSelection({ page, scope }: OpsSelectionOptions): OpsSelectionApi {
  const [selectedKeys, setSelectedKeys] = useState<ReadonlySet<string>>(() => new Set<string>());

  // Reset during render rather than in an effect: an effect would let one paint
  // happen with the previous school's rows still ticked, which is exactly the
  // frame in which an operator can fire a bulk action at the wrong tenant.
  // React re-runs this render immediately and discards the stale output.
  const scopeKey = JSON.stringify(scope);
  const [renderedScopeKey, setRenderedScopeKey] = useState(scopeKey);
  if (renderedScopeKey !== scopeKey) {
    setRenderedScopeKey(scopeKey);
    setSelectedKeys(new Set<string>());
  }

  const toggleRow = useCallback((target: OpsActionTarget) => {
    setSelectedKeys((previous) => toggleTarget(previous, target));
  }, []);

  const toggleAllOnPage = useCallback(() => {
    setSelectedKeys((previous) =>
      headerCheckboxState(previous, page) === 'all'
        ? clearPage(previous, page)
        : selectPage(previous, page),
    );
  }, [page]);

  const clear = useCallback(() => setSelectedKeys(new Set<string>()), []);

  const isRowSelected = useCallback(
    (target: OpsActionTarget) => isSelected(selectedKeys, target),
    [selectedKeys],
  );

  const targets = useMemo(() => selectedTargets(selectedKeys, page), [selectedKeys, page]);

  return {
    selectedKeys,
    count: selectedKeys.size,
    atCap: selectionAtCap(selectedKeys),
    headerState: headerCheckboxState(selectedKeys, page),
    targets,
    isRowSelected,
    toggleRow,
    toggleAllOnPage,
    clear,
  };
}
