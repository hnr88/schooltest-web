import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    API_BASE_URL: z.url().default('http://localhost:1337'),
  },
  client: {
    NEXT_PUBLIC_API_BASE_URL: z.url().default('http://localhost:1337'),
    NEXT_PUBLIC_APP_URL: z.url().default('http://localhost:3000'),
  },
  runtimeEnv: {
    API_BASE_URL: process.env.API_BASE_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  emptyStringAsUndefined: true,
});
