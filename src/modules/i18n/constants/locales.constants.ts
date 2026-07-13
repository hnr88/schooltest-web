import { routing, type Locale } from '@/i18n/routing';

export const LOCALES = routing.locales;

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
};
