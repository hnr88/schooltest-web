'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useAgentSearchStore } from '@/modules/agent-search';
import { useDebouncedValue } from '@/modules/dashboard';
import { useSchoolSearchStore } from '@/modules/school-search';
import type { UnifiedSearchMode } from '@/modules/unified-search/types/unified-search.types';

const DEBOUNCE_MS = 300;

interface UnifiedSearchField {
  value: string;
  setValue: (next: string) => void;
  clear: () => void;
  commit: () => void;
  hasValue: boolean;
}

// Binds the shared §5.4 bar to the ACTIVE pane store's `q`. The store `q` is the
// source of truth for what the field displays: a render-phase reconcile mirrors it
// into local state whenever it changes externally (mode switch, empty-state "Reset
// filters", filter Reset-all → q:''), so a store reset INSTANTLY clears the field —
// the W6 reset-desync fix (no private local state survives a reset). Typing writes
// back debounced 300ms (reusing the W6 `useDebouncedValue` precedent, since the
// query reads store.q directly); the store setter is read through a ref so a mode
// switch never bleeds one pane's pending text into the other pane's q.
export function useUnifiedSearchField(mode: UnifiedSearchMode): UnifiedSearchField {
  const schoolQ = useSchoolSearchStore((s) => s.q);
  const agentQ = useAgentSearchStore((s) => s.q);
  const setSchoolQ = useSchoolSearchStore((s) => s.setQ);
  const setAgentQ = useAgentSearchStore((s) => s.setQ);

  const storeQ = mode === 'schools' ? schoolQ : agentQ;
  const setStoreQ = mode === 'schools' ? setSchoolQ : setAgentQ;

  const [value, setValue] = useState(storeQ);
  const [prevStoreQ, setPrevStoreQ] = useState(storeQ);

  if (storeQ !== prevStoreQ) {
    setPrevStoreQ(storeQ);
    setValue(storeQ);
  }

  const setStoreQRef = useRef(setStoreQ);
  useEffect(() => {
    setStoreQRef.current = setStoreQ;
  }, [setStoreQ]);

  const debounced = useDebouncedValue(value, DEBOUNCE_MS);
  useEffect(() => {
    setStoreQRef.current(debounced);
  }, [debounced]);

  const clear = useCallback(() => {
    setValue('');
    setStoreQRef.current('');
  }, []);

  // The design's pill ends in a real "Search" button (spec 01 §8.1). Typing is
  // already debounced, so the button's job is to SKIP the remaining debounce window
  // and commit what is in the field right now — never a second, competing query path.
  const commit = useCallback(() => {
    setStoreQRef.current(value);
  }, [value]);

  return { value, setValue, clear, commit, hasValue: value.length > 0 };
}
