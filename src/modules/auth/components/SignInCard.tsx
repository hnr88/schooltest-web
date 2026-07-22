'use client';

import { CircleCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { Link, useRouter } from '@/i18n/navigation';
import { AuthDivider } from '@/modules/auth/components/AuthDivider';
import { GoogleButton } from '@/modules/auth/components/GoogleButton';
import { SignInForm } from '@/modules/auth/components/SignInForm';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import { Alert, Logo } from '@/modules/design-system';

interface SignInCardProps {
  hasGoogleError?: boolean;
  hasSessionExpired?: boolean;
  showConfirmedBanner?: boolean;
}

// Right-hand form column of the login split (design spec 06 §1.1): a bare 420px
// stack on the page background — no card chrome — at a 24px rhythm. Google keeps
// its DOM position ABOVE the credential fields (the §1.4 compact-card ordering)
// because tests/e2e/a11y-auth.spec.ts pins the focus order logo → Google → email.
export function SignInCard({
  hasGoogleError = false,
  hasSessionExpired = false,
  showConfirmedBanner = false,
}: SignInCardProps) {
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
    <div className="flex w-full animate-in flex-col gap-6 duration-500 ease-out-expo fade-in slide-in-from-bottom-3 motion-reduce:animate-none">
      <Link
        href="/"
        className="self-start rounded-sm transition-transform duration-200 ease-out-expo hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:hidden"
      >
        <Logo alt={tHome('footer.logoAlt')} height={30} />
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-auth-title font-bold text-foreground">{t('signInTitle')}</h1>
        {/* text-muted-foreground on --background measures a razor-thin 4.51:1 —
            text-body (--color-body) clears it at ~7.19:1. */}
        <p className="text-body-md text-body">{t('signInSubtitle')}</p>
      </div>
      {showConfirmedBanner ? (
        // C-AUTH-CONFIRM lands here via /sign-in?confirmed=1 — success strip
        // above the form, same styling family as the forgot-password strip.
        <p className="flex animate-in items-center gap-2 rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 text-body-md text-teal-600 duration-300 fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
          <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
          {t('emailConfirmedBanner')}
        </p>
      ) : null}
      {hasGoogleError ? (
        <Alert variant="error" title={t('googleError')}>
          {null}
        </Alert>
      ) : null}
      {hasSessionExpired ? (
        // C-AUTH-CHANGE 401 lands here via /sign-in?error=session — the
        // change-password form clears the dead session then leaves for this
        // styled explanation of why a signed-in screen kicked the user out.
        <Alert variant="error" title={t('sessionExpired')}>
          {null}
        </Alert>
      ) : null}
      <GoogleButton className="w-full" />
      <AuthDivider label={t('orDivider')} />
      <SignInForm />
      <p className="text-center text-body-md text-body">
        {t('noAccount')}{' '}
        <Link
          href="/sign-up"
          className="rounded-sm font-semibold text-primary transition-colors duration-150 hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t('signUp')}
        </Link>
      </p>
    </div>
  );
}
