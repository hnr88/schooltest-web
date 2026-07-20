'use client';

import { useTranslations } from 'next-intl';
import { FormProvider } from 'react-hook-form';

import {
  WIZARD_STEP_COUNT,
  WIZARD_STEP_KEYS,
} from '@/modules/student-wizard/constants/student-wizard.constants';
import { StepEducation } from '@/modules/student-wizard/components/StepEducation';
import { StepGuardian } from '@/modules/student-wizard/components/StepGuardian';
import { StepMedia } from '@/modules/student-wizard/components/StepMedia';
import { StepPersonal } from '@/modules/student-wizard/components/StepPersonal';
import { WizardNav } from '@/modules/student-wizard/components/WizardNav';
import { WizardStepper } from '@/modules/student-wizard/components/WizardStepper';
import { useStudentWizard } from '@/modules/student-wizard/hooks/use-student-wizard';
import type { WizardScreenProps } from '@/modules/student-wizard/types/student-wizard.types';

// C-UI-STUDENT-WIZARD shell: centered 640px column (§15), NOT a modal (D-UI-1).
// documentId (prop, reserved for the 054 edit route) is intentionally not read
// yet. Step bodies are placeholder slots replaced by 049–052.
export function WizardScreen({ initialValues, mode = 'create' }: WizardScreenProps) {
  const t = useTranslations('StudentWizard');
  const { form, step, back, next, isFirstStep, isLastStep } = useStudentWizard({
    mode,
    initialValues,
  });

  const stepLabels = WIZARD_STEP_KEYS.map((key) => t(`steps.${key}.label`));
  const stepTitle = t(`steps.${WIZARD_STEP_KEYS[step]}.title`);
  const caption = t('stepCaption', { current: step + 1, total: WIZARD_STEP_COUNT, title: stepTitle });

  const handleContinue = () => {
    // Step 5 submit (C-STUDENT-CREATE) is wired in task 053.
    if (isLastStep) {
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
            <section className="rounded-2xl border border-border bg-card p-7 shadow-sm">
              {step === 0 ? (
                <StepPersonal />
              ) : step === 1 ? (
                <StepEducation />
              ) : step === 2 ? (
                <StepGuardian />
              ) : step === 3 ? (
                <StepMedia />
              ) : (
                <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center">
                  <h2 className="text-base font-semibold text-foreground">{stepTitle}</h2>
                  <p className="text-sm text-muted-foreground">{t('stepPlaceholder')}</p>
                </div>
              )}
            </section>
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
