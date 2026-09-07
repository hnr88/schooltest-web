'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  OPS_SCHOOLS_EXPORT_PATH,
  OPS_SCHOOLS_EXPORT_QUERY_KEY,
} from '@/modules/ops/constants/schools-export.constants';
import {
  filenameFromContentDisposition,
  schoolsExportScopeKey,
  schoolsExportSearchParams,
} from '@/modules/ops/lib/schools-export.lib';
import type {
  OpsSchoolsExportFile,
  OpsSchoolsExportScope,
} from '@/modules/ops/types/schools-export.types';

/**
 * C-OPS-PORTAL-009 — GET /api/ops/schools/export.csv.
 *
 * `opsPortalVersioned` sends `X-Ops-Portal-Version: 1`: WITHOUT it the server
 * serves the legacy contract and ignores every filter, so the download would
 * quietly be every tenant. The scope goes out as `URLSearchParams` because the
 * contract's repeated `documentIds=a&documentIds=b` form is not what axios'
 * default array serializer produces.
 *
 * `responseType: 'text'` keeps the CSV a string — a non-2xx body is JSON and is
 * surfaced as an error by the shared interceptor, never saved as a file.
 */
async function fetchSchoolsExport(scope: OpsSchoolsExportScope): Promise<OpsSchoolsExportFile> {
  const res = await strapi.get<string>(OPS_SCHOOLS_EXPORT_PATH, {
    params: schoolsExportSearchParams(scope),
    responseType: 'text',
    opsPortalVersioned: true,
  });
  return {
    filename: filenameFromContentDisposition(res.headers['content-disposition'] as string | undefined),
    csv: res.data,
  };
}

/**
 * Lazy by design (`enabled: false`): the export is pulled on click through
 * `refetch()`, never on render. The scope is part of the key and nothing is
 * cached (`staleTime`/`gcTime` 0), so changing a filter or a selection can
 * never hand back the previous scope's file.
 */
export function useSchoolsExportQuery(scope: OpsSchoolsExportScope) {
  return useQuery({
    queryKey: [...OPS_SCHOOLS_EXPORT_QUERY_KEY, schoolsExportScopeKey(scope)],
    queryFn: () => fetchSchoolsExport(scope),
    enabled: false,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
}
