'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { useLoginLockoutCountdown } from '@/modules/auth/hooks/use-login-lockout-countdown';
import { formatCountdown } from '@/modules/auth/lib/format-countdown';
import { Alert, Button } from '@/modules/design-system';

import type { SignInLockedStateProps } from '@/modules/auth/types/components.types';

export function SignInLockedState({ lockout, onExpired }: SignInLockedStateProps) {
  const t = useTranslations('Auth');
  const format = useFormatter();
  const remaining = useLoginLockoutCountdown(lockout);
  const unlockTime = format.dateTime(new Date(lockout.unlockAt), {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
      <h1 className="text-auth-title font-bold text-foreground">{t('accountLockedTitle')}</h1>
      <Alert variant="warning" title={t('accountLockedAlertTitle')}>
        <p>{t('accountLockedBody', { time: unlockTime })}</p>
      </Alert>
      <div className="flex flex-col gap-3">
        <Button href="/forgot-password" size="xl" className="w-full rounded-lg">
          {t('resetYourPassword')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xl"
          disabled={remaining > 0}
          onClick={onExpired}
          className="w-full rounded-lg"
        >
          {remaining > 0
            ? t('signInAvailableIn', { time: formatCountdown(remaining) })
            : t('signInButton')}
        </Button>
      </div>
      <p className="text-body-md text-body">{t('accountLockedAuditNotice')}</p>
    </div>
  );
}
