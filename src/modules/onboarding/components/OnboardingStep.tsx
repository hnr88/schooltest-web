'use client';

import { BookOpen, CircleCheck, UserPlus, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';

export type OnboardingStepKey = 'welcome' | 'features' | 'addChild' | 'finish';

interface OnboardingStepProps {
  step: OnboardingStepKey;
  onContinue: () => void;
  onAddChild: () => void;
  onComplete: () => void;
  onSkip: () => void;
  isPending: boolean;
}

const STEP_ICONS: Record<OnboardingStepKey, React.ReactNode> = {
  welcome: <Users className="size-6" />,
  features: <BookOpen className="size-6" />,
  addChild: <UserPlus className="size-6" />,
  finish: <CircleCheck className="size-6" />,
};

const STEP_KEY_PREFIX: Record<OnboardingStepKey, string> = {
  welcome: 'stepWelcome',
  features: 'stepFeatures',
  addChild: 'stepAddChild',
  finish: 'finish',
};

export function OnboardingStep({
  step,
  onContinue,
  onAddChild,
  onComplete,
  onSkip,
  isPending,
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
        {step === 'addChild' && (
          <Button
            size="xl"
            className="w-full"
            onClick={onAddChild}
            disabled={isPending}
          >
            {t('addChild')}
          </Button>
        )}

        {step === 'finish' ? (
          <Button
            size="xl"
            className="w-full"
            onClick={onComplete}
            loading={isPending}
          >
            {t('complete')}
          </Button>
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
