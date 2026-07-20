import { getRequestConfig } from 'next-intl/server';

import { isLocale, routing, type Locale } from './routing';

// Landing copy has its own localized bundles so it can ship independently of
// the shared app catalogs.
const LANDING_MESSAGES = {
  zh: () => import('./messages/home/zh.json'),
  ko: () => import('./messages/home/ko.json'),
  ms: () => import('./messages/home/ms.json'),
  vi: () => import('./messages/home/vi.json'),
  th: () => import('./messages/home/th.json'),
} as const;

// The locale comes only from the [locale] segment that next-intl's proxy resolves.
// Unprefixed URLs always render the default English locale.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = isLocale(requested) ? requested : routing.defaultLocale;
  const messages = (await import(`./messages/${locale}.json`)).default;

  if (locale === 'en') {
    return { locale, messages };
  }

  const landingMessages = (await LANDING_MESSAGES[locale]()).default;

  return {
    locale,
    messages: { ...messages, ...landingMessages },
  };
});
