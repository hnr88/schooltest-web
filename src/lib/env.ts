import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    API_BASE_URL: z.url().default('http://localhost:1337'),
    // Shared secret for C-WEB-04 (POST /api/revalidate). Server-only: it must
    // never reach the browser. Optional so an image can BUILD without it (the
    // Docker builder has no runtime secrets); never defaulted, so an unset
    // secret leaves the route closed at runtime rather than guessable.
    REVALIDATE_SECRET: z.string().min(16).optional(),
    SEO_TWITTER_SITE: z.string().regex(/^@\w{1,15}$/).optional(),
    SEO_TWITTER_CREATOR: z.string().regex(/^@\w{1,15}$/).optional(),
    SEO_GOOGLE_SITE_VERIFICATION: z.string().min(1).optional(),
    SEO_BING_SITE_VERIFICATION: z.string().min(1).optional(),
    SEO_YANDEX_VERIFICATION: z.string().min(1).optional(),
    SEO_FACEBOOK_APP_ID: z.string().regex(/^\d+$/).optional(),
  },
  client: {
    NEXT_PUBLIC_API_BASE_URL: z.url().default('http://localhost:1337'),
    NEXT_PUBLIC_APP_URL: z.url().default('http://localhost:3000'),
    NEXT_PUBLIC_PARENT_VIEWS_ENABLED: z.enum(['true', 'false']).default('false'),
  },
  runtimeEnv: {
    API_BASE_URL: process.env.API_BASE_URL,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
    SEO_TWITTER_SITE: process.env.SEO_TWITTER_SITE,
    SEO_TWITTER_CREATOR: process.env.SEO_TWITTER_CREATOR,
    SEO_GOOGLE_SITE_VERIFICATION: process.env.SEO_GOOGLE_SITE_VERIFICATION,
    SEO_BING_SITE_VERIFICATION: process.env.SEO_BING_SITE_VERIFICATION,
    SEO_YANDEX_VERIFICATION: process.env.SEO_YANDEX_VERIFICATION,
    SEO_FACEBOOK_APP_ID: process.env.SEO_FACEBOOK_APP_ID,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_PARENT_VIEWS_ENABLED: process.env.NEXT_PUBLIC_PARENT_VIEWS_ENABLED,
  },
  emptyStringAsUndefined: true,
});
