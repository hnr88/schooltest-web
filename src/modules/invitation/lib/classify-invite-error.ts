import { isAxiosError } from 'axios';

import type { InviteLinkState } from '@/modules/invitation/types/invitation.types';

// C-INV-05/06 share the link-state contract: 404 invalid token, 410 expired,
// 409 already accepted. Anything else (network down, 500) renders the generic
// unavailable screen.
export function classifyInviteError(error: unknown): InviteLinkState {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 404) return 'invalid';
    if (status === 410) return 'expired';
    if (status === 409) return 'used';
  }
  return 'unavailable';
}
