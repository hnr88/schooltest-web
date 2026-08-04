'use client';

import { AdminAccountStep } from '@/modules/school-onboarding/components/AdminAccountStep';
import { OnboardingStatusScreen } from '@/modules/school-onboarding/components/OnboardingStatusScreen';
import { OnboardingStepper } from '@/modules/school-onboarding/components/OnboardingStepper';
import { ReviewStep } from '@/modules/school-onboarding/components/ReviewStep';
import { SchoolDetailsStep } from '@/modules/school-onboarding/components/SchoolDetailsStep';
import { TeachersStep } from '@/modules/school-onboarding/components/TeachersStep';
import { useCompleteOnboarding } from '@/modules/school-onboarding/hooks/use-complete-onboarding';
import { useOnboardingSteps } from '@/modules/school-onboarding/hooks/useOnboardingSteps';
import type { SchoolOnboardingData } from '@/modules/school-onboarding/types/school-onboarding.types';

import type { SchoolOnboardingWizardProps } from '@/modules/school-onboarding/types/components.types';

// Wizard shell: stepper plus the active step. All orchestration (state sync,
// progress saves, completion) lives in the two hooks; the steps are dumb.
export function SchoolOnboardingWizard({ token, data }: SchoolOnboardingWizardProps) {
  const {
    steps,
    step,
    payload,
    completeSchool,
    completeTeachers,
    confirmReview,
    goBack,
  } = useOnboardingSteps(token, data);
  const completion = useCompleteOnboarding(token);

  // `used` (409), `revoked` or `expired` (410, told apart by details.reason):
  // whichever terminal state the submit hit, the guest sees its own screen.
  if (completion.linkState) {
    return <OnboardingStatusScreen state={completion.linkState} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <OnboardingStepper steps={steps} current={step} />
      {step === 0 ? (
        <SchoolDetailsStep defaultValues={payload.school} onSubmit={completeSchool} />
      ) : null}
      {step === 1 ? (
        <TeachersStep
          defaultValues={payload.teachers}
          onSubmit={completeTeachers}
          onBack={goBack}
        />
      ) : null}
      {step === 2 ? (
        <ReviewStep payload={payload} onConfirm={confirmReview} onBack={goBack} />
      ) : null}
      {step === 3 ? (
        <AdminAccountStep
          defaultValues={payload.admin}
          serverError={completion.serverError}
          pending={completion.pending}
          onSubmit={completion.submit}
          onBack={goBack}
        />
      ) : null}
    </div>
  );
}
