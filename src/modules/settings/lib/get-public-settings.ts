import { env } from '@/lib/env';
import { publicSettingsResponseSchema } from '@/modules/settings/schemas/public-settings.schema';
import { PUBLIC_SETTINGS_CACHE_TAG } from '@/modules/settings/constants/settings.constants';
import type { PublicSettings } from '@/modules/settings/types/settings.types';

// SERVER ONLY. `env.API_BASE_URL` is a server variable, so importing this into a
// Client Component throws — that is the guard. Tagged so the ops cache action
// (C-OPSY-01) and C-WEB-04 can publish a settings change on demand instead of
// waiting out the revalidate window.

/**
 * C-SET-01 — the public settings the whole public site renders from. A failure
 * THROWS: rendering the site under a stale hardcoded name, or with the
 * maintenance banner silently missing, is worse than an honest error.
 */
export async function getPublicSettings(): Promise<PublicSettings> {
  const res = await fetch(`${env.API_BASE_URL}/api/platform-settings/public`, {
    next: { tags: [PUBLIC_SETTINGS_CACHE_TAG], revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`[settings] GET /api/platform-settings/public failed with ${res.status}`);
  }
  return publicSettingsResponseSchema.parse(await res.json()).data;
}
