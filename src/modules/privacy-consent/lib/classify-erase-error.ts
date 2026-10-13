import { isAxiosError } from 'axios';

import type { ConsentErrorEnvelope, EraseErrorKind } from '@/modules/privacy-consent/types/lib.types';

// Maps a refused erase to its own message. The stable discriminator is the error
// envelope's `details.code` (W4-20); the HTTP status is only the fallback.
export function classifyEraseError(error: unknown): EraseErrorKind {
  if (!isAxiosError(error)) {
    return 'generic';
  }
  const status = error.response?.status;
  const code = (error.response?.data as ConsentErrorEnvelope | undefined)?.error?.details?.code;
  switch (code) {
    case 'ERASURE_DISABLED':
      return 'erasureDisabled';
    case 'STUDENT_NOT_ARCHIVED':
      return 'notArchived';
    case 'STUDENT_IN_SESSION':
      return 'inSession';
    case 'LEGAL_HOLD':
      return 'legalHold';
    case 'CONFIRMATION_MISMATCH':
    case 'CONFIRMATION_REQUIRED':
      return 'confirmation';
    case 'MFA_REQUIRED':
      // The step-up gate is answered by the auth store, not a refusal of this student.
      return 'generic';
    default:
      break;
  }
  return status === 404 ? 'notFound' : 'generic';
}
