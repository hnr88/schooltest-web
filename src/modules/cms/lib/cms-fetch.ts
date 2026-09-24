import type { z } from 'zod';

import { env } from '@/lib/env';
import { CMS_CACHE_TAG, CMS_REVALIDATE_SECONDS } from '@/modules/cms/constants/cms.constants';

export type CmsResult<T> =
  | { readonly status: 'ok'; readonly data: T }
  | { readonly status: 'not-found' }
  | { readonly status: 'unavailable' };

/**
 * SERVER ONLY (`env.API_BASE_URL` is a server variable). One tagged, cached GET
 * against the Strapi public CMS surface, parsed at the boundary. It never
 * throws: an unreachable CMS, a 5xx or a response that fails the schema is
 * `unavailable`, which callers turn into a 404 or an empty list — never a
 * crashed page. A stale cache entry keeps being served while a background
 * refresh fails, so a CMS outage shows the last good copy where one exists.
 */
export async function cmsGet<T>(path: string, schema: z.ZodType<T>): Promise<CmsResult<T>> {
  let response: Response;
  try {
    response = await fetch(`${env.API_BASE_URL}${path}`, {
      next: { tags: [CMS_CACHE_TAG], revalidate: CMS_REVALIDATE_SECONDS },
    });
  } catch (error) {
    console.warn(`[cms] GET ${path} unreachable`, error);
    return { status: 'unavailable' };
  }
  if (response.status === 404) return { status: 'not-found' };
  if (!response.ok) {
    console.warn(`[cms] GET ${path} answered ${response.status}`);
    return { status: 'unavailable' };
  }
  const parsed = schema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) {
    console.warn(`[cms] GET ${path} failed the schema`, parsed.error.issues.slice(0, 3));
    return { status: 'unavailable' };
  }
  return { status: 'ok', data: parsed.data };
}
