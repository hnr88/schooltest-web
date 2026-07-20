'use client';

import { ArrowLeft, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Link } from '@/i18n/navigation';
import { ResendCountdownButton } from '@/modules/auth/components/ResendCountdownButton';
import { classifyResendConfirmationError } from '@/modules/auth/lib/classify-resend-confirmation-error';
import { useResendConfirmationMutation } from '@/modules/auth/queries/use-resend-confirmation.mutation';
import type { ResendConfirmationErrorKey } from '@/modules/auth/types/auth.types';
import { Alert } from '@/modules/design-system';

interface SignUpConfirmStateProps {
  email: string;
}

// Post-register "check your email" state (§14.2, C-AUTH-REGISTER/D-AUTH-1):
// no jwt exists, so there is NO auto-login and NO redirect — the card swaps
// to this state and the parent confirms via the emailed link. Resend fires
// C-AUTH-SEND-CONFIRM (server budget 2/hour/email INCLUDES the register-time
// send, so a second resend within the hour renders the 429 branch).
export function SignUpConfirmState({ email }: SignUpConfirmStateProps) {
  const t = useTranslations('Auth');
  const resend = useResendConfirmationMutation();
  const [resendError, setResendError] = useState<ResendConfirmationErrorKey | null>(null);

  const handleResend = () => {
    setResendError(null);
    resend.mutate(
      { email },
      { onError: (error) => setResendError(classifyResendConfirmationError(error)) },
    );
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600"
      >
        <Mail className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t('checkEmailTitle')}</h1>
        <p className="text-sm text-muted-foreground">
          {t.rich('checkEmailBody', {
            email,
            strong: (chunks) => <strong className="font-semibold text-foreground">{chunks}</strong>,
          })}
        </p>
      </div>
      {resendError === 'alreadyConfirmed' ? (
        <Alert variant="info" title={t('alreadyConfirmed')}>
          <Link
            href="/sign-in"
            className="font-semibold text-foreground underline-offset-4 transition-colors hover:underline"
          >
            {t('signInLink')}
          </Link>
        </Alert>
      ) : null}
      {resendError !== null && resendError !== 'alreadyConfirmed' ? (
        <Alert variant="error" title={t(resendError)}>
          {null}
        </Alert>
      ) : null}
      <ResendCountdownButton onResend={handleResend} isPending={resend.isPending} />
      <Link
        href="/sign-in"
        className="inline-flex items-center justify-center gap-1.5 self-center text-sm font-semibold text-foreground transition-colors hover:text-blue-600"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t('backToSignIn')}
      </Link>
    </div>
  );
}
