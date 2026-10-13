export { PrivacyConsentPanel } from './components/PrivacyConsentPanel';
export { ConsentAttestationFields } from './components/ConsentAttestationFields';
export { ConsentAttestationProvider } from './components/ConsentAttestationProvider';
export { useConsentAttestation } from './hooks/use-consent-attestation';
export { useConsentAttestationOptions } from './hooks/use-consent-attestation-options';
export {
  buildConsentAttestation,
  EMPTY_ATTESTATION_SELECTION,
  isAttestationMissing,
} from './lib/consent-attestation';
export { classifyConsentError } from './lib/classify-consent-error';
export { CONSENT_CONFIG_QUERY_KEY } from './constants/queries.constants';
export type {
  ConsentAttestationBody,
  ConsentAttestationOptions,
  ConsentAttestationSelection,
  ConsentAudience,
} from './types/consent.types';
