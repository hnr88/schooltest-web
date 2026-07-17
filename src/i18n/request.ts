import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

import { LOCALE_COOKIE, routing, type Locale } from './routing';

// Cookie-based locale selection (no URL prefix). The LocaleSwitcher writes the
// cookie; upgrading to locale-prefixed routing later only touches this file,
// routing.ts, and adds a proxy.ts middleware.
export default getRequestConfig(async () => {
  const store = await cookies();
  const requested = store.get(LOCALE_COOKIE)?.value;
  const locale: Locale = routing.locales.includes(requested as Locale)
    ? (requested as Locale)
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
