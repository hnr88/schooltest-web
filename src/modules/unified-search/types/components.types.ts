import type { UnifiedSearchMode } from '@/modules/unified-search/types/unified-search.types';

export interface SearchModeTabsProps {
  mode: UnifiedSearchMode;
  onModeChange: (next: UnifiedSearchMode) => void;
}
