import type { MetadataRoute } from 'next';
import { connection } from 'next/server';

import { routing } from '@/i18n/routing';
import { LEGAL_ROUTES, getLegalDocuments } from '@/modules/legal';
// Imported from the module's constants file rather than its barrel ON PURPOSE:
// the seo barrel re-exports React Server Components, and pulling those into a
// metadata route (or into the Node-side e2e runtime) drags next-intl's client
// navigation in with them. `.claude/rules/module-pattern.md` scopes the
// barrel-only rule to `src/modules/**`; these are route and test files.
import { PUBLIC_ROUTES, isDisallowed } from '@/modules/seo';
import { absoluteUrl } from '@/modules/seo';

// C-WEB-03. One <url> per public route x locale, each carrying the full
// hreflang alternate set. The route list is the SHARED registry plus the legal
// documents read live from C-LEG-01, so publishing a new policy surfaces here
// without a code change. Nothing on the Disallow list can appear: the guard
// below is asserted by the SEO e2e, not merely intended.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Request-time, never prerendered: the legal index is read from the API, and
  // the API is unreachable from the Docker builder. `connection()` ties the
  // render to the incoming request without forcing `no-store` on the fetch, so
  // the C-LEG-01 read keeps its 300s window and its revalidate tag.
  await connection();

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
        // `x-default` alongside the six locales, matching the page-level
        // hreflang set exactly — the two artefacts must agree on the default.
        languages: Object.fromEntries([
          ...routing.locales.map((alt) => [alt, absoluteUrl(entry.pathname, alt, base)]),
          ['x-default', absoluteUrl(entry.pathname, base, base)],
        ]),
      },
    })),
  );
}
