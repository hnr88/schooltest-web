import type { MetadataRoute } from 'next';

import { env } from '@/lib/env';
// Deep imports, not the seo barrel: the barrel re-exports React components, and
// a metadata route must not fail to compile because a component did.
import { buildRobots } from '@/modules/seo/lib/build-robots';

// C-WEB-01. The Disallow list is the SHARED registry the sitemap and llms.txt
// are built from, so a route can never be public in one and private in another.
export default function robots(): MetadataRoute.Robots {
  return buildRobots(env.NEXT_PUBLIC_APP_URL);
}
