'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Link, useRouter } from '@/i18n/navigation';
import { ForgotPasswordForm } from '@/modules/auth/components/ForgotPasswordForm';
import { ForgotPasswordSentState } from '@/modules/auth/components/ForgotPasswordSentState';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import { Card, CardContent, Logo } from '@/modules/design-system';

// §14.3 forgot-password card: centered logo lockup above a 420px card whose
// content swaps between the request form and the enumeration-safe sent state.
export function ForgotPasswordCard() {
  const t = useTranslations('Auth');
  const tHome = useTranslations('Home');
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
    <Card className="w-full animate-in rounded-2xl shadow-lg duration-300 [--card-spacing:--spacing(8)] fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
      <CardContent className="flex flex-col">
        <Link href="/" className="self-start rounded-sm">
          <Logo alt={tHome('footer.logoAlt')} height={26} />
        </Link>
        <div className="mt-5 flex flex-col gap-5">
          {sentEmail ? (
            <ForgotPasswordSentState email={sentEmail} />
          ) : (
            <ForgotPasswordForm onSent={setSentEmail} />
          )}
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center gap-1.5 self-center text-sm font-semibold text-foreground transition-colors hover:text-blue-600"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {t('backToSignIn')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
