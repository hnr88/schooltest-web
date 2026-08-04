import { isAxiosError } from 'axios';

import type { OnboardingLinkState } from '@/modules/school-onboarding/types/school-onboarding.types';

// C-ONB-01/02/03 share the same error contract: 404 invalid token, 410 gone,
// 409 already used. A 410 carries `details.reason` — `revoked` (ops pulled the
// invitation back) or `expired` (the clock ran out) — so the two get their own
// screens. Anything else (network down, 500) renders the generic unavailable
// screen.
interface GoneErrorBody {
  error?: { details?: { reason?: string } };
}

export function classifyLinkError(error: unknown): OnboardingLinkState {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 404) return 'invalid';
    if (status === 410) {
      const reason = (error.response?.data as GoneErrorBody | undefined)?.error?.details?.reason;
      return reason === 'revoked' ? 'revoked' : 'expired';
    }
    if (status === 409) return 'used';
  }
  return 'unavailable';
}
