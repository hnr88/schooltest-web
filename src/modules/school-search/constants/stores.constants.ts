import { DEFAULT_SORT_BY, FEE_MAX_BOUND, FEE_MIN_BOUND } from '@/modules/school-search/constants/school-search.constants';
import type { SchoolSearchFilters } from '@/modules/school-search/types/school-search.types';

export const INITIAL: SchoolSearchFilters = {
  q: '',
  states: [],
  schoolTypes: [],
  sectors: [],
  levels: [],
  atarAvailable: false,
  elicos: false,
  scholarshipAvailable: false,
  feeMin: FEE_MIN_BOUND,
  feeMax: FEE_MAX_BOUND,
  sortBy: DEFAULT_SORT_BY,
  page: 1,
};
