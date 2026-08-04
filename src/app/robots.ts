import type { MetadataRoute } from 'next';

import { routing } from '@/i18n/routing';
import { env } from '@/lib/env';
// Imported from the module's constants file rather than its barrel ON PURPOSE:
// the seo barrel re-exports React Server Components, and pulling those into a
// metadata route (or into the Node-side e2e runtime) drags next-intl's client
// navigation in with them. `.claude/rules/module-pattern.md` scopes the
// barrel-only rule to `src/modules/**`; these are route and test files.
import { DISALLOWED_PATHS } from '@/modules/seo';

// C-WEB-01. The Disallow list is the SHARED registry the sitemap and llms.txt
// are built from, so a route can never be public in one and private in another.
export default function robots(): MetadataRoute.Robots {
  const base = env.NEXT_PUBLIC_APP_URL;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Every disallowed path is emitted for the bare route AND for each
      // non-default locale prefix. `localePrefix: 'as-needed'` means /dashboard
      // and /zh/dashboard are BOTH real URLs, and a bare `Disallow: /dashboard`
      // matches only the first — /zh/articles was fully crawlable until this.
      //
      // Bare paths, NOT `${path}/`: robots.txt matching is a prefix match, so
      // `Disallow: /sign-in` blocks the page itself AND everything beneath it,
      // while `Disallow: /sign-in/` would leave `/sign-in` crawlable.
      disallow: DISALLOWED_PATHS.flatMap((path) => [
        path,
        ...routing.locales
          .filter((locale) => locale !== routing.defaultLocale)
          .map((locale) => `/${locale}${path}`),
      ]),
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
