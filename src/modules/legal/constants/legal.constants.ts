import type { LegalSlug } from '@/modules/legal/types/legal.types';

/** Next cache tag for every C-LEG read; the ops cache/sitemap actions bust it. */
export const LEGAL_CACHE_TAG = 'legal-documents';

/**
 * Slug -> public route. The routes are literal folders under `src/app/[locale]`
 * (never a catch-all), so `/privacy-policy` is a real static route the sitemap,
 * the footer and llms.txt all point at.
 */
export const LEGAL_ROUTES: Readonly<Record<LegalSlug, string>> = {
  'privacy-policy': '/privacy-policy',
  'terms-of-service': '/terms-of-service',
  'cookie-policy': '/cookie-policy',
  gdpr: '/gdpr',
};

/** Footer/header ordering — the order a reader expects, not alphabetical. */
export const LEGAL_LINK_ORDER: readonly LegalSlug[] = [
  'privacy-policy',
  'terms-of-service',
  'cookie-policy',
  'gdpr',
];
