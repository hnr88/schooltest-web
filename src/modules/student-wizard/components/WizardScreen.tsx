'use client';

import { useTranslations } from 'next-intl';
import { FormProvider } from 'react-hook-form';

import { WizardNav } from '@/modules/student-wizard/components/WizardNav';
import { WizardPageHeader } from '@/modules/student-wizard/components/WizardPageHeader';
import { WizardStepPanel } from '@/modules/student-wizard/components/WizardStepPanel';
import { WizardStepRail } from '@/modules/student-wizard/components/WizardStepRail';
import { WizardSuccess } from '@/modules/student-wizard/components/WizardSuccess';
import { useWizardScreen } from '@/modules/student-wizard/hooks/use-wizard-screen';

import type { WizardScreenProps } from '@/modules/student-wizard/types/student-wizard.types';

export function WizardScreen({ initialValues, mode = 'create', onSubmit }: WizardScreenProps) {
  const t = useTranslations('StudentWizard');
  const {
    form,
    step,
    stepKeys,
    stepCount,
    goToStep,
    maxReached,
    isLastStep,
    screenRef,
    railSteps,
    handleBack,
    handleContinue,
    error,
    dismissError,
    isSucceeded,
  } = useWizardScreen({ initialValues, mode, onSubmit });

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
                <WizardStepPanel
                  step={step}
                  stepKey={stepKeys[step]}
                  stepCount={stepCount}
                  error={error}
                  onDismissError={dismissError}
                />
                <WizardNav
                  step={step}
                  stepCount={stepCount}
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
