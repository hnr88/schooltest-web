'use client';

import { CircleCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import { OnboardingShell } from '@/modules/onboarding/components/OnboardingShell';

export function OnboardingDoneState() {
  const t = useTranslations('Onboarding');
  return (
    <OnboardingShell contentClassName="flex flex-col items-center gap-6 py-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
        <CircleCheck className="size-6" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-auth-title font-bold text-foreground">{t('stepCompleteTitle')}</h2>
        <p className="text-body-md text-body">{t('stepCompleteBody')}</p>
      </div>
      <Button href="/dashboard" size="xl" className="w-full">
        {t('goToDashboard')}
      </Button>
    </OnboardingShell>
  );
}
