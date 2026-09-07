'use client';

import { useQuery } from '@tanstack/react-query';

import { parseDataEnvelope, strapi } from '@/lib/axios/strapi';
import { PLATFORM_SETTINGS_QUERY_KEY } from '@/modules/ops/constants/queries.constants';
import { platformSettingsSchema } from '@/modules/ops/schemas/platform-settings.schema';
import type { PlatformSettings } from '@/modules/ops/types/platform-settings.types';

/**
 * C-OPS-PORTAL-067 — GET /api/platform-settings, ops only.
 *
 * The single fetcher for the settings read. `usePlatformSettingsQuery` is kept
 * as its historical name (queries/use-platform-settings.query.ts re-exports
 * this hook), so the screen has ONE query key, ONE request and ONE contract
 * parse rather than two hooks racing over the same endpoint.
 *
 * `parseDataEnvelope` is the shared REST boundary: it unwraps `{ data }`,
 * tolerates the transport's `meta`, and THROWS on a body the contract never
 * promised instead of letting a drifted shape reach the form as a silent
 * partial success.
 */
async function fetchPlatformSettings(signal: AbortSignal): Promise<PlatformSettings> {
  const res = await strapi.get<unknown>('/api/platform-settings', {
    opsPortalVersioned: true,
    signal,
  });
  return parseDataEnvelope(platformSettingsSchema, res.data);
}

export function useSettingsReadQuery(enabled = true) {
  return useQuery({
    queryKey: PLATFORM_SETTINGS_QUERY_KEY,
    queryFn: ({ signal }) => fetchPlatformSettings(signal),
    enabled,
    // A failed settings read is shown, never retried behind the operator's
    // back: the screen offers an explicit retry so a 403 (wrong role) is not
    // mistaken for a slow load.
    retry: false,
    // Platform settings change outside this tab — another operator, a deploy.
    // Every mount re-reads, so returning to the screen cannot present a stale
    // row as the current configuration.
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
