/** Social card routes, typography and brand ink (1200x630 PNG via next/og). */
export const OG_IMAGE_SEGMENT = 'opengraph-image';
export const TWITTER_IMAGE_SEGMENT = 'twitter-image';
export const OG_CONTENT_TYPE = 'image/png';

/**
 * Prerendered cards are fingerprinted by Next and cached for a year; this is
 * the header for cards rendered on request (a CMS article not yet prerendered):
 * a day at the CDN, a week of stale-while-revalidate for crawlers re-fetching.
 */
export const OG_CACHE_CONTROL = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';

/**
 * Public pathnames that ship their own card route. Every other page inherits
 * the locale root card; `/articles/<slug>` pages have a per-article card.
 */
export const OG_CARD_PATHNAMES: readonly string[] = [
  '/',
  '/diagnose',
  '/teach',
  '/track',
  '/predict',
  '/report',
  '/articles',
  '/privacy-policy',
  '/terms-of-service',
  '/cookie-policy',
  '/gdpr',
];

export const OG_ARTICLE_PREFIX = '/articles/';

/**
 * Card copy per pathname: next-intl keys for the eyebrow and the headline.
 * The home eyebrow is the first half of the "audience · programme" tagline.
 */
export const OG_EYEBROW_SEPARATOR = ' · ';
export const OG_CARD_COPY: Readonly<
  Record<string, { eyebrowKey: string; titleKey: string; isEyebrowFirstPart?: boolean }>
> = {
  '/': { eyebrowKey: 'Landing.nav.utilityTagline', titleKey: 'OgImage.homeTitle', isEyebrowFirstPart: true },
  '/diagnose': { eyebrowKey: 'Landing.nav.diagnose', titleKey: 'OgImage.diagnoseTitle' },
  '/teach': { eyebrowKey: 'Landing.nav.teach', titleKey: 'OgImage.teachTitle' },
  '/track': { eyebrowKey: 'Landing.nav.track', titleKey: 'OgImage.trackTitle' },
  '/predict': { eyebrowKey: 'Landing.nav.predict', titleKey: 'OgImage.predictTitle' },
  '/report': { eyebrowKey: 'OgImage.reportEyebrow', titleKey: 'OgImage.reportTitle' },
  '/articles': { eyebrowKey: 'Navigation.articles', titleKey: 'OgImage.articlesTitle' },
  '/privacy-policy': { eyebrowKey: 'Seo.llmsLegal', titleKey: 'Navigation.privacyPolicy' },
  '/terms-of-service': { eyebrowKey: 'Seo.llmsLegal', titleKey: 'Navigation.termsOfService' },
  '/cookie-policy': { eyebrowKey: 'Seo.llmsLegal', titleKey: 'Navigation.cookiePolicy' },
  '/gdpr': { eyebrowKey: 'Seo.llmsLegal', titleKey: 'Navigation.gdpr' },
};

export const OG_TAGLINE_KEY = 'Landing.footer.tagline';
export const OG_ARTICLE_EYEBROW_KEY = 'Navigation.article';

/** Static Google Sans instances (scripts/build-og-fonts.ts); Latin, Vietnamese, Thai. */
export const OG_FONT_FAMILY = 'Google Sans';
export const OG_FONT_FILES = [
  { path: 'src/modules/seo/assets/fonts/GoogleSans-Regular.ttf', weight: 400 },
  { path: 'src/modules/seo/assets/fonts/GoogleSans-Bold.ttf', weight: 700 },
] as const;

/**
 * Han and Hangul are not in Google Sans. The card fetches Noto Sans SC / KR
 * from Google Fonts subset to exactly the card's text (a few KB), at the two
 * weights the card uses; `lang` steers next/og to Simplified Chinese forms.
 */
export const OG_CJK_FONT_FAMILY = 'Noto Sans CJK';
export const OG_CJK_FONTS: Readonly<Record<string, { family: string }>> = {
  zh: { family: 'Noto Sans SC' },
  ko: { family: 'Noto Sans KR' },
};
export const OG_SCRIPT_LANG: Readonly<Record<string, string>> = { zh: 'zh-CN', ko: 'ko-KR', th: 'th-TH' };
/** Latin-script locales get the tracked, uppercase eyebrow; Thai and CJK set it plain. */
export const OG_TRACKED_LOCALES: readonly string[] = ['en', 'ms', 'vi'];
/** Hangul breaks between words (keep-all); Han still breaks between characters. */
export const OG_KEEP_ALL_LOCALES: readonly string[] = ['ko'];
export const OG_FONT_FETCH_TIMEOUT_MS = 8000;
export const GOOGLE_FONTS_CSS_URL = 'https://fonts.googleapis.com/css2';

