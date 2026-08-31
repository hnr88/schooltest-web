'use client';

import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import type { ResetPasswordRuleChecklistProps } from '@/modules/auth/types/components.types';

export function ResetPasswordRuleChecklist({ state }: ResetPasswordRuleChecklistProps) {
  const t = useTranslations('Auth');
  const statusKey =
    state === 'met'
      ? 'passwordRuleMet'
      : state === 'unmet'
        ? 'passwordRuleNotMet'
        : 'passwordRulePending';

  return (
    <ul aria-label={t('passwordRulesLabel')} aria-live="polite">
      <li
        className={cn(
          'flex items-center gap-2 text-body-sm font-semibold',
          state === 'met' && 'text-teal-600',
          state === 'unmet' && 'text-destructive',
          state === 'pending' && 'text-muted-foreground',
        )}
      >
        {state === 'met' ? <Check aria-hidden="true" className="size-4" strokeWidth={3} /> : null}
        {state === 'unmet' ? <X aria-hidden="true" className="size-4" strokeWidth={3} /> : null}
        {state === 'pending' ? (
          <span aria-hidden="true" className="mx-1 size-2 rounded-full bg-slate-300" />
        ) : null}
        <span>{t('passwordRuleByteLimit')}</span>
        <span className="sr-only">{t(statusKey)}</span>
      </li>
    </ul>
  );
}
