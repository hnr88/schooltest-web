'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import { OnboardingShell } from '@/modules/onboarding/components/OnboardingShell';

import type { OnboardingErrorStateProps } from '@/modules/onboarding/types/components.types';

export function OnboardingErrorState({ onRetry }: OnboardingErrorStateProps) {
  const t = useTranslations('Onboarding');
  return (
    <OnboardingShell contentClassName="flex flex-col items-center gap-6 py-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-red-50 text-destructive">
        <span aria-hidden="true" className="text-2xl">
          ⚠
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-auth-title font-bold text-foreground">{t('errorLoadingTitle')}</h2>
        <p className="text-body-md text-body">{t('errorLoadingDescription')}</p>
      </div>
      <Button size="xl" className="w-full" onClick={onRetry}>
        {t('errorRetry')}
      </Button>
    </OnboardingShell>
  );
}
