'use client';

import { CircleCheck, Link2Off } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button, Spinner } from '@/modules/design-system';
import { useMagicLinkVerify } from '@/modules/auth-verify/queries/use-magic-link-verify.query';
import type { MagicLinkVerifyScreenProps } from '@/modules/auth-verify/types/auth-verify.types';

/**
 * The web fallback for the magic-link emails' two verify links (student
 * /auth/student/verify, teacher /auth/teacher/verify). A single-use claim with
 * exactly three designed states: pending, success and error. The token itself
 * is never rendered or logged — it lives only in the request that claims it.
 */
export function MagicLinkVerifyScreen({ variant, token }: MagicLinkVerifyScreenProps) {
  const t = useTranslations('MagicLink');
  const { data, isPending, isError } = useMagicLinkVerify(variant, token);

  // A missing token is a malformed link — the same designed error state the
  // API's 400 answers, without a pointless request. isPending stays true for a
  // disabled query, so the empty token must short-circuit before it.
  if (token === '' || isError) {
    return (
      <div
        data-slot="magic-link-verify"
        data-state="error"
        className="flex w-full max-w-md flex-col items-center gap-4 text-center"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Link2Off className="size-6 text-muted-foreground" aria-hidden />
        </span>
        <h1 className="text-auth-title font-bold text-foreground">{t('errorTitle')}</h1>
        <p className="text-body-lg text-muted-foreground">{t(`errorBody.${variant}`)}</p>
        <Button href="/" size="lg" className="mt-2">
          {t('backHome')}
        </Button>
      </div>
    );
  }

  if (isPending || !data) {
    return (
      <div
        data-slot="magic-link-verify"
        data-state="pending"
        role="status"
        aria-live="polite"
        className="flex w-full max-w-md flex-col items-center gap-4 text-center"
      >
        <Spinner className="size-6 text-muted-foreground" />
        <p className="text-body-lg text-muted-foreground">{t('pending')}</p>
      </div>
    );
  }

  return (
    <div
      data-slot="magic-link-verify"
      data-state="success"
      className="flex w-full max-w-md animate-in flex-col items-center gap-4 text-center duration-500 ease-out-expo fade-in slide-in-from-bottom-3 motion-reduce:animate-none"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">
        <CircleCheck className="size-6 text-muted-foreground" aria-hidden />
      </span>
      <h1 className="text-auth-title font-bold text-foreground">{t('successTitle')}</h1>
      <div className="flex flex-col gap-1">
        {data.name ? (
          <p className="text-body-lg font-semibold text-foreground">{data.name}</p>
        ) : null}
        {data.detail ? <p className="text-body-sm text-muted-foreground">{data.detail}</p> : null}
      </div>
      <p className="text-body-lg text-muted-foreground">{t(`successBody.${variant}`)}</p>
      <Button href="/" size="lg" className="mt-2">
        {t('backHome')}
      </Button>
    </div>
  );
}
