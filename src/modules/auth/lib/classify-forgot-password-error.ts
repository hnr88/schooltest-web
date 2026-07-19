import { isAxiosError } from 'axios';

import type { ForgotPasswordErrorKey } from '@/modules/auth/types/auth.types';

// Status-only mapping (C-UI-AUTH-PAGES): 429 is the rate-limit branch (first
// 429 consumer), no response means offline, anything else is a server fault.
// 400 never occurs for unknown emails — the endpoint is enumeration-safe — and
// raw Strapi error strings are never rendered.
export function classifyForgotPasswordError(error: unknown): ForgotPasswordErrorKey {
  if (isAxiosError(error)) {
    if (error.response?.status === 429) return 'tooManyRequests';
    if (error.response === undefined) return 'offlineError';
  }
  return 'serverError';
}