/** Headline sizing: long titles step down, then clamp with an ellipsis. */
export const OG_TITLE_MAX_UNITS = 150;
export const OG_TITLE_SIZES: readonly { maxUnits: number; fontSize: number }[] = [
  { maxUnits: 44, fontSize: 76 },
  { maxUnits: 72, fontSize: 64 },
  { maxUnits: 110, fontSize: 54 },
  { maxUnits: OG_TITLE_MAX_UNITS, fontSize: 46 },
];
export const OG_TAGLINE_MAX_UNITS = 150;

export const OG_MUTED = '#B9C6DF';
export const OG_TILE_FROM = '#2563EB';
export const OG_TILE_MID = '#1D4ED8';
export const OG_TILE_TO = '#0E2350';
export const OG_MARK_INK = '#F7F9FC';

/** The SchoolTest kangaroo mark (public/icons/icon-light.svg), 1024 viewBox. */
export const OG_MARK_TRANSFORM = 'translate(176.84 287.16) scale(3.94)';
export const OG_MARK_PATH =
  'M103.63,11.75L111.38,12.13L115.38,13.13L120,15.13L123.63,17.25L128.5,21.38L133.88,27.5L134.63,29.38L134.63,30.88L133.75,32.88L132.75,33.75L130.88,34.38L128.13,33.75L127,32.75L124.38,29.38L120.13,25.25L117.25,23.25L112.38,21.13L107.88,20.25L105.13,20.13L99.5,21L98.38,21.63L96.38,22.13L91.13,25.13L87.38,28.5L84.88,31.38L81.13,36.88L72.75,51.88L64.88,63.88L58.63,71.63L49.88,79.63L43.88,83.75L37.75,86.88L36.5,87.13L35.38,87.88L33.13,88.63L28,90L21.25,91L12.38,91L5.38,89.88L4.38,89.38L2.88,87.63L2.63,84.88L3.25,83.38L4.5,82.25L7,81.75L14.13,82.75L19,82.75L26,81.75L29.38,80.88L34.63,78.88L41.75,74.88L45.75,71.88L51.25,66.75L57.88,58.88L64.75,48.5L75.13,30.25L80.25,23.5L84.75,19.25L87.38,17.25L90.75,15.38L95.5,13.25L97.88,12.88L99.38,12.25L103.5,11.88Z M102.25,38.88L109.75,39.25L112.63,40.25L115.88,42.25L117.88,44.25L119.75,47.5L120.5,51.63L120.25,55.25L119.63,57.63L117.63,61.38L114.25,65.63L112,67.75L106.5,71.75L102.75,73.75L99.5,75L98.38,75.75L93,77.5L92.63,78.63L112.63,95.5L113.5,98L112.88,100.63L111.63,101.88L109.75,102.5L107,101.88L80.63,79.75L79.38,78.38L79,77.25L79.25,74.38L80.5,73L81.88,72.25L84.38,72L91.38,69.88L98.75,66.88L105.13,63L108.88,59.63L110.88,57L112,54.88L112.38,53.38L112.38,51.5L112,50.13L110.5,48.5L107.88,47.25L106.5,47L97.63,47L96.63,46.63L95.13,45L94.75,42.63L95.13,41L95.88,40.13L96.88,39.38L98.13,39L102.13,39Z M142.25,11.63L143.63,11.63L145.25,12.13L146.63,13.25L166.75,35.13L167.5,37L167.5,38.5L166.75,40.38L165.25,41.63L163.88,42L161.88,41.88L160,41.13L154.88,40L149.75,40L146.38,41.13L144.38,42.63L142,45.13L128.88,68.63L127.5,69.88L125.38,70.63L124.25,70.63L121.88,69.5L121.13,68.63L120.63,67.25L121.13,64.5L124,61.63L131.13,48.38L131.88,47.5L133.25,44.5L134,43.63L134.38,42.5L137.13,38.5L139.38,36.25L142.75,34.13L145.25,33.13L148.88,32.25L151.63,32.13L152,31.75L152,31.25L140,18.63L139.13,17.25L139,14.63L139.25,13.75L140.5,12.38L142.13,11.75Z';
