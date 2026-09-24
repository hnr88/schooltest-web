import type { PublicRoute } from '@/modules/seo/types/seo.types';

/**
 * The ONE public-route registry (mission tasks 216/217). robots.txt, llms.txt
 * and sitemap.xml are all derived from it, so the three can never disagree
 * about what is public.
 *
 * Legal routes are appended at runtime from C-LEG-01 rather than listed here,
 * so publishing a new legal document surfaces in all three without a code edit.
 *
 * `/` IS the EAL/D home (D-01-REVISED, 2026-09-08): the design remounted at the
 * root and the old `/eald` URLs redirect to their replacements, so there is one
 * URL per page and no duplicate-content split.
 */
export const PUBLIC_ROUTES: readonly PublicRoute[] = [
  { pathname: '/', changeFrequency: 'weekly', priority: 1, llmsLabelKey: 'Navigation.home', seoKey: 'home', lastModified: '2026-09-24' },
  { pathname: '/diagnose', changeFrequency: 'monthly', priority: 0.8, llmsLabelKey: 'Landing.nav.diagnose', seoKey: 'diagnose', lastModified: '2026-09-24' },
  { pathname: '/teach', changeFrequency: 'monthly', priority: 0.8, llmsLabelKey: 'Landing.nav.teach', seoKey: 'teach', lastModified: '2026-09-24' },
  { pathname: '/track', changeFrequency: 'monthly', priority: 0.8, llmsLabelKey: 'Landing.nav.track', seoKey: 'track', lastModified: '2026-09-24' },
  { pathname: '/predict', changeFrequency: 'monthly', priority: 0.8, llmsLabelKey: 'Landing.nav.predict', seoKey: 'predict', lastModified: '2026-09-24' },
  { pathname: '/report', changeFrequency: 'monthly', priority: 0.8, llmsLabelKey: 'Landing.nav.report', seoKey: 'report', lastModified: '2026-09-24' },
];

/**
 * Everything a crawler must stay out of. These are the app's real private and
 * transactional surfaces plus two non-product routes:
 * `/articles` is the boilerplate kit's demo page (its content-type does not
 * exist in this backend) and `/design-system` is an internal component gallery
 * — see .qa/DECISIONS.md D-27.
 */
export const DISALLOWED_PATHS: readonly string[] = [
  '/dashboard',
  '/api',
  '/auth',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/onboarding',
  '/school-onboarding',
  '/invite',
  '/articles',
  '/design-system',
];

// NOT disallowed on purpose: `/opengraph-image` is the URL every page advertises
// as its `og:image`, so blocking it tells crawlers the social card is
// off-limits and the card stops rendering in shares.

/**
 * Crawler policy (robots.txt). Every named crawler gets the SAME rule as `*`:
 * the public marketing, article and legal pages are open to search engines AND
 * AI crawlers, because being quotable in AI answers (AEO) is the point of the
 * public surface; the private app stays closed to everyone. Each bot is named
 * explicitly because a crawler that matches its own group ignores `*`, so a
 * group without the Disallow list would open the dashboard to it.
 */
export const SEARCH_ENGINE_CRAWLERS: readonly string[] = [
  'Googlebot',
  'Bingbot',
  'DuckDuckBot',
  'Applebot',
  'YandexBot',
  'Baiduspider',
];

export const AI_CRAWLERS: readonly string[] = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Bytespider',
  'Amazonbot',
  'Meta-ExternalAgent',
  'cohere-ai',
  'DuckAssistBot',
  'MistralAI-User',
];

/** Every private path, bare and under each locale prefix (`as-needed` routing). */
export function localizedDisallowedPaths(prefixedLocales: readonly string[]): string[] {
  return DISALLOWED_PATHS.flatMap((path) => [
    path,
    ...prefixedLocales.map((locale) => `/${locale}${path}`),
  ]);
}

/** True when a path is one the sitemap/llms.txt must never contain. */
export function isDisallowed(pathname: string): boolean {
  return DISALLOWED_PATHS.some(
    (blocked) => pathname === blocked || pathname.startsWith(`${blocked}/`),
  );
}
