'use client';

import { useEffect, useRef } from 'react';

import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/modules/auth';

// Spec section 5: the "Sign out" sub-tab signs the user out and redirects to
// login. Same mechanism as the rail's user menu — the auth module's logout
// (clears the JWT and the me query) followed by a replace to /sign-in — so the
// app keeps exactly one sign-out path. The ref makes it fire once even though
// `logout` is a new identity on every render.
export function useAccountSignOut() {
  const router = useRouter();
  const { logout } = useAuth();
  const hasSignedOut = useRef(false);

  useEffect(() => {
    if (hasSignedOut.current) return;
    hasSignedOut.current = true;
    logout();
    router.replace('/sign-in');
  }, [logout, router]);
}
