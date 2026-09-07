'use client';

import { useMutation } from '@tanstack/react-query';
import {
  RestContractViolation,
  systemSitemapResponseSchema,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';

/**
 * Ledger row 5c — C-OPSY-02 POST /api/ops/system/sitemap/regenerate.
 *
 * Stamps the platform setting, revalidates the web app's caches through its
 * revalidate hook, then counts the URLs the freshly published sitemap really
 * contains. A web app that does not answer is a hard error surfaced with the
 * server's own message (this stack: no WEB_APP_URL, nothing on the fallback
 * port — the honest 502-shaped failure).
 */
async function regenerateSitemap() {
  const res = await strapi.post<unknown>('/api/ops/system/sitemap/regenerate', {});
  const parsed = systemSitemapResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data.data;
}

export function useSystemSitemapMutation() {
  return useMutation({ mutationFn: regenerateSitemap });
}
