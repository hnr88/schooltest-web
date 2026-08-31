'use client';

import { useEffect, useState } from 'react';

import {
  getLoginLockoutDeadline,
  getLoginLockoutRemainingSeconds,
} from '@/modules/auth/lib/login-lockout';
import type { LoginLockout } from '@/modules/auth/types/auth.types';

export function useLoginLockoutCountdown(lockout: LoginLockout): number {
  const [deadline] = useState(() => getLoginLockoutDeadline(lockout, Date.now()));
  const [remaining, setRemaining] = useState(() =>
    getLoginLockoutRemainingSeconds(deadline, Date.now()),
  );

  useEffect(() => {
    if (remaining === 0) return undefined;
    const id = setInterval(() => {
      setRemaining(getLoginLockoutRemainingSeconds(deadline, Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [deadline, remaining]);

  return remaining;
}
