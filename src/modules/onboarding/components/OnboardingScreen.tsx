'use client';

import { CircleCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from '@/i18n/navigation';
import { Button, ProgressBar } from '@/modules/design-system';
import {
  OnboardingStep,
  type OnboardingStepKey,
} from '@/modules/onboarding/components/OnboardingStep';
import { useOnboardingStateQuery } from '@/modules/onboarding/queries/use-onboarding-state.query';
import { useUpdateOnboardingMutation } from '@/modules/onboarding/queries/use-update-onboarding.mutation';

const STEPS: OnboardingStepKey[] = ['welcome', 'features', 'addChild', 'finish'];

export function OnboardingScreen() {
  const t = useTranslations('Onboarding');
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const { data, isLoading, isError, refetch } = useOnboardingStateQuery();
  const updateOnboarding = useUpdateOnboardingMutation();

  const step = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const status = data?.status;
  const isDone = status === 'completed' || status === 'skipped';

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((prev) => prev + 1);
    }
  };

  const handleAddChild = () => {
    router.push('/dashboard/children/new');
  };

  const handleSkip = () => {
    updateOnboarding.mutate({ status: 'skipped' });
  };

  const handleComplete = () => {
    updateOnboarding.mutate({ status: 'completed' });
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
        <Card className="w-full max-w-auth">
          <CardContent className="flex flex-col gap-6">
            <Skeleton className="h-2 w-full" />
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <Skeleton className="size-14 rounded-2xl" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full max-w-[16rem]" />
            </div>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
        <Card className="w-full max-w-auth">
          <CardContent className="flex flex-col items-center gap-6 py-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-red-50 text-destructive">
              <span aria-hidden="true" className="text-2xl">
                ⚠
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-auth-title font-bold text-foreground">
                {t('errorLoadingTitle')}
              </h2>
              <p className="text-body-md text-body">{t('errorLoadingDescription')}</p>
            </div>
            <Button size="xl" className="w-full" onClick={() => refetch()}>
              {t('errorRetry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
        <Card className="w-full max-w-auth">
          <CardContent className="flex flex-col items-center gap-6 py-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
              <CircleCheck className="size-6" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-auth-title font-bold text-foreground">
                {t('stepCompleteTitle')}
              </h2>
              <p className="text-body-md text-body">{t('stepCompleteBody')}</p>
            </div>
            <Button href="/dashboard" size="xl" className="w-full">
              {t('goToDashboard')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
      <Card className="w-full max-w-auth">
        <CardContent className="flex flex-col gap-6">
          <ProgressBar
            value={progress}
            ariaLabel={t('progressLabel', { current: stepIndex + 1, total: STEPS.length })}
            tone="gradient"
          />
          <OnboardingStep
            step={step}
            onContinue={handleNext}
            onAddChild={handleAddChild}
            onComplete={handleComplete}
            onSkip={handleSkip}
            isPending={updateOnboarding.isPending}
          />
          <p className="text-center text-caption text-muted-foreground">
            {t('stepCounter', { current: stepIndex + 1, total: STEPS.length })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
