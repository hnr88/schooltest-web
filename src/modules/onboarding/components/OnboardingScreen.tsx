'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useAuth } from '@/modules/auth';
import { ProgressBar } from '@/modules/design-system';
import { OnboardingDoneState } from '@/modules/onboarding/components/OnboardingDoneState';
import { OnboardingErrorState } from '@/modules/onboarding/components/OnboardingErrorState';
import { OnboardingProfileForm } from '@/modules/onboarding/components/OnboardingProfileForm';
import { OnboardingShell } from '@/modules/onboarding/components/OnboardingShell';
import { OnboardingSkeleton } from '@/modules/onboarding/components/OnboardingSkeleton';
import { OnboardingStep } from '@/modules/onboarding/components/OnboardingStep';
import { STEPS } from '@/modules/onboarding/constants/components.constants';
import { useOnboardingStateQuery } from '@/modules/onboarding/queries/use-onboarding-state.query';
import { useUpdateOnboardingMutation } from '@/modules/onboarding/queries/use-update-onboarding.mutation';

export function OnboardingScreen() {
  const t = useTranslations('Onboarding');
  const { user, isLoading: isAuthLoading } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const { data, isLoading, isError, refetch } = useOnboardingStateQuery();
  const updateOnboarding = useUpdateOnboardingMutation();

  const step = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const status = data?.status;
  const isDone = status === 'completed' || status === 'skipped';
  // The finish step unlocks once the profile is complete — either saved this
  // session (the PUT merges profileCompleted into the me cache) or already
  // complete on the server.
  const profileCompleted = user?.profileCompleted === true;

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    updateOnboarding.mutate({ status: 'skipped' });
  };

  const handleComplete = () => {
    updateOnboarding.mutate({ status: 'completed' });
  };

  if (isLoading || isAuthLoading) return <OnboardingSkeleton />;
  if (isError) return <OnboardingErrorState onRetry={() => refetch()} />;
  if (isDone) return <OnboardingDoneState />;

  return (
    <OnboardingShell contentClassName="flex flex-col gap-6">
      <ProgressBar
        value={progress}
        ariaLabel={t('progressLabel', { current: stepIndex + 1, total: STEPS.length })}
        tone="gradient"
      />
      {step === 'profile' ? (
        <OnboardingProfileForm
          user={user}
          onSaved={handleNext}
          onSkip={handleSkip}
          isSkipPending={updateOnboarding.isPending}
        />
      ) : (
        <OnboardingStep
          step={step}
          onContinue={handleNext}
          onComplete={handleComplete}
          onSkip={handleSkip}
          isPending={updateOnboarding.isPending}
          completeDisabled={!profileCompleted}
          completeHint={t('finishProfileHint')}
        />
      )}
      <p className="text-center text-caption text-muted-foreground">
        {t('stepCounter', { current: stepIndex + 1, total: STEPS.length })}
      </p>
    </OnboardingShell>
  );
}
