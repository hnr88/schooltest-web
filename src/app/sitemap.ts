import type { MetadataRoute } from 'next';

import { env } from '@/lib/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.NEXT_PUBLIC_APP_URL;
  const lastModified = new Date();

  return [
    { url: base, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/articles`, lastModified, changeFrequency: 'daily', priority: 0.8 },
  ];
}
