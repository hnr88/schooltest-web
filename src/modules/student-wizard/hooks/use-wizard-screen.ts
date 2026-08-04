'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import { useStepScroll } from '@/modules/student-wizard/hooks/use-step-scroll';
import { useStudentWizard } from '@/modules/student-wizard/hooks/use-student-wizard';
import { useWizardSubmit } from '@/modules/student-wizard/hooks/use-wizard-submit';
import { firstInvalidStep } from '@/modules/student-wizard/lib/first-invalid-step';
import { activeStepFields } from '@/modules/student-wizard/schemas/student-wizard.schema';
import { useWizardMediaStore } from '@/modules/student-wizard/stores/use-wizard-media-store';

import type { UseWizardScreenOptions } from '@/modules/student-wizard/types/hooks.types';

// Navigation + submit wiring for the wizard shell. Kept out of the component so
// WizardScreen only composes the rail, panel and nav.
export function useWizardScreen({ initialValues, mode, onSubmit }: UseWizardScreenOptions) {
  const t = useTranslations('StudentWizard');
  const router = useRouter();
  const wizard = useStudentWizard({ mode, initialValues });
  const { form, step, stepKeys, goToStep, next, isFirstStep, isLastStep, back } = wizard;
  const { submit, error, dismissError, isSucceeded } = useWizardSubmit({ onSubmit });
  const resetMedia = useWizardMediaStore((state) => state.reset);

  const screenRef = useRef<HTMLElement>(null);

  // Fresh wizard mount clears any media held from an earlier flow (legacy parity).
  useEffect(() => resetMedia(), [resetMedia]);
  useStepScroll(screenRef, step);

  // Task 47: the rail renders the ACTIVE steps only — guardian/media never
  // appear while the parent views flag is off.
  const railSteps = stepKeys.map((key) => ({
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
    const isStepValid = await form.trigger([...activeStepFields()[step]], { shouldFocus: true });
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

  return { ...wizard, screenRef, railSteps, handleBack, handleContinue, error, dismissError, isSucceeded };
}
