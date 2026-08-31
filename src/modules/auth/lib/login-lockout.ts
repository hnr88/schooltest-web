import type { LoginLockout } from '@/modules/auth/types/auth.types';

export function getLoginLockoutDeadline(lockout: LoginLockout, receivedAt: number): number {
  const retryDeadline = receivedAt + lockout.retryAfterSeconds * 1000;
  const unlockDeadline = Date.parse(lockout.unlockAt);
  return Number.isFinite(unlockDeadline) ? Math.min(retryDeadline, unlockDeadline) : retryDeadline;
}

export function getLoginLockoutRemainingSeconds(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
