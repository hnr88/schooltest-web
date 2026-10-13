import { ATTESTABLE_CONSENT_TYPES } from '@/modules/privacy-consent/constants/components.constants';
import type {
  ConsentAttestationBody,
  ConsentAttestationOptions,
  ConsentAttestationSelection,
  ConsentConfig,
} from '@/modules/privacy-consent/types/consent.types';

// Both boxes start unticked, always: consent is never pre-filled for the school.
export const EMPTY_ATTESTATION_SELECTION: ConsentAttestationSelection = {
  data_collection: false,
  ai_processing: false,
};

const HIDDEN_OPTIONS: ConsentAttestationOptions = {
  visible: false,
  required: false,
  aiConsentRequired: false,
  policyVersion: null,
  statements: {},
};

// What the attestation may show, read from the live config. It is visible only while
// `consent_records_enabled` is ON; `guardian_consent_required` counts only together
// with it (the pair is the API gate, W4-14). With the config unread it is hidden.
export function deriveAttestationOptions(config: ConsentConfig | undefined): ConsentAttestationOptions {
  if (config === undefined || !config.consent_records_enabled) {
    return HIDDEN_OPTIONS;
  }
  const statements: ConsentAttestationOptions['statements'] = {};
  for (const type of ATTESTABLE_CONSENT_TYPES) {
    const statement = config.statements.find((entry) => entry.type === type);
    if (statement !== undefined) {
      statements[type] = statement;
    }
  }
  return {
    visible: true,
    required: config.guardian_consent_required,
    aiConsentRequired: config.ai_consent_required,
    policyVersion: config.policy.version,
    statements,
  };
}

// The `consent_attestation` request object, or undefined (so the key is left out
// and the request is byte-identical to today) while the section is hidden or
// nothing is ticked.
export function buildConsentAttestation(
  options: ConsentAttestationOptions,
  selection: ConsentAttestationSelection,
): ConsentAttestationBody | undefined {
  if (!options.visible) {
    return undefined;
  }
  const types = ATTESTABLE_CONSENT_TYPES.filter((type) => selection[type]);
  return types.length === 0 ? undefined : { consent_types: [...types] };
}

// The local rule, mirroring the API's `GUARDIAN_CONSENT_REQUIRED`: when guardian
// consent is required a data collection attestation must be ticked. The server
// stays the authority.
export function isAttestationMissing(
  options: ConsentAttestationOptions,
  selection: ConsentAttestationSelection,
): boolean {
  return options.visible && options.required && !selection.data_collection;
}
