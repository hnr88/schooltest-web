import {
  DEFAULT_SORT_BY,
  FEE_MAX_BOUND,
  FEE_MIN_BOUND,
  PAGE_SIZE,
} from '@/modules/school-search/constants/school-search.constants';
import type {
  SchoolSearchFilters,
  SchoolSearchRequest,
} from '@/modules/school-search/types/school-search.types';

export function storeToRequest(filters: SchoolSearchFilters): SchoolSearchRequest {
  const request: SchoolSearchRequest = {
    page: filters.page ?? 1,
    pageSize: PAGE_SIZE,
  };

  const q = filters.q?.trim();
  if (q) request.q = q;

  if (filters.states?.length) request.states = filters.states;
  if (filters.schoolTypes?.length) request.schoolTypes = filters.schoolTypes;
  if (filters.sectors?.length) request.sectors = filters.sectors;
  if (filters.levels?.length) request.levels = filters.levels;

  if (filters.atarAvailable) request.atarAvailable = true;
  if (filters.elicos) request.englishLanguageSupport = true;
  if (filters.scholarshipAvailable) request.scholarshipAvailable = true;

  if (typeof filters.feeMin === 'number' && filters.feeMin > FEE_MIN_BOUND) {
    request.feeMin = filters.feeMin;
  }
  if (typeof filters.feeMax === 'number' && filters.feeMax < FEE_MAX_BOUND) {
    request.feeMax = filters.feeMax;
  }

  if (filters.sortBy && filters.sortBy !== DEFAULT_SORT_BY) {
    request.sortBy = filters.sortBy;
  }

  return request;
}
