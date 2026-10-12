import type {
  ConsentAudience,
  ConsentConfig,
  ConsentRowModel,
  ConsentType,
} from '@/modules/privacy-consent/types/consent.types';

export interface PrivacyConsentPanelProps {
  studentDocumentId: string;
  audience: ConsentAudience;
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
