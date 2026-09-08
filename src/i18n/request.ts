import { getRequestConfig } from 'next-intl/server';

import { isLocale, routing, type Locale } from './routing';

// The locale comes only from the [locale] segment that next-intl's proxy resolves.
// Unprefixed URLs always render the default English locale.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = isLocale(requested) ? requested : routing.defaultLocale;
  const messages = (await import(`./messages/${locale}.json`)).default;

  return { locale, messages };
});
