import { isAxiosError } from 'axios';

import type { ConsentErrorEnvelope, ConsentErrorKind } from '@/modules/privacy-consent/types/lib.types';

// Maps a failed consent request to one of the module's states. The API's error
// envelope carries the stable `details.code`; the HTTP status is the fallback.
export function classifyConsentError(error: unknown): ConsentErrorKind {
  if (!isAxiosError(error)) {
    return 'generic';
  }
  const status = error.response?.status;
  const code = (error.response?.data as ConsentErrorEnvelope | undefined)?.error?.details?.code;
  if (code === 'CONSENT_RECORDS_DISABLED') {
    return 'disabled';
  }
  if (code === 'CONSENT_ALREADY_WITHDRAWN') {
    return 'alreadyWithdrawn';
  }
  if (code === 'GUARDIAN_CONSENT_REQUIRED') {
    return 'guardianRequired';
  }
  // The step-up gate answers 403 too; it is handled by the auth store, not a
  // permission failure on this child.
  if (code === 'MFA_REQUIRED') {
    return 'generic';
  }
  if (status === 403 || status === 404) {
    return 'notFound';
  }
  return 'generic';
}
