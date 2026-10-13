import type { ConsentAudience, ConsentConfig } from '@/modules/privacy-consent/types/consent.types';

export type ConsentErrorKind =
  | 'disabled'
  | 'notFound'
  | 'alreadyWithdrawn'
  | 'guardianRequired'
  | 'generic';

export interface ConsentErrorEnvelope {
  error?: {
    status?: number;
    details?: { code?: string };
  };
}

// The refusals of POST /api/schools/me/children/:documentId/erase (W4-20), each with
// its own message. `confirmation` covers CONFIRMATION_MISMATCH and CONFIRMATION_REQUIRED.
export type EraseErrorKind =
  | 'erasureDisabled'
  | 'notArchived'
  | 'inSession'
  | 'legalHold'
  | 'confirmation'
  | 'notFound'
  | 'generic';

export type EraseEntryState = 'offer' | 'erased' | 'none';

export interface EraseEntryInput {
  audience: ConsentAudience;
  config: ConsentConfig | undefined;
  studentStatus: string | null | undefined;
  givenName: string | null | undefined;
  familyName: string | null | undefined;
}
