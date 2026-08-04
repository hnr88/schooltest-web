import type { ReactNode } from 'react';

import type { AuthUser } from '@/modules/auth';

export interface CountryComboboxProps {
  id: string;
  label: string;
  value: string;
  locale: string;
  placeholder: string;
  emptyLabel: string;
  error?: string;
  required?: boolean;
  onValueChange: (code: string) => void;
  onBlur?: () => void;
}

export interface OnboardingProfileFormProps {
  user: AuthUser | null;
  onSaved: () => void;
  onSkip: () => void;
  isSkipPending: boolean;
}

export type WizardStepKey = 'welcome' | 'profile' | 'finish';

export type OnboardingStepKey = 'welcome' | 'finish';

export interface OnboardingStepProps {
  step: OnboardingStepKey;
  onContinue: () => void;
  onComplete: () => void;
  onSkip: () => void;
  isPending: boolean;
  // The finish step's "Get started" stays locked until the parent profile is
  // complete (saved this session or already complete on the server).
  completeDisabled?: boolean;
  completeHint?: string;
}

export interface OnboardingShellProps {
  children: ReactNode;
  contentClassName: string;
}

export interface OnboardingErrorStateProps {
  onRetry: () => void;
}
