import type {
  ConsentAttestationBody,
  ConsentAttestationOptions,
  ConsentAttestationRefusal,
  ConsentAttestationSelection,
  ConsentConfig,
  ConsentRowModel,
} from '@/modules/privacy-consent/types/consent.types';

export type PrivacyConsentPanelModel =
  | { status: 'hidden' }
  | { status: 'loading'; config: ConsentConfig }
  | {
      status: 'error';
      kind: 'notFound' | 'generic';
      config: ConsentConfig;
      retry: () => void;
      retrying: boolean;
    }
  | { status: 'ready'; config: ConsentConfig; rows: ConsentRowModel[] };

// The school attestation as one form-only value (W4-21). It is kept outside the
// student form's schema, so it can never enter the strict student body; the create
// mutation builds `consent_attestation` from it.
export interface ConsentAttestationContextValue {
  options: ConsentAttestationOptions;
  selection: ConsentAttestationSelection;
  setSelection: (next: ConsentAttestationSelection) => void;
  /** A 409 the server answered after submit, shown inline until the boxes change. */
  refusal: ConsentAttestationRefusal | null;
  reportRefusal: (refusal: ConsentAttestationRefusal) => void;
  /** The request object for the current boxes; undefined leaves the key out entirely. */
  attestation: ConsentAttestationBody | undefined;
  /** Guardian consent is required and data collection is not ticked. */
  missing: boolean;
}
