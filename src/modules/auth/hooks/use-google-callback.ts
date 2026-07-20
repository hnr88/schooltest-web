'use client';

import { useEffect, useRef } from 'react';

import { useRouter } from '@/i18n/navigation';
import { useGoogleCallbackMutation } from '@/modules/auth/queries/use-google-callback.mutation';

// Drives the C-AUTH-GOOGLE post-consent exchange (D18): queryString is the
// full query /auth/google/callback received (resolved server-side from
// searchParams). An empty query (the only exercisable path pre-credentials,
// D5 — GOOGLE_ENABLED is off, so the api's real callback answers its typed
// disabled-provider 400 for any forwarded query too) routes straight to the
// error state; otherwise the query is forwarded and the outcome decides the
// route. Runs exactly once per mount (ref guard) regardless of effect re-runs.
export function useGoogleCallback(queryString: string) {
  const router = useRouter();
  const callback = useGoogleCallbackMutation();
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    if (!queryString) {
      router.replace('/sign-in?error=google');
      return;
    }

    callback.mutate(queryString, {
      onSuccess: () => router.replace('/dashboard'),
      onError: () => router.replace('/sign-in?error=google'),
    });
  }, [queryString, router, callback]);
}
