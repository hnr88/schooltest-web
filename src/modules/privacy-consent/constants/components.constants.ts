import type { ConsentSource, ConsentType } from '@/modules/privacy-consent/types/consent.types';

// Listed whenever the config carries a statement for them.
export const ALWAYS_LISTED_CONSENT_TYPES: readonly ConsentType[] = ['data_collection', 'ai_processing'];

// Recording consent is otherwise the student's own desktop modal; it is listed only
// when a ledger row exists, so that a guardian can withdraw it.
export const RECORD_ONLY_CONSENT_TYPES: readonly ConsentType[] = ['recording_monitoring'];

// The types this panel can grant. Recording and monitoring stays the student's modal.
export const GRANTABLE_CONSENT_TYPES: readonly ConsentType[] = ['data_collection', 'ai_processing'];

// Mirrors the API resolution rule: only these sources are a guardian's own act, and
// a guardian's most recent withdrawal beats every attestation.
export const GUARDIAN_CONSENT_SOURCES: readonly ConsentSource[] = ['parent_wizard', 'parent_portal'];

export const CONSENT_STATE_TONES = {
  active: 'success',
  withdrawn: 'warning',
  none: 'neutral',
} as const;
