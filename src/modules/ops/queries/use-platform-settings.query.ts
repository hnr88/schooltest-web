'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { platformSettingsSchema } from '@/modules/ops/schemas/platform-settings.schema';
import type { PlatformSettings } from '@/modules/ops/types/platform-settings.types';

export const PLATFORM_SETTINGS_QUERY_KEY = ['ops', 'platform-settings'] as const;

// C-SET-02 — ops-only (global::is-ops + the ops grant). The whole envelope is
// parsed through the shared schema; a shape the contract never promised fails
// here rather than corrupting the form.
async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const res = await strapi.get<{ data: unknown }>('/api/platform-settings');
  return platformSettingsSchema.parse(res.data.data);
}

export function usePlatformSettingsQuery(enabled = true) {
  return useQuery({
    queryKey: PLATFORM_SETTINGS_QUERY_KEY,
    queryFn: fetchPlatformSettings,
    enabled,
    retry: false,
  });
}
