import { RESET_PASSWORD_MAX_BYTES } from '@/modules/auth/constants/auth.constants';

export function getResetPasswordByteLength(password: string): number {
  return new TextEncoder().encode(password).length;
}

export function isResetPasswordWithinByteLimit(password: string): boolean {
  return getResetPasswordByteLength(password) <= RESET_PASSWORD_MAX_BYTES;
}
