'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Link, useRouter } from '@/i18n/navigation';
import { AuthDivider } from '@/modules/auth/components/AuthDivider';
import { GoogleButton } from '@/modules/auth/components/GoogleButton';
import { SignUpConfirmState } from '@/modules/auth/components/SignUpConfirmState';
import { SignUpForm } from '@/modules/auth/components/SignUpForm';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import { Logo } from '@/modules/design-system';

// Right-hand form column of the sign-up split (design spec 06 §1.1): a bare
// 420px stack on the page background — no card chrome — at a 24px rhythm.
// Google keeps its DOM position ABOVE the credential fields (the §1.4
// compact-card ordering) because tests/e2e/a11y-auth.spec.ts pins the focus
// order logo → Google → username.
export function SignUpCard() {
  const t = useTranslations('Auth');
  const tHome = useTranslations('Home');
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
      <div className="flex w-full flex-col gap-6">
        <SignUpConfirmState email={registeredEmail} />
      </div>
    );
  }

  return (
    <div className="flex w-full animate-in flex-col gap-6 duration-500 ease-out-expo fade-in slide-in-from-bottom-3 motion-reduce:animate-none">
      <Link
        href="/"
        className="self-start rounded-sm transition-transform duration-200 ease-out-expo hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:hidden"
      >
        <Logo alt={tHome('footer.logoAlt')} height={30} />
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-auth-title font-bold text-foreground">{t('signUpTitle')}</h1>
        <p className="text-body-md text-body">{t('signUpSubtitle')}</p>
      </div>
      <GoogleButton className="w-full" />
      <AuthDivider label={t('orDivider')} />
      <SignUpForm onRegistered={setRegisteredEmail} />
      <p className="text-center text-body-md text-body">
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
