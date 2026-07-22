'use client';

import { TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { AuthBackLink } from '@/modules/auth/components/AuthBackLink';
import { AuthCard } from '@/modules/auth/components/AuthCard';
import { ResetPasswordForm } from '@/modules/auth/components/ResetPasswordForm';
import { Button } from '@/modules/design-system';

interface ResetPasswordCardProps {
  code?: string;
}

// §1.3 card reuse: the centred logo lockup above a 420px card that swaps between
// the new-password form and ONE generic invalid/expired error state (missing
// code OR any reset 400). Deliberately NO authed redirect — a user may reset
// while a stale token exists (C-UI-AUTH-PAGES keeps SignInCard's redirect off).
export function ResetPasswordCard({ code }: ResetPasswordCardProps) {
  const t = useTranslations('Auth');
  const [isInvalid, setIsInvalid] = useState(false);

  return (
    <AuthCard>
      {!code || isInvalid ? (
        <div className="flex animate-in flex-col gap-5 duration-300 fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
          <span
            aria-hidden="true"
            className="flex size-11 items-center justify-center rounded-tile bg-danger-soft-2 text-danger-strong"
          >
            <TriangleAlert className="size-5" />
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="text-h3 font-bold text-foreground">{t('invalidLinkTitle')}</h1>
            <p className="text-body-md text-muted-foreground">{t('invalidLinkBody')}</p>
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
    </AuthCard>
  );
}
