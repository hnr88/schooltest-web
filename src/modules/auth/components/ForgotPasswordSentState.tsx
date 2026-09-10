'use client';

import { Check, Clock3 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { formatCountdown } from '@/modules/auth/lib/format-countdown';

import type { ForgotPasswordSentStateProps } from '@/modules/auth/types/components.types';

// Sent state of the forgot-password card (design 'sent' scenario): teal check
// circle, enumeration-safe copy, and a rate-limit strip only when the request
// that produced this state was throttled (429). No resend affordance — the
// design has none; the back link stays on the parent card.
export function ForgotPasswordSentState({
  rateLimited = false,
  retrySeconds,
}: ForgotPasswordSentStateProps) {
  const t = useTranslations('Auth');

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
      <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-[#CCFBF1]">
        <Check aria-hidden="true" className="size-[22px] text-[#0D9488]" strokeWidth={2.6} />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-auth-title font-bold text-foreground">{t('portal.sentTitle')}</h1>
        <p className="text-body-md text-muted-foreground">{t('portal.sentBody')}</p>
      </div>
      {rateLimited ? (
        <p
          role="status"
          className="flex gap-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-[18px] py-4"
        >
          <Clock3
            aria-hidden="true"
            className="mt-px size-[18px] shrink-0 text-[#B45309]"
            strokeWidth={2.2}
          />
          <span className="text-[14px] leading-[1.6] text-[#92400E]">
            <strong className="font-bold">{t('portal.rateLimitTitle')}</strong>{' '}
            {typeof retrySeconds === 'number'
              ? t('portal.rateLimitBody', { time: formatCountdown(retrySeconds) })
              : t('portal.rateLimitBodyNoTime')}
          </span>
        </p>
      ) : null}
    </div>
  );
}
