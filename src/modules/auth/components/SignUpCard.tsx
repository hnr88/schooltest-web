'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { GoogleButton } from '@/modules/auth/components/GoogleButton';
import { SignUpForm } from '@/modules/auth/components/SignUpForm';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import { Card, CardContent, Logo, Separator } from '@/modules/design-system';

// Sibling of SignInCard per D10: same DS card layout/copy-family, submitting
// through the register endpoint (C-AUTH-REGISTER) instead of login.
export function SignUpCard() {
  const t = useTranslations('Auth');
  const tHome = useTranslations('Home');
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // Already signed in (store holds a JWT) → straight to the dashboard (D11).
  useEffect(() => {
    if (hydrated && token) router.replace('/dashboard');
  }, [hydrated, token, router]);

  return (
    <Card className="w-full rounded-2xl shadow-lg [--card-spacing:--spacing(8)]">
      <CardContent className="flex flex-col">
        <Link href="/" className="self-start rounded-sm">
          <Logo alt={tHome('footer.logoAlt')} height={26} />
        </Link>
        <h1 className="mt-5 text-xl font-bold">{t('signUpTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('signUpSubtitle')}</p>
        <GoogleButton className="mt-5 w-full" />
        <div aria-hidden="true" className="my-4 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">{t('orDivider')}</span>
          <Separator className="flex-1" />
        </div>
        <SignUpForm />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('hasAccount')}{' '}
          <Link
            href="/sign-in"
            className="font-semibold text-foreground underline-offset-4 hover:underline"
          >
            {t('signInLink')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
