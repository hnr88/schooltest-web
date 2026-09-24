import type { MetadataRoute } from 'next';
import { connection } from 'next/server';

import { routing } from '@/i18n/routing';
// Deep imports, not the seo barrel: the barrel re-exports React components, and
// a metadata route must not fail to compile because a component did.
import { buildSitemapEntries } from '@/modules/seo/lib/build-sitemap';
import { getPublicEntries } from '@/modules/seo/lib/public-entries';

// C-WEB-03. One <url> per public route x locale, each carrying the full
// hreflang alternate set, the page's real last-modified date and its social
// card as an image entry. The list is the SHARED public surface (registry +
// legal documents + CMS content) that llms.txt is built from too, and nothing
// on the robots Disallow list can appear in it.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Request-time, never prerendered: the legal index and CMS are read from the
  // API, which is unreachable from the Docker builder. `connection()` ties the
  // render to the request without forcing `no-store` on the cached reads.
  await connection();
  return buildSitemapEntries(await getPublicEntries({ locale: routing.defaultLocale }));
}
