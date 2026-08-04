import { isAxiosError } from 'axios';

import type { OnboardingLinkState } from '@/modules/school-onboarding/types/school-onboarding.types';

import type { GoneErrorBody } from '@/modules/school-onboarding/types/lib.types';

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
