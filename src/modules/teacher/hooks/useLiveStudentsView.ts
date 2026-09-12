'use client';

import { useState } from 'react';

import {
  selectedRows,
  selectionOf,
  toggleAllShown,
  toggleOne,
  visibleRows,
} from '@/modules/teacher/lib/live-students';
import type { LiveFilter, LiveStudentRow } from '@/modules/teacher/types/live-students.types';

/** Search, filter pill and ticked students of the Live tab's list (UI state only). */
export function useLiveStudentsView(rows: readonly LiveStudentRow[]) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LiveFilter>('all');
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());

  const visible = visibleRows(rows, filter, query);
  const selectedCount = selectedRows(rows, selected).length;

  return {
    query,
    setQuery,
    filter,
    setFilter,
    visible,
    selected,
    selectedCount,
    selection: selectionOf(visible, selected, selectedCount),
    toggle: (studentId: string) => setSelected((previous) => toggleOne(previous, studentId)),
    toggleAll: () => setSelected((previous) => toggleAllShown(visible, previous)),
    clear: () => setSelected(new Set()),
  };
}
