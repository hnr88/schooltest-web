'use client';

import { ArrowLeft, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Link } from '@/i18n/navigation';
import { ResetPasswordForm } from '@/modules/auth/components/ResetPasswordForm';
import { Button, Card, CardContent, Logo } from '@/modules/design-system';

interface ResetPasswordCardProps {
  code?: string;
}

// §14.3 card reuse: centered logo lockup above a 420px card that swaps between
// the new-password form and ONE generic invalid/expired error state (missing
// code OR any reset 400). Deliberately NO authed redirect — a user may reset
// while a stale token exists (C-UI-AUTH-PAGES keeps SignInCard's redirect off).
export function ResetPasswordCard({ code }: ResetPasswordCardProps) {
  const t = useTranslations('Auth');
  const tHome = useTranslations('Home');
  const [isInvalid, setIsInvalid] = useState(false);

  return (
    <Card className="w-full animate-in rounded-2xl shadow-lg duration-300 [--card-spacing:--spacing(8)] fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
      <CardContent className="flex flex-col">
        <Link href="/" className="self-start rounded-sm lg:hidden">
          <Logo alt={tHome('footer.logoAlt')} height={26} />
        </Link>
        <div className="mt-5 flex flex-col gap-5">
          {!code || isInvalid ? (
            <div className="flex animate-in flex-col gap-5 duration-300 fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
              <span
                aria-hidden="true"
                className="flex size-11 items-center justify-center rounded-xl bg-red-100 text-red-600"
              >
                <TriangleAlert className="size-5" />
              </span>
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold">{t('invalidLinkTitle')}</h1>
                <p className="text-sm text-muted-foreground">{t('invalidLinkBody')}</p>
              </div>
              <Button href="/forgot-password" size="lg" className="w-full">
                {t('requestNewLink')}
              </Button>
            </div>
          ) : (
            <ResetPasswordForm code={code} onInvalidCode={() => setIsInvalid(true)} />
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
