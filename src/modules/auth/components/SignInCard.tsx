'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { env } from '@/lib/env';
import { SignInForm } from '@/modules/auth/components/SignInForm';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import { Button, Card, CardContent, Logo, Separator } from '@/modules/design-system';

// The 4-color Google "G" brand mark from the DS sign-in card (brand hex fills
// are intrinsic to the mark, not theme tokens).
function GoogleMark() {
  return (
    <svg aria-hidden="true" focusable="false" className="size-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z"
      />
    </svg>
  );
}

export function SignInCard() {
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
        <Button
          variant="outline"
          size="lg"
          href={`${env.NEXT_PUBLIC_API_BASE_URL}/api/connect/google`}
          title={t('googleTitle')}
          className="mt-5 w-full"
        >
          <GoogleMark />
          {t('googleButton')}
        </Button>
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
