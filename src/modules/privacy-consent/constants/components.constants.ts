import type {
  ConsentAttestationType,
  ConsentSource,
  ConsentType,
} from '@/modules/privacy-consent/types/consent.types';

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

// The purposes a school can attest, in the order the boxes appear. Recording and
// monitoring is the student's own desktop modal and never a school attestation.
export const ATTESTABLE_CONSENT_TYPES: readonly ConsentAttestationType[] = [
  'data_collection',
  'ai_processing',
];

// The tombstone `anonymiseStudent` writes (W4-20): given name `Erased`, no family name.
export const ERASED_GIVEN_NAME = 'Erased';

// Catalogue keys under `PrivacyConsent.erase.dialog.removed.*` and `.kept.*`.
export const ERASE_REMOVED_ITEMS = [
  'name',
  'email',
  'dateOfBirth',
  'guardian',
  'photo',
  'voice',
  'recordings',
  'login',
] as const;

export const ERASE_KEPT_ITEMS = ['results', 'yearAndClass'] as const;

// The design's 48px modal select. NativeSelect renders its classes on the wrapper, so
// the control itself is reached with a descendant variant (as the add-student form).
export const ERASE_SELECT_CLASS =
  'w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:border-[1.5px] [&_select]:border-[#D8DFEA] [&_select]:bg-white [&_select]:px-3 [&_select]:text-sm [&_select]:text-[#0E2350] [&_select]:outline-none [&_select]:focus-visible:border-[#2563EB] [&_select]:focus-visible:ring-0';
