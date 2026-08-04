import type { UnifiedSearchMode } from '@/modules/unified-search/types/unified-search.types';

export interface SearchModeSync {
  mode: UnifiedSearchMode;
  setMode: (next: UnifiedSearchMode) => void;
}

export interface UnifiedSearchField {
  value: string;
  setValue: (next: string) => void;
  clear: () => void;
  commit: () => void;
  hasValue: boolean;
}
