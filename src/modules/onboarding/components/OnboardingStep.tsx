'use client';

import { CircleCheck, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';

import type { OnboardingStepKey, OnboardingStepProps } from '@/modules/onboarding/types/components.types';

const STEP_ICONS: Record<OnboardingStepKey, React.ReactNode> = {
  welcome: <Users className="size-6" />,
  finish: <CircleCheck className="size-6" />,
};

const STEP_KEY_PREFIX: Record<OnboardingStepKey, string> = {
  welcome: 'stepWelcome',
  finish: 'finish',
};

export function OnboardingStep({
  step,
  onContinue,
  onComplete,
  onSkip,
  isPending,
  completeDisabled = false,
  completeHint,
}: OnboardingStepProps) {
  const t = useTranslations('Onboarding');
  const prefix = STEP_KEY_PREFIX[step];

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-primary">
        {STEP_ICONS[step]}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-auth-title font-bold text-foreground">
          {t(`${prefix}Title`)}
        </h2>
        <p className="max-w-xs text-body-md text-body">
          {t(`${prefix}Body`)}
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        {step === 'finish' ? (
          <>
            <Button
              size="xl"
              className="w-full"
              onClick={onComplete}
              loading={isPending}
              disabled={completeDisabled}
            >
              {t('complete')}
            </Button>
            {completeDisabled && completeHint ? (
              <p className="text-caption text-muted-foreground">{completeHint}</p>
            ) : null}
          </>
        ) : (
          <Button
            size="xl"
            className="w-full"
            onClick={onContinue}
            disabled={isPending}
          >
            {t('continue')}
          </Button>
        )}

        <Button
          variant="ghost"
          size="default"
          className="w-full"
          onClick={onSkip}
          loading={isPending}
          disabled={isPending}
        >
          {t('skip')}
        </Button>
      </div>
    </div>
  );
}
