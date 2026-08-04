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
  },
  client: {
    NEXT_PUBLIC_API_BASE_URL: z.url().default('http://localhost:1337'),
    NEXT_PUBLIC_APP_URL: z.url().default('http://localhost:3000'),
    NEXT_PUBLIC_PARENT_VIEWS_ENABLED: z.enum(['true', 'false']).default('false'),
  },
  runtimeEnv: {
    API_BASE_URL: process.env.API_BASE_URL,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_PARENT_VIEWS_ENABLED: process.env.NEXT_PUBLIC_PARENT_VIEWS_ENABLED,
  },
  emptyStringAsUndefined: true,
});
