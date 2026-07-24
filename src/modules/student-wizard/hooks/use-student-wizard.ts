'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  WIZARD_DEFAULT_VALUES,
  WIZARD_STEP_COUNT,
} from '@/modules/student-wizard/constants/student-wizard.constants';
import {
  createStudentWizardSchema,
  type StudentWizardOutput,
  type StudentWizardValues,
} from '@/modules/student-wizard/schemas/student-wizard.schema';
import type { WizardMode } from '@/modules/student-wizard/types/student-wizard.types';

interface UseStudentWizardParams {
  mode: WizardMode;
  initialValues?: Partial<StudentWizardValues>;
}

// Step-state machinery for the 5-step wizard (C-UI-STUDENT-WIZARD Navigation):
// Continue simply advances the step; full-schema validation runs on final submit.
export function useStudentWizard({ mode, initialValues }: UseStudentWizardParams) {
  const t = useTranslations('StudentWizardSchema');
  const schema = useMemo(() => createStudentWizardSchema(t), [t]);
  const form = useForm<StudentWizardValues, unknown, StudentWizardOutput>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { ...WIZARD_DEFAULT_VALUES, ...initialValues },
  });
  const [step, setStep] = useState(0);

  const back = useCallback(() => {
    setStep((current) => Math.max(0, current - 1));
  }, []);

  // Step 5 review "Edit" links jump straight to a step (clamped to the range).
  const goToStep = useCallback((target: number) => {
    setStep(Math.min(WIZARD_STEP_COUNT - 1, Math.max(0, target)));
  }, []);

  const next = useCallback(() => {
    setStep((current) => Math.min(WIZARD_STEP_COUNT - 1, current + 1));
  }, []);

  return {
    form,
    step,
    setStep,
    goToStep,
    back,
    next,
    mode,
    isFirstStep: step === 0,
    isLastStep: step === WIZARD_STEP_COUNT - 1,
  };
}
