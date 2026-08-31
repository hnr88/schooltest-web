import type { ReactNode } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

import type { LoginLockout, PasswordRuleState } from '@/modules/auth/types/auth.types';

export interface AuthBackLinkProps {
  label: string;
}

export interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

export interface AuthCenteredLayoutProps {
  children: ReactNode;
  /** `wide` is the 560px register column; `narrow` the 420px card screens. */
  width?: 'narrow' | 'wide';
}

export interface AuthDividerProps {
  label: string;
}

export interface AuthFieldErrorProps {
  id: string;
  message: string;
}

export interface AuthSplitLayoutProps {
  children: ReactNode;
}

export interface ForgotPasswordFormProps {
  onSent: (email: string) => void;
}

export interface ForgotPasswordSentStateProps {
  email: string;
}

export interface GoogleButtonProps {
  className?: string;
}

export interface GoogleCallbackScreenProps {
  queryString: string;
}

export interface OpsGuardProps {
  children: ReactNode;
}

export interface ParentGuardProps {
  children: ReactNode;
}

export interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder: string;
  autoComplete: string;
  visible: boolean;
  onToggleVisible: () => void;
  toggleLabel: string;
  error?: string;
  registration: UseFormRegisterReturn;
  labelAccessory?: ReactNode;
}

export interface ResendCountdownButtonProps {
  onResend: () => void;
  seconds?: number;
  isPending?: boolean;
  labelKey?: string;
  countdownLabelKey?: string;
}

export interface ResetPasswordCardProps {
  code?: string;
}

export interface ResetPasswordFormProps {
  code: string;
  onExpiredCode: () => void;
  onInvalidCode: () => void;
  onSuccess: () => void;
}

export interface ResetPasswordRuleChecklistProps {
  state: PasswordRuleState;
}

export interface SchoolAdminGuardProps {
  children: ReactNode;
}

export interface SchoolStaffGuardProps {
  children: ReactNode;
}

export interface SignInCardProps {
  hasGoogleError?: boolean;
  hasSessionExpired?: boolean;
  showConfirmedBanner?: boolean;
}

export interface SignInFormProps {
  onLocked: (lockout: LoginLockout) => void;
}

export interface SignInLockedStateProps {
  lockout: LoginLockout;
  onExpired: () => void;
}

export interface SignUpConfirmStateProps {
  email: string;
}

export type FormErrorKey = 'takenError' | 'offlineError' | 'registerError';

export interface SignUpFormProps {
  onRegistered: (email: string) => void;
}

export interface TeacherGuardProps {
  children: ReactNode;
}

export interface TextFieldProps {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  placeholder: string;
  error?: string;
  registration: UseFormRegisterReturn;
}
