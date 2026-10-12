import { isAxiosError } from 'axios';
import type { StrapiErrorBody } from '@/modules/auth/types/auth.types';
import type { FormErrorKey } from '@/modules/auth/types/components.types';

// Mirrors the API's PASSWORD_POLICY_ERROR_PREFIX (schooltest-api
// src/utils/password-policy.ts): with PASSWORD_POLICY_ENFORCE on, a weak new
// password is a 400 whose message starts with this prefix. The text is only
// used to SELECT a translated state; the raw server string is never rendered.
export const PASSWORD_POLICY_ERROR_PREFIX = 'Password policy:';

export function isPasswordPolicyError(error: unknown): boolean {
  if (!isAxiosError<StrapiErrorBody>(error)) return false;
  const message = error.response?.data?.error?.message;
  return (
    error.response?.status === 400 &&
    typeof message === 'string' &&
    message.startsWith(PASSWORD_POLICY_ERROR_PREFIX)
  );
}

export function classifyError(error: unknown): FormErrorKey {
  if (isAxiosError(error)) {
    if (isPasswordPolicyError(error)) return 'weakPassword';
    if (error.response?.status === 400) return 'takenError';
    if (error.response === undefined) return 'offlineError';
  }
  return 'registerError';
}
