'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useRouter } from '@/i18n/navigation';
import { AuthBackLink } from '@/modules/auth/components/AuthBackLink';
import { AuthCard } from '@/modules/auth/components/AuthCard';
import { ForgotPasswordForm } from '@/modules/auth/components/ForgotPasswordForm';
import { ForgotPasswordSentState } from '@/modules/auth/components/ForgotPasswordSentState';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';

// Forgot-password screen (design spec 06 §1.3): the centred logo lockup above a
// 420px card whose content swaps between the request form (card A) and the
// enumeration-safe sent state (card B) — the design draws both side by side.
export function ForgotPasswordCard() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const hydrate = useAuthStore((state) => state.hydrate);
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // Already signed in (store holds a JWT) → straight to the dashboard (D11).
  useEffect(() => {
    if (hydrated && token) router.replace('/dashboard');
  }, [hydrated, token, router]);

  return (
    <AuthCard>
      {sentEmail ? (
        <ForgotPasswordSentState email={sentEmail} />
      ) : (
        <ForgotPasswordForm onSent={setSentEmail} />
      )}
      <AuthBackLink label={t('backToSignIn')} />
    </AuthCard>
  );
}
