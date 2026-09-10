'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Link, useRouter } from '@/i18n/navigation';
import { AuthBackLink } from '@/modules/auth/components/AuthBackLink';
import { ForgotPasswordForm } from '@/modules/auth/components/ForgotPasswordForm';
import { ForgotPasswordSentState } from '@/modules/auth/components/ForgotPasswordSentState';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import { Logo } from '@/modules/design-system';

// Right-hand form column of the forgot-password split (design spec 06 §1.3):
// a bare 420px stack on the page background — no card chrome — matching the
// sign-in split layout. Content swaps between the request form and the
// enumeration-safe sent state.
export function ForgotPasswordCard() {
  const t = useTranslations('Auth');
  const tShell = useTranslations('Shell.sidebar');
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const hydrate = useAuthStore((state) => state.hydrate);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [retrySeconds, setRetrySeconds] = useState<number | undefined>(undefined);

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
        <Logo alt={tShell('logoAlt')} height={30} />
      </Link>
      {sentEmail ? (
        <ForgotPasswordSentState rateLimited={rateLimited} retrySeconds={retrySeconds} />
      ) : (
        <ForgotPasswordForm
          onSent={(email, options) => {
            setSentEmail(email);
            setRateLimited(options?.rateLimited ?? false);
            setRetrySeconds(options?.retrySeconds);
          }}
        />
      )}
      <AuthBackLink label={t('portal.backToLogin')} />
    </div>
  );
}
