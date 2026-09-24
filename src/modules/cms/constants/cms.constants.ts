/** Next cache tag on every CMS read; POST /api/revalidate { tags: ['cms-content'] } drops them. */
export const CMS_CACHE_TAG = 'cms-content';

/** Seconds a CMS read is served from the fetch cache before a background refresh. */
export const CMS_REVALIDATE_SECONDS = 300;

export const CMS_FALLBACK_LOCALE = 'en';

export const CMS_PAGES_PATH = '/api/pages';
export const CMS_PAGE_BY_SLUG_PATH = '/api/pages/slug';
export const CMS_LAYOUT_PATH = '/api/layout';

export const CMS_PAGE_TYPES = ['legal', 'info', 'article'] as const;

export const CMS_SECTION_COMPONENTS = [
  'sections.rich-text',
  'sections.heading-text',
  'sections.faq-list',
  'sections.key-takeaways',
  'sections.callout',
  'sections.media',
  'sections.cta',
  'sections.contact-block',
] as const;

export const ARTICLES_PATH = '/articles';
export const ARTICLES_PAGE_SIZE = 12;
export const ARTICLES_FEED_PATH = '/articles/feed.xml';
export const CMS_LIST_PAGE_SIZE = 100;

/** Adult silent-reading rate for non-fiction; the usual basis for "min read". */
export const WORDS_PER_MINUTE = 220;

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
