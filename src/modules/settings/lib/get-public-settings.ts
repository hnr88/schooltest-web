import { env } from '@/lib/env';
import { publicSettingsResponseSchema } from '@/modules/settings/schemas/public-settings.schema';
import { PUBLIC_SETTINGS_CACHE_TAG } from '@/modules/settings/constants/settings.constants';
import type { PublicSettings } from '@/modules/settings/types/settings.types';

// SERVER ONLY. `env.API_BASE_URL` is a server variable, so importing this into a
// Client Component throws — that is the guard. The response is read at request
// time (`cache: 'no-store'`): the tag + C-OPSY-01/C-WEB-04 publish path stays
// declared for callers that batch reads, but a maintenance or announcement
// banner that lagged the 300s revalidate window shipped the wrong site state —
// W10 night-2 (CROSS-020): the banner rendered 5 minutes behind the ops toggle.

/**
 * C-SET-01 — the public settings the whole public site renders from. A failure
 * THROWS: rendering the site under a stale hardcoded name, or with the
 * maintenance banner silently missing, is worse than an honest error.
 */
export async function getPublicSettings(): Promise<PublicSettings> {
  const res = await fetch(`${env.API_BASE_URL}/api/platform-settings/public`, {
    // Request-time read: the ops-authored banner is safety/notice copy, and the
    // API round-trip is one cheap indexed read per public render.
    cache: 'no-store',
    next: { tags: [PUBLIC_SETTINGS_CACHE_TAG] },
  });
  if (!res.ok) {
    throw new Error(`[settings] GET /api/platform-settings/public failed with ${res.status}`);
  }
  return publicSettingsResponseSchema.parse(await res.json()).data;
}
