'use client';

import { TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Link } from '@/i18n/navigation';
import { AuthBackLink } from '@/modules/auth/components/AuthBackLink';
import { ResetPasswordForm } from '@/modules/auth/components/ResetPasswordForm';
import { Button, Logo } from '@/modules/design-system';

interface ResetPasswordCardProps {
  code?: string;
}

// Split-layout reset column (design spec 06 §1.1): bare 420px stack on the page
// background that swaps between the new-password form and ONE generic
// invalid/expired error state (missing code OR any reset 400). Deliberately NO
// authed redirect — a user may reset while a stale token exists.
export function ResetPasswordCard({ code }: ResetPasswordCardProps) {
  const t = useTranslations('Auth');
  const tHome = useTranslations('Home');
  const [isInvalid, setIsInvalid] = useState(false);

  return (
    <div className="flex w-full animate-in flex-col gap-6 duration-500 ease-out-expo fade-in slide-in-from-bottom-3 motion-reduce:animate-none">
      <Link
        href="/"
        className="self-start rounded-sm transition-transform duration-200 ease-out-expo hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:hidden"
      >
        <Logo alt={tHome('footer.logoAlt')} height={30} />
      </Link>
      {!code || isInvalid ? (
        <div className="flex flex-col gap-5">
          <span
            aria-hidden="true"
            className="flex size-11 items-center justify-center rounded-tile bg-danger-soft-2 text-danger-strong"
          >
            <TriangleAlert className="size-5" />
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="text-auth-title font-bold text-foreground">{t('invalidLinkTitle')}</h1>
            <p className="text-body-md text-body">{t('invalidLinkBody')}</p>
          </div>
          <Button
            href="/forgot-password"
            size="xl"
            className="w-full rounded-lg shadow-sm transition-[transform,background-color,box-shadow] duration-150 ease-out-expo hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            {t('requestNewLink')}
          </Button>
        </div>
      ) : (
        <ResetPasswordForm code={code} onInvalidCode={() => setIsInvalid(true)} />
      )}
      <AuthBackLink label={t('backToSignIn')} />
    </div>
  );
}
