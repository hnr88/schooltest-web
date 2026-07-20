'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Link, useRouter } from '@/i18n/navigation';
import { GoogleButton } from '@/modules/auth/components/GoogleButton';
import { SignUpConfirmState } from '@/modules/auth/components/SignUpConfirmState';
import { SignUpForm } from '@/modules/auth/components/SignUpForm';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import { Card, CardContent, Logo, Separator } from '@/modules/design-system';

// Sibling of SignInCard per D10: same DS card layout/copy-family, submitting
// through the register endpoint (C-AUTH-REGISTER). On register 200 the card
// content swaps to the check-your-email state (§14.2, D-AUTH-1 — no jwt, no
// redirect) holding the submitted email for the resend flow.
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

  return (
    <Card className="w-full animate-in rounded-2xl shadow-lg duration-300 [--card-spacing:--spacing(8)] fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
      <CardContent className="flex flex-col">
        <Link href="/" className="self-start rounded-sm lg:hidden">
          <Logo alt={tHome('footer.logoAlt')} height={26} />
        </Link>
        {registeredEmail !== null ? (
          <div className="mt-5">
            <SignUpConfirmState email={registeredEmail} />
          </div>
        ) : (
          <>
            <h1 className="mt-5 text-2xl font-bold">{t('signUpTitle')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('signUpSubtitle')}</p>
            <GoogleButton className="mt-5 w-full" />
            <div aria-hidden="true" className="my-4 flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">{t('orDivider')}</span>
              <Separator className="flex-1" />
            </div>
            <SignUpForm onRegistered={setRegisteredEmail} />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {t('hasAccount')}{' '}
              <Link
                href="/sign-in"
                className="font-semibold text-foreground underline-offset-4 transition-colors hover:underline"
              >
                {t('signInLink')}
              </Link>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
