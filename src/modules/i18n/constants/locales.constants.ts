import { routing, type Locale } from '@/i18n/routing';

export const LOCALES = routing.locales;

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  ko: '한국어',
  ms: 'Melayu',
  vi: 'Tiếng Việt',
  th: 'ไทย',
};
