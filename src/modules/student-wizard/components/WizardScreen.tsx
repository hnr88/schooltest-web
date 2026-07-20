'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { FormProvider } from 'react-hook-form';

import {
  WIZARD_STEP_COUNT,
  WIZARD_STEP_KEYS,
} from '@/modules/student-wizard/constants/student-wizard.constants';
import { StepEducation } from '@/modules/student-wizard/components/StepEducation';
import { StepGuardian } from '@/modules/student-wizard/components/StepGuardian';
import { StepMedia } from '@/modules/student-wizard/components/StepMedia';
import { StepPersonal } from '@/modules/student-wizard/components/StepPersonal';
import { StepReview } from '@/modules/student-wizard/components/StepReview';
import { WizardNav } from '@/modules/student-wizard/components/WizardNav';
import { WizardStepper } from '@/modules/student-wizard/components/WizardStepper';
import { useStudentWizard } from '@/modules/student-wizard/hooks/use-student-wizard';
import { useWizardSubmit } from '@/modules/student-wizard/hooks/use-wizard-submit';
import { useWizardMediaStore } from '@/modules/student-wizard/stores/use-wizard-media-store';
import type { WizardScreenProps } from '@/modules/student-wizard/types/student-wizard.types';

// C-UI-STUDENT-WIZARD shell: centered 640px column (§15), NOT a modal (D-UI-1).
// Step 5 review + submit (C-STUDENT-CREATE) are wired here; edit mode (054)
// passes `onSubmit` to override the create mutation with the PUT path.
export function WizardScreen({ initialValues, mode = 'create', onSubmit }: WizardScreenProps) {
  const t = useTranslations('StudentWizard');
  const { form, step, back, next, goToStep, isFirstStep, isLastStep } = useStudentWizard({
    mode,
    initialValues,
  });
  const { submit, error, dismissError } = useWizardSubmit({ onSubmit });
  const resetMedia = useWizardMediaStore((state) => state.reset);

  // Fresh wizard mount clears any media held from an earlier flow (legacy parity).
  useEffect(() => resetMedia(), [resetMedia]);

  const stepLabels = WIZARD_STEP_KEYS.map((key) => t(`steps.${key}.label`));
  const stepTitle = t(`steps.${WIZARD_STEP_KEYS[step]}.title`);
  const caption = t('stepCaption', { current: step + 1, total: WIZARD_STEP_COUNT, title: stepTitle });

  const handleSubmit = form.handleSubmit(submit);

  const handleContinue = () => {
    if (isLastStep) {
      void handleSubmit();
      return;
    }
    void next();
  };

  return (
    <main className="flex flex-1 flex-col px-8 py-7 duration-300 ease-out animate-in slide-in-from-bottom-2 motion-reduce:animate-none">
      <div className="mx-auto flex w-full max-w-160 flex-col gap-6">
        <WizardStepper steps={stepLabels} current={step} caption={caption} />
        <FormProvider {...form}>
          <form onSubmit={(event) => event.preventDefault()} noValidate>
            {step === 4 ? (
              <StepReview goToStep={goToStep} error={error} onDismissError={dismissError} />
            ) : (
              <section className="rounded-2xl border border-border bg-card p-7 shadow-sm">
                {step === 0 ? (
                  <StepPersonal />
                ) : step === 1 ? (
                  <StepEducation />
                ) : step === 2 ? (
                  <StepGuardian />
                ) : (
                  <StepMedia />
                )}
              </section>
            )}
            <WizardNav
              isFirstStep={isFirstStep}
              isLastStep={isLastStep}
              mode={mode}
              pending={form.formState.isSubmitting}
              onBack={back}
              onContinue={handleContinue}
            />
          </form>
        </FormProvider>
      </div>
    </main>
  );
}
