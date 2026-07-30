import { env } from '@/lib/env';

// MVP hides (never deletes) parent-facing surfaces. W8 tasks 46/47 consume
// this flag; task 48 flips it on for legacy parent e2e compat.
export function parentViewsEnabled(): boolean {
  return env.NEXT_PUBLIC_PARENT_VIEWS_ENABLED === 'true';
}
