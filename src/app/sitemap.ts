import type { MetadataRoute } from 'next';

import { routing } from '@/i18n/routing';
import { LEGAL_ROUTES, getLegalDocuments } from '@/modules/legal';
import { PUBLIC_ROUTES, isDisallowed } from '@/modules/seo/constants/public-routes';
import { absoluteUrl } from '@/modules/seo';

// C-WEB-03. One <url> per public route x locale, each carrying the full
// hreflang alternate set. The route list is the SHARED registry plus the legal
// documents read live from C-LEG-01, so publishing a new policy surfaces here
// without a code change. Nothing on the Disallow list can appear: the guard
// below is asserted by the SEO e2e, not merely intended.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = routing.defaultLocale;
  const legal = await getLegalDocuments(base);

  const entries = [
    ...PUBLIC_ROUTES.map((route) => ({
      pathname: route.pathname,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      lastModified: new Date(),
    })),
    ...legal.map((document) => ({
      pathname: LEGAL_ROUTES[document.slug],
      changeFrequency: 'yearly' as const,
      priority: 0.4,
      lastModified: new Date(document.updatedAt),
    })),
  ].filter((entry) => !isDisallowed(entry.pathname));

  return entries.flatMap((entry) =>
    routing.locales.map((locale) => ({
      url: absoluteUrl(entry.pathname, locale, base),
      lastModified: entry.lastModified,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((alt) => [alt, absoluteUrl(entry.pathname, alt, base)]),
        ),
      },
    })),
  );
}
