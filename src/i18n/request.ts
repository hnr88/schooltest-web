import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

import { LOCALE_COOKIE, routing, type Locale } from './routing';

// Landing copy has its own localized bundles so it can ship independently of
// the shared app catalogs.
const LANDING_MESSAGES = {
  zh: () => import('./messages/home/zh.json'),
  ko: () => import('./messages/home/ko.json'),
  ms: () => import('./messages/home/ms.json'),
  vi: () => import('./messages/home/vi.json'),
  th: () => import('./messages/home/th.json'),
} as const;

// Cookie-based locale selection (no URL prefix). The LocaleSwitcher writes the
// cookie; upgrading to locale-prefixed routing later only touches this file,
// routing.ts, and adds a proxy.ts middleware.
export default getRequestConfig(async () => {
  const store = await cookies();
  const requested = store.get(LOCALE_COOKIE)?.value;
  const locale: Locale = routing.locales.includes(requested as Locale)
    ? (requested as Locale)
    : routing.defaultLocale;
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
