import { DEFAULT_SORT } from '@/modules/agent-search/constants/agent-search.constants';
import type { AgentSearchFilters } from '@/modules/agent-search/types/agent-search.types';

export const INITIAL: AgentSearchFilters = {
  q: '',
  countriesServed: [],
  languages: [],
  services: [],
  sort: DEFAULT_SORT,
  page: 1,
};
