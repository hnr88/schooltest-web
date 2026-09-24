import type { MetadataRoute } from 'next';

import { routing } from '@/i18n/routing';
import {
  AI_CRAWLERS,
  SEARCH_ENGINE_CRAWLERS,
  localizedDisallowedPaths,
} from '@/modules/seo/constants/public-routes';

/**
 * robots.txt: one group for the named search engines, one for the named AI
 * crawlers and a catch-all `*` group — all three with the SAME policy (see
 * AI_CRAWLERS). The Disallow list covers every private path bare and under each
 * non-default locale prefix, because `localePrefix: 'as-needed'` makes
 * `/dashboard` and `/zh/dashboard` both real URLs.
 *
 * Bare paths, NOT `${path}/`: robots matching is a prefix match, so
 * `Disallow: /sign-in` blocks the page AND everything beneath it.
 */
export function buildRobots(baseUrl: string): MetadataRoute.Robots {
  const disallow = localizedDisallowedPaths(
    routing.locales.filter((locale) => locale !== routing.defaultLocale),
  );
  const rule = { allow: '/', disallow };

  return {
    rules: [
      { userAgent: [...SEARCH_ENGINE_CRAWLERS], ...rule },
      { userAgent: [...AI_CRAWLERS], ...rule },
      { userAgent: '*', ...rule },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
