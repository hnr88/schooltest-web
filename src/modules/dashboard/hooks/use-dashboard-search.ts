'use client';

import { type KeyboardEvent, useState } from 'react';

import { useDebouncedValue } from '@/modules/dashboard/hooks/use-debounced-value';
import { useSearchStudentsQuery } from '@/modules/dashboard/queries/use-search-students.query';
import { useDashboardSearchStore } from '@/modules/dashboard/stores/use-dashboard-search.store';

const DEBOUNCE_MS = 300;

// Owns DashboardSearch's interactive state (open/closed, active option,
// keyboard handling) so the component itself stays presentational. Clicking
// a result (or the row it navigates to via arrow keys + Enter) writes the
// selection into the shared store; the children list reads it to filter.
export function useDashboardSearch() {
  const query = useDashboardSearchStore((state) => state.query);
  const setQuery = useDashboardSearchStore((state) => state.setQuery);
  const selectStudent = useDashboardSearchStore((state) => state.selectStudent);
  const clear = useDashboardSearchStore((state) => state.clear);

  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const { data, isLoading, isError } = useSearchStudentsQuery(debouncedQuery);
  const results = data?.data ?? [];

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  function handleFocus() {
    setIsOpen(true);
  }

  function handleBlur() {
    setIsOpen(false);
  }

  function handleChange(value: string) {
    setQuery(value);
    setIsOpen(true);
    setActiveIndex(-1);
  }

  function handleClear() {
    clear();
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleSelect(documentId: string) {
    selectStudent(documentId);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!isOpen || results.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      handleSelect(results[activeIndex].documentId);
    }
  }

  return {
    query,
    isOpen,
    activeIndex,
    results,
    isLoading,
    isError,
    handleFocus,
    handleBlur,
    handleChange,
    handleClear,
    handleSelect,
    handleKeyDown,
  };
}
