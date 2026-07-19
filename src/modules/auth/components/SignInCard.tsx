'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { GoogleButton } from '@/modules/auth/components/GoogleButton';
import { SignInForm } from '@/modules/auth/components/SignInForm';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import { Alert, Card, CardContent, Logo, Separator } from '@/modules/design-system';

interface SignInCardProps {
  hasGoogleError?: boolean;
}

export function SignInCard({ hasGoogleError = false }: SignInCardProps) {
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
        <h1 className="mt-5 text-xl font-bold">{t('signInTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('signInSubtitle')}</p>
        {hasGoogleError ? (
          <Alert variant="error" title={t('googleError')} className="mt-4">
            {null}
          </Alert>
        ) : null}
        <GoogleButton className="mt-5 w-full" />
        <div aria-hidden="true" className="my-4 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">{t('orDivider')}</span>
          <Separator className="flex-1" />
        </div>
        <SignInForm />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('noAccount')}{' '}
          <Link
            href="/sign-up"
            className="font-semibold text-foreground underline-offset-4 hover:underline"
          >
            {t('signUp')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
