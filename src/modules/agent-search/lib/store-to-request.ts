import {
  DEFAULT_SORT,
  PAGE_SIZE,
} from '@/modules/agent-search/constants/agent-search.constants';
import type {
  AgentSearchFilters,
  AgentSearchRequest,
} from '@/modules/agent-search/types/agent-search.types';

// Omit blank `q` and empty arrays — the server schema requires `.min(1)`, so an
// empty array is a 400. Store `sort` maps to request `sortBy`, sent only when
// non-default. pageSize is pinned server-side default (12).
export function storeToRequest(filters: AgentSearchFilters): AgentSearchRequest {
  const request: AgentSearchRequest = {
    page: filters.page ?? 1,
    pageSize: PAGE_SIZE,
  };

  const q = filters.q?.trim();
  if (q) request.q = q;

  if (filters.countriesServed?.length) request.countriesServed = filters.countriesServed;
  if (filters.languages?.length) request.languages = filters.languages;
  if (filters.services?.length) request.services = filters.services;

  if (filters.sort && filters.sort !== DEFAULT_SORT) {
    request.sortBy = filters.sort;
  }

  return request;
}
