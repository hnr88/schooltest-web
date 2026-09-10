'use client';

import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import type { PasswordRuleState } from '@/modules/auth/types/auth.types';
import type { ResetPasswordRuleChecklistProps } from '@/modules/auth/types/components.types';

function RuleItem({ label, state }: { label: string; state: PasswordRuleState }) {
  const t = useTranslations('Auth');
  const statusKey =
    state === 'met'
      ? 'passwordRuleMet'
      : state === 'unmet'
        ? 'passwordRuleNotMet'
        : 'passwordRulePending';

  return (
    <li
      className={cn(
        'flex items-center gap-[9px] text-[13px]',
        state === 'met' && 'font-semibold text-[#0D9488]',
        state === 'unmet' && 'font-semibold text-[#B91C1C]',
        state === 'pending' && 'font-normal text-[#64748B]',
      )}
    >
      {state === 'met' ? (
        <Check aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={3} />
      ) : null}
      {state === 'unmet' ? (
        <X aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={3} />
      ) : null}
      {state === 'pending' ? (
        <span aria-hidden="true" className="size-[7px] shrink-0 rounded-full bg-[#CBD5E1]" />
      ) : null}
      <span>{label}</span>
      <span className="sr-only">{t(statusKey)}</span>
    </li>
  );
}

export function ResetPasswordRuleChecklist({ states }: ResetPasswordRuleChecklistProps) {
  const t = useTranslations('Auth');
  const rules = [
    { label: t('portal.ruleLength'), state: states.length },
    { label: t('portal.ruleCharClasses'), state: states.charClasses },
    { label: t('portal.ruleHistory'), state: states.history },
  ];

  return (
    <ul aria-label={t('passwordRulesLabel')} aria-live="polite" className="flex flex-col gap-2">
      {rules.map((rule) => (
        <RuleItem key={rule.label} label={rule.label} state={rule.state} />
      ))}
    </ul>
  );
}
