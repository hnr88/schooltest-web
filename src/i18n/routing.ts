import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh', 'ko', 'ms', 'vi', 'th'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  localeCookie: false,
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

export function isLocale(value: string | null | undefined): value is Locale {
  return value != null && (routing.locales as readonly string[]).includes(value);
}
