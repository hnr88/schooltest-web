import { RESET_PASSWORD_MAX_BYTES } from '@/modules/auth/constants/auth.constants';

import type { ResetPasswordRuleStates } from '@/modules/auth/types/auth.types';

export const RESET_PASSWORD_MIN_LENGTH = 12;

export function getResetPasswordByteLength(password: string): number {
  return new TextEncoder().encode(password).length;
}

export function isResetPasswordWithinByteLimit(password: string): boolean {
  return getResetPasswordByteLength(password) <= RESET_PASSWORD_MAX_BYTES;
}

export function isResetPasswordLengthValid(password: string): boolean {
  return password.length >= RESET_PASSWORD_MIN_LENGTH;
}

export function hasResetPasswordCharClasses(password: string): boolean {
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  return hasDigit && hasSymbol;
}

export function getResetPasswordRuleStates(password: string): ResetPasswordRuleStates {
  if (password.length === 0) {
    return { length: 'pending', charClasses: 'pending', history: 'pending' };
  }
  return {
    length: isResetPasswordLengthValid(password) ? 'met' : 'unmet',
    charClasses: hasResetPasswordCharClasses(password) ? 'met' : 'unmet',
    history: 'pending',
  };
}
