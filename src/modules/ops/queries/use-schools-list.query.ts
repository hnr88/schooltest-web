'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { schoolsListResponseSchema } from '@schooltest/ops-contracts';

import { portalVersionHeaders, strapi } from '@/lib/axios/strapi';
import { DIRECTORY_ALL, type DirectoryQueryParams } from '@/modules/ops/directory';

/**
 * C-OPS-PORTAL-001 (OPS-011) — the versioned, server-filtered schools
 * directory. Every param below is applied by the API; the client never
 * filters, sorts or totals the loaded page itself. The response is validated
 * against the shared schema, so a drifted body throws instead of rendering a
 * silently empty success.
 *
 * The params arrive in the directory kit's own shape, so adopting surfaces
 * spread `state.params` straight in and the query key is the kit's
 * value-stable object.
 */
export type SchoolsListParams = Pick<DirectoryQueryParams, 'page'> &
  Partial<Omit<DirectoryQueryParams, 'page'>>;

const PAGE_SIZE = 25;

/** The sentinel means "not filtered", so it is never sent to the server. */
function applyFilter(query: Record<string, string>, key: string, value: string | undefined): void {
  if (value !== undefined && value !== '' && value !== DIRECTORY_ALL) query[key] = value;
}

async function fetchSchoolsList(params: SchoolsListParams) {
  const query: Record<string, string> = {
    pageSize: String(params.pageSize ?? PAGE_SIZE),
    page: String(params.page),
  };
  if (params.q) query.q = params.q;
  if (params.sort) query.sort = params.sort;

  const filters = params.filters ?? {};
  for (const key of ['status', 'state', 'sector', 'plan', 'onboarding']) {
    applyFilter(query, key, filters[key]);
  }

  const res = await strapi.get('/api/ops/schools', {
    headers: portalVersionHeaders(),
    params: query,
  });
  const parsed = schoolsListResponseSchema.safeParse(res.data);
  if (!parsed.success) {
    throw new Error('[schools-list] response violated the shared contract');
  }
  return parsed.data;
}

export function useSchoolsListQuery(params: SchoolsListParams, enabled: boolean) {
  return useQuery({
    queryKey: ['ops', 'schools', 'v1', params],
    queryFn: () => fetchSchoolsList(params),
    enabled,
    retry: false,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
