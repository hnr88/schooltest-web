import type { Viewport } from 'next';

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

/** Search-result limits: Google truncates past ~60 title / ~160 description chars. */
export const TITLE_MAX_LENGTH = 60;
export const DESCRIPTION_MAX_LENGTH = 160;
export const TITLE_SEPARATOR = ' · ';

/** Brand chrome colours for the browser UI (manifest theme_color + viewport). */
export const THEME_COLOR_LIGHT = '#1d4ed8';
export const THEME_COLOR_DARK = OG_BACKGROUND;

export const SITE_CATEGORY = 'education';

/** `og:locale` needs language_TERRITORY; hreflang keeps the bare locale. */
export const OG_LOCALES: Readonly<Record<string, string>> = {
  en: 'en_AU',
  zh: 'zh_CN',
  ko: 'ko_KR',
  ms: 'ms_MY',
  vi: 'vi_VN',
  th: 'th_TH',
};

/**
 * Indexable robots directives. The max-* values opt every public page into
 * large image previews and unrestricted snippets, which is what AI overviews
 * and rich results quote from.
 */
export const INDEX_ROBOTS = {
  index: true,
  follow: true,
  'max-image-preview': 'large',
  'max-snippet': -1,
  'max-video-preview': -1,
  googleBot: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
} as const;

/**
 * Browser chrome. The site is forced to the light theme (next-themes
 * `forcedTheme`), so the colour scheme stays `light`; only the OS-level UI
 * tint follows the reader's dark preference with the brand navy.
 */
export const SITE_VIEWPORT: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: THEME_COLOR_LIGHT },
    { media: '(prefers-color-scheme: dark)', color: THEME_COLOR_DARK },
  ],
  colorScheme: 'light',
};

/** llms.txt / llms-full.txt: a 5-minute shared cache, the legal read's window. */
export const LLMS_CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=600';
export const LLMS_FULL_TXT_PATH = '/llms-full.txt';

/** llmstxt.org gives the literal `## Optional` heading its meaning — a protocol token, not copy. */
export const LLMS_OPTIONAL_HEADING = 'Optional';
