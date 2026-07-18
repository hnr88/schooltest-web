import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh', 'ko', 'ms', 'vi', 'th'],
  defaultLocale: 'en',
});

export type Locale = (typeof routing.locales)[number];

// Isomorphic (no server-only imports) so client components can read the cookie key.
export const LOCALE_COOKIE = 'NEXT_LOCALE';
