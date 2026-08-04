import type { UploadedMedia } from '@/modules/student-wizard/types/media.types';
import type { ReviewRowModel, WizardMode, WizardRailStep, WizardStepKey, WizardSubmitError } from '@/modules/student-wizard/types/student-wizard.types';
import type { HTMLInputTypeAttribute } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

export interface MediaPreviewProps {
  media: UploadedMedia;
  isImage: boolean;
  previewAlt: string;
  removeLabel: string;
  onRemove: () => void;
}

export interface NationalityComboboxProps {
  id: string;
  label: string;
  value: string;
  locale: string;
  placeholder: string;
  emptyLabel: string;
  helper?: string;
  error?: string;
  required?: boolean;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
}

export interface ReviewSummaryTableProps {
  rows: readonly ReviewRowModel[];
  emptyLabel: string;
}

export interface StepReviewProps {
  error: WizardSubmitError | null;
  onDismissError: () => void;
}

export interface WizardNavProps {
  step: number;
  stepCount: number;
  isLastStep: boolean;
  mode: WizardMode;
  pending: boolean;
  onBack: () => void;
  onContinue: () => void;
}

export interface WizardPageHeaderProps {
  title: string;
  backLabel: string;
}

export interface WizardStepPanelProps {
  step: number;
  stepKey: WizardStepKey;
  stepCount: number;
  error: WizardSubmitError | null;
  onDismissError: () => void;
}

export interface WizardStepRailProps {
  steps: readonly WizardRailStep[];
  current: number;
  maxReached: number;
  ariaLabel: string;
  onSelect: (step: number) => void;
}

export interface WizardSuccessProps {
  title: string;
  body: string;
}

export interface WizardTextFieldProps {
  id: string;
  label: string;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  helper?: string;
  error?: string;
  max?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'numeric';
  registration: UseFormRegisterReturn;
}
