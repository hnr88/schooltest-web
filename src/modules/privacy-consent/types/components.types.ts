import type {
  ConsentAttestationOptions,
  ConsentAttestationRefusal,
  ConsentAttestationSelection,
  ConsentAudience,
  ConsentConfig,
  ConsentRowModel,
  ConsentType,
} from '@/modules/privacy-consent/types/consent.types';

export interface PrivacyConsentPanelProps {
  studentDocumentId: string;
  audience: ConsentAudience;
  /**
   * School administrator page only (W4-21): the student's own status and name. They
   * decide whether "Erase this student's personal data" is offered. Left out, the
   * panel is exactly what it was.
   */
  studentStatus?: string | null;
  studentGivenName?: string | null;
  studentFamilyName?: string | null;
}

export interface ConsentRowProps {
  row: ConsentRowModel;
  config: ConsentConfig;
  studentDocumentId: string;
  audience: ConsentAudience;
}

export interface GrantConsentButtonProps {
  row: ConsentRowModel;
  studentDocumentId: string;
  audience: ConsentAudience;
}

export interface WithdrawConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ConsentType;
  recordDocumentId: string;
  /** True when a missing AI consent sends this student's writing to a teacher to mark. */
  aiGateOn: boolean;
}

export interface ConsentAttestationFieldsProps {
  options: ConsentAttestationOptions;
  value: ConsentAttestationSelection;
  onChange: (next: ConsentAttestationSelection) => void;
  /** Show the "tick data collection" message (after a submit attempt or with rows ready). */
  showRequiredError?: boolean;
  /** A 409 the server answered, shown inline. */
  refusal?: ConsentAttestationRefusal | null;
  disabled?: boolean;
  /** Distinguishes the two surfaces' control ids when both exist in one document. */
  idPrefix?: string;
}

export interface EraseStudentSectionProps {
  studentDocumentId: string;
  givenName: string | null | undefined;
  /** `offer`: the entry and its dialog. `erased`: the note that it was done. */
  state: 'offer' | 'erased';
}

export interface EraseStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentDocumentId: string;
  /** The student's given name: what the administrator must type to confirm. */
  givenName: string;
}
