'use client';

import { Lock } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { useLoginLockoutCountdown } from '@/modules/auth/hooks/use-login-lockout-countdown';
import { formatCountdown } from '@/modules/auth/lib/format-countdown';
import { Button } from '@/modules/design-system';

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
      <div
        role="alert"
        data-slot="alert"
        className="flex gap-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-[18px] py-4"
      >
        <Lock
          aria-hidden="true"
          strokeWidth={2.2}
          className="mt-px size-[18px] shrink-0 text-[#B45309]"
        />
        <div>
          <p className="text-[14.5px] font-bold text-[#78350F]">{t('accountLockedAlertTitle')}</p>
          <p className="mt-1 text-sm leading-[1.6] text-[#92400E]">
            {t('portal.lockedBody', { time: unlockTime })}
          </p>
        </div>
      </div>
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
            ? t('portal.availableIn', { time: formatCountdown(remaining) })
            : t('portal.loginButton')}
        </Button>
      </div>
      <p className="text-[13.5px] leading-relaxed text-[#64748B]">
        {t('accountLockedAuditNotice')}
      </p>
    </div>
  );
}
