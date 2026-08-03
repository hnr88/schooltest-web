/**
 * SEO fallbacks. These are the values used before the platform settings
 * (C-SET-01) resolve, and for the generated Open Graph card. The live site name
 * / tagline / default meta come from the settings once a page passes them in.
 */
export const SITE_NAME = 'SchoolTest';

/** The generated Open Graph card route (src/app/[locale]/opengraph-image.tsx). */
export const OG_IMAGE_PATH = '/opengraph-image';

/** Open Graph card dimensions — the size the generated image route renders at. */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** Brand ink used by the generated card, matching the app's navy/teal tokens. */
export const OG_BACKGROUND = '#0E2350';
export const OG_FOREGROUND = '#FFFFFF';
export const OG_ACCENT = '#2DD4BF';

/** The real brand lockup shipped in `public/brand` — used by the Organization node. */
export const LOGO_PATH = '/brand/logo.png';
export const LOGO_WIDTH = 503;
export const LOGO_HEIGHT = 160;

/**
 * Metadata for every private surface. robots.txt already disallows these paths,
 * but a page reachable by any other route (a shared link, a referrer) would
 * otherwise still be indexable — belt and braces, and asserted by the SEO e2e.
 */
export const NOINDEX_ROBOTS = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
} as const;
