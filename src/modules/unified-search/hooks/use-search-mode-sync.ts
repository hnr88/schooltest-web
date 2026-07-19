'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import {
  SEARCH_MODES,
  SEARCH_MODE_PARAM,
} from '@/modules/unified-search/constants/unified-search.constants';
import type { UnifiedSearchMode } from '@/modules/unified-search/types/unified-search.types';

interface SearchModeSync {
  mode: UnifiedSearchMode;
  setMode: (next: UnifiedSearchMode) => void;
}

function coerceMode(raw: string | null): UnifiedSearchMode {
  return SEARCH_MODES.find((candidate) => candidate === raw) ?? 'schools';
}

// C-UI-SEARCH-UNIFIED: `?mode=` is the ONLY URL-synced search state. The URL is the
// source of truth — `mode` is derived from the live search params each render
// (absent/invalid → 'schools'), and a tab change writes it back with router.replace
// so switching never stacks a history entry. All other pane state (q, filters, page,
// sort) stays in the per-pane Zustand stores. i18n is cookie-based here (no locale
// prefix in the path), so plain next/navigation is the project precedent.
export function useSearchModeSync(): SearchModeSync {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = coerceMode(searchParams.get(SEARCH_MODE_PARAM));

  const setMode = useCallback(
    (next: UnifiedSearchMode) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(SEARCH_MODE_PARAM, next);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return { mode, setMode };
}
