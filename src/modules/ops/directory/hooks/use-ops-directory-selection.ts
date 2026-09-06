'use client';

/**
 * Task 04 — row selection for the directory kit. Selection and row menus are
 * NEW UI (no ops table implements them today — verified in the wave research),
 * so there is no incumbent to copy; the semantics follow the standard data
 * table: the header checkbox scopes to the CURRENT page, while a row ticked on
 * any page stays selected so a bulk action can span pages. The consumer owns
 * what a bulk action then does with the keys.
 */
import { useCallback, useMemo, useState } from 'react';

import type { OpsDirectorySelectionApi } from '../types/ops-directory.types';

export function useOpsDirectorySelection<Row>(
  rows: readonly Row[],
  getRowKey: (row: Row) => string,
): OpsDirectorySelectionApi {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const pageKeys = useMemo(() => rows.map(getRowKey), [rows, getRowKey]);

  const isSelected = useCallback((key: string) => selected.has(key), [selected]);

  const toggleRow = useCallback(
    (key: string) => {
      setSelected((current) => {
        const next = new Set(current);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    },
    [],
  );

  const allOnPageSelected = pageKeys.length > 0 && pageKeys.every((key) => selected.has(key));
  const someOnPageSelected = pageKeys.some((key) => selected.has(key)) && !allOnPageSelected;

  const togglePage = useCallback(() => {
    setSelected((current) => {
      const next = new Set(current);
      const everythingSelected = pageKeys.length > 0 && pageKeys.every((key) => next.has(key));
      for (const key of pageKeys) {
        if (everythingSelected) {
          next.delete(key);
        } else {
          next.add(key);
        }
      }
      return next;
    });
  }, [pageKeys]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const selectedKeys = useMemo(() => Array.from(selected), [selected]);

  return {
    selectedKeys,
    selectedCount: selected.size,
    isSelected,
    toggleRow,
    allOnPageSelected,
    someOnPageSelected,
    togglePage,
    clearSelection,
  };
}
