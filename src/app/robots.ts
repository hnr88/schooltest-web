import type { MetadataRoute } from 'next';

import { env } from '@/lib/env';
import { DISALLOWED_PATHS } from '@/modules/seo/constants/public-routes';

// C-WEB-01. The Disallow list is the SHARED registry the sitemap and llms.txt
// are built from, so a route can never be public in one and private in another.
export default function robots(): MetadataRoute.Robots {
  const base = env.NEXT_PUBLIC_APP_URL;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Bare paths, NOT `${path}/`: robots.txt matching is a prefix match, so
      // `Disallow: /sign-in` blocks the page itself AND everything beneath it,
      // while `Disallow: /sign-in/` would leave `/sign-in` crawlable.
      disallow: [...DISALLOWED_PATHS],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
