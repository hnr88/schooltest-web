import type { UnifiedSearchMode } from '@/modules/unified-search/types/unified-search.types';

// C-UI-SEARCH-UNIFIED: `?mode=` is the ONLY URL-synced search state.
export const SEARCH_MODE_PARAM = 'mode';

// Two segments only; absent/invalid coerces to the first (schools).
export const SEARCH_MODES: readonly UnifiedSearchMode[] = ['schools', 'agents'];
