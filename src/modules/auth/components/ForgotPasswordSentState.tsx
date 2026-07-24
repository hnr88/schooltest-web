'use client';

import { CircleCheck, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { ResendCountdownButton } from '@/modules/auth/components/ResendCountdownButton';
import { classifyForgotPasswordError } from '@/modules/auth/lib/classify-forgot-password-error';
import { useForgotPasswordMutation } from '@/modules/auth/queries/use-forgot-password.mutation';
import type { ForgotPasswordErrorKey } from '@/modules/auth/types/auth.types';
import { Alert } from '@/modules/design-system';

interface ForgotPasswordSentStateProps {
  email: string;
}

// Sent state of the forgot-password card (§14.3): teal mail tile, expiry copy
// (30 min = D-AUTH-2), success strip, 60s resend countdown. A resend 429
// renders the tooManyRequests inline error (server budget 2/hour/email).
export function ForgotPasswordSentState({ email }: ForgotPasswordSentStateProps) {
  const t = useTranslations('Auth');
  const forgotPassword = useForgotPasswordMutation();
  const [resendError, setResendError] = useState<ForgotPasswordErrorKey | null>(null);

  const handleResend = () => {
    setResendError(null);
    forgotPassword.mutate(
      { email },
      {
        onError: (error) => setResendError(classifyForgotPasswordError(error)),
      },
    );
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-tile bg-teal-50 text-teal-600"
      >
        <Mail className="size-5" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-auth-title font-bold text-foreground">{t('sentTitle')}</h1>
        <p className="text-body-md text-muted-foreground">
          {t.rich('sentBody', {
            email,
            strong: (chunks) => <strong className="font-semibold text-foreground">{chunks}</strong>,
          })}
        </p>
      </div>
      <p className="flex items-center gap-2 rounded-lg border border-teal-100 bg-teal-50 px-3.5 py-3 text-body-sm text-teal-600">
        <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
        {t('sentSuccess')}
      </p>
      {resendError ? (
        <Alert variant="error" title={t(resendError)}>
          {null}
        </Alert>
      ) : null}
      <ResendCountdownButton onResend={handleResend} isPending={forgotPassword.isPending} />
    </div>
  );
}
