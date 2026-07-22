'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { formatCountdown } from '@/modules/auth/lib/format-countdown';
import { Button } from '@/modules/design-system';

interface ResendCountdownButtonProps {
  onResend: () => void;
  seconds?: number;
  isPending?: boolean;
  labelKey?: string;
  countdownLabelKey?: string;
}

// Shared by the forgot-password sent state and the sign-up confirm state
// (task 017). Counts down from `seconds` on mount, stays disabled while
// counting, and restarts the countdown after every resend click.
export function ResendCountdownButton({
  onResend,
  seconds = 60,
  isPending = false,
  labelKey = 'resendEmail',
  countdownLabelKey = 'resendEmailCountdown',
}: ResendCountdownButtonProps) {
  const t = useTranslations('Auth');
  const [remaining, setRemaining] = useState(seconds);
  const isCounting = remaining > 0;

  useEffect(() => {
    if (!isCounting) return undefined;
    const id = setInterval(() => {
      setRemaining((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => clearInterval(id);
  }, [isCounting]);

  const handleClick = () => {
    setRemaining(seconds);
    onResend();
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      disabled={isCounting}
      loading={isPending}
      onClick={handleClick}
      className="w-full rounded-lg text-body-md font-semibold text-navy-800 transition-[transform,background-color,border-color] duration-150 ease-out-expo not-disabled:hover:-translate-y-0.5 not-disabled:hover:border-slate-400 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {isCounting ? t(countdownLabelKey, { time: formatCountdown(remaining) }) : t(labelKey)}
    </Button>
  );
}
