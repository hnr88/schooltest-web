import { isAxiosError } from 'axios';

import type { OnboardingLinkState } from '@/modules/school-onboarding/types/school-onboarding.types';

// C-ONB-01/02/03 share the same error contract: 404 invalid token, 410
// expired, 409 already used. Anything else (network down, 500) renders the
// generic unavailable screen.
export function classifyLinkError(error: unknown): OnboardingLinkState {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 404) return 'invalid';
    if (status === 410) return 'expired';
    if (status === 409) return 'used';
  }
  return 'unavailable';
}
