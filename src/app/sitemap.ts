import type { MetadataRoute } from 'next';

import { routing } from '@/i18n/routing';
import { env } from '@/lib/env';

const PUBLIC_ROUTES = [
  { pathname: '', changeFrequency: 'weekly' as const, priority: 1 },
  { pathname: '/articles', changeFrequency: 'daily' as const, priority: 0.8 },
  { pathname: '/design-system', changeFrequency: 'monthly' as const, priority: 0.5 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.NEXT_PUBLIC_APP_URL;
  const lastModified = new Date();

  return PUBLIC_ROUTES.flatMap((route) =>
    routing.locales.map((locale) => {
      const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
      const pathname = `${prefix}${route.pathname}` || '/';

      return {
        url: new URL(pathname, base).toString(),
        lastModified,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      };
    }),
  );
}
