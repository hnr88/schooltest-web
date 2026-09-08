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
  { pathname: '/', changeFrequency: 'weekly', priority: 1, llmsLabelKey: 'Navigation.home' },
  { pathname: '/diagnose', changeFrequency: 'monthly', priority: 0.8, llmsLabelKey: 'Eald.nav.diagnose' },
  { pathname: '/teach', changeFrequency: 'monthly', priority: 0.8, llmsLabelKey: 'Eald.nav.teach' },
  { pathname: '/track', changeFrequency: 'monthly', priority: 0.8, llmsLabelKey: 'Eald.nav.track' },
  { pathname: '/predict', changeFrequency: 'monthly', priority: 0.8, llmsLabelKey: 'Eald.nav.predict' },
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

/** True when a path is one the sitemap/llms.txt must never contain. */
export function isDisallowed(pathname: string): boolean {
  return DISALLOWED_PATHS.some(
    (blocked) => pathname === blocked || pathname.startsWith(`${blocked}/`),
  );
}
