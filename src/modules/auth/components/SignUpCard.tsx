'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Link, useRouter } from '@/i18n/navigation';
import { AuthDivider } from '@/modules/auth/components/AuthDivider';
import { GoogleButton } from '@/modules/auth/components/GoogleButton';
import { SignUpConfirmState } from '@/modules/auth/components/SignUpConfirmState';
import { SignUpForm } from '@/modules/auth/components/SignUpForm';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';

// Register screen (design spec 06 §1.2): centred 560px column — heading block,
// then the white r16 form card on a 1px --border rule with --shadow-sm, then the
// "already have an account" line. Submitting goes through the register endpoint
// (C-AUTH-REGISTER); on 200 the card swaps to the check-your-email state (§14.2,
// D-AUTH-1 — no jwt, no redirect) holding the submitted email for the resend
// flow. Google keeps its DOM slot above the fields (a11y-auth.spec focus order).
export function SignUpCard() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const hydrate = useAuthStore((state) => state.hydrate);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // Already signed in (store holds a JWT) → straight to the dashboard (D11).
  useEffect(() => {
    if (hydrated && token) router.replace('/dashboard');
  }, [hydrated, token, router]);

  if (registeredEmail !== null) {
    return (
      <div className="rounded-panel border border-border bg-card p-7 shadow-sm sm:p-8">
        <SignUpConfirmState email={registeredEmail} />
      </div>
    );
  }

  return (
    <div className="flex animate-in flex-col gap-6 duration-500 ease-out-expo fade-in slide-in-from-bottom-3 motion-reduce:animate-none">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-auth-title font-bold text-foreground">{t('signUpTitle')}</h1>
        <p className="text-body-md text-muted-foreground">{t('signUpSubtitle')}</p>
      </div>
      <div className="flex flex-col gap-4 rounded-panel border border-border bg-card p-7 shadow-sm sm:p-8">
        <GoogleButton className="w-full" />
        <AuthDivider label={t('orDivider')} />
        <SignUpForm onRegistered={setRegisteredEmail} />
      </div>
      <p className="text-center text-body-md text-muted-foreground">
        {t('hasAccount')}{' '}
        <Link
          href="/sign-in"
          className="rounded-sm font-semibold text-primary transition-colors duration-150 hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t('signInLink')}
        </Link>
      </p>
    </div>
  );
}
