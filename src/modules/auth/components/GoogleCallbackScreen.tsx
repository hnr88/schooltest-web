'use client';

import { useTranslations } from 'next-intl';

import { useGoogleCallback } from '@/modules/auth/hooks/use-google-callback';
import { Skeleton } from '@/modules/design-system';

interface GoogleCallbackScreenProps {
  queryString: string;
}

// Bridge screen for the C-AUTH-GOOGLE post-consent redirect (D18): the query
// forwarding + jwt/error routing lives in useGoogleCallback, so this always
// redirects away (to /dashboard or /sign-in?error=google) — this brief
// "connecting" state is the only thing a visitor ever sees rendered here.
export function GoogleCallbackScreen({ queryString }: GoogleCallbackScreenProps) {
  const t = useTranslations('Auth');
  useGoogleCallback(queryString);

  return (
    <div role="status" aria-live="polite" className="flex w-full max-w-md flex-col gap-4">
      <p className="text-center text-sm text-muted-foreground">{t('googleConnecting')}</p>
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}
