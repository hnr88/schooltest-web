'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { FormProvider } from 'react-hook-form';

import { useRouter } from '@/i18n/navigation';
import { WIZARD_STEP_KEYS } from '@/modules/student-wizard/constants/student-wizard.constants';
import { WizardNav } from '@/modules/student-wizard/components/WizardNav';
import { WizardPageHeader } from '@/modules/student-wizard/components/WizardPageHeader';
import { WizardStepPanel } from '@/modules/student-wizard/components/WizardStepPanel';
import { WizardStepRail } from '@/modules/student-wizard/components/WizardStepRail';
import { WizardSuccess } from '@/modules/student-wizard/components/WizardSuccess';
import { useStepScroll } from '@/modules/student-wizard/hooks/use-step-scroll';
import { useStudentWizard } from '@/modules/student-wizard/hooks/use-student-wizard';
import { useWizardSubmit } from '@/modules/student-wizard/hooks/use-wizard-submit';
import { firstInvalidStep } from '@/modules/student-wizard/lib/first-invalid-step';
import { STEP_FIELDS } from '@/modules/student-wizard/schemas/student-wizard.schema';
import { useWizardMediaStore } from '@/modules/student-wizard/stores/use-wizard-media-store';
import type { WizardScreenProps } from '@/modules/student-wizard/types/student-wizard.types';

// C-UI-STUDENT-WIZARD shell, drawn to `portal--add-child-multi-step.html`: a
// 30/500 page title over a `230px 1fr` split — the gated step rail on the
// left (a step past the furthest validly completed one is disabled), ONE
// 24px-radius white card on the right (max 760px, 34/38 padding) holding
// the step heading, the fields and the footer. Step 5 review + submit
// (C-STUDENT-CREATE) are wired here; edit mode (054) passes `onSubmit` to override
// the create mutation with the PUT path.
export function WizardScreen({ initialValues, mode = 'create', onSubmit }: WizardScreenProps) {
  const t = useTranslations('StudentWizard');
  const router = useRouter();
  const { form, step, back, next, goToStep, maxReached, isFirstStep, isLastStep } =
    useStudentWizard({
      mode,
      initialValues,
    });
  const { submit, error, dismissError, isSucceeded } = useWizardSubmit({ onSubmit });
  const resetMedia = useWizardMediaStore((state) => state.reset);

  const screenRef = useRef<HTMLElement>(null);

  // Fresh wizard mount clears any media held from an earlier flow (legacy parity).
  useEffect(() => resetMedia(), [resetMedia]);
  useStepScroll(screenRef, step);

  const railSteps = WIZARD_STEP_KEYS.map((key) => ({
    key,
    title: t(`steps.${key}.label`),
    hint: t(`steps.${key}.railHint`),
  }));

  // A full-schema rejection can belong to a step the parent is no longer on
  // (edit mode starts with every step reachable; a revisited step can also be
  // broken after the fact) — land them back on it instead of failing silently.
  const handleSubmit = form.handleSubmit(submit, (errors) => {
    const invalidStep = firstInvalidStep(errors);
    if (invalidStep !== null) goToStep(invalidStep);
  });

  // Gate: the current step must validate before advancing (STEP_FIELDS maps
  // step → its field names). On failure RHF shows the errors and focuses the
  // first invalid field; on success `next` also unlocks the step just reached.
  const handleContinue = async () => {
    if (isLastStep) {
      void handleSubmit();
      return;
    }
    const isStepValid = await form.trigger([...STEP_FIELDS[step]], { shouldFocus: true });
    if (isStepValid) {
      next();
    }
  };

  // §2.9: Back at step 1 is not disabled — it leaves the wizard for the roster.
  const handleBack = () => {
    if (isFirstStep) {
      router.push('/dashboard/children');
      return;
    }
    back();
  };

  return (
    <main
      ref={screenRef}
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8"
    >
      <WizardPageHeader
        title={mode === 'edit' ? t('editTitle') : t('pageTitle')}
        backLabel={t('backToChildren')}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:items-stretch">
        <WizardStepRail
          steps={railSteps}
          current={step}
          maxReached={maxReached}
          ariaLabel={t('stepsLabel')}
          onSelect={goToStep}
        />
        <FormProvider {...form}>
          <form
            onSubmit={(event) => event.preventDefault()}
            noValidate
            className="flex w-full max-w-190 flex-1 flex-col rounded-card bg-card p-6 shadow-sm sm:px-9.5 sm:py-8.5"
          >
            {isSucceeded ? (
              <WizardSuccess
                title={mode === 'edit' ? t('success.savedTitle') : t('success.createdTitle')}
                body={t('success.body')}
              />
            ) : (
              <>
                <WizardStepPanel step={step} error={error} onDismissError={dismissError} />
                <WizardNav
                  step={step}
                  isLastStep={isLastStep}
                  mode={mode}
                  pending={form.formState.isSubmitting}
                  onBack={handleBack}
                  onContinue={handleContinue}
                />
              </>
            )}
          </form>
        </FormProvider>
      </div>
    </main>
  );
}
