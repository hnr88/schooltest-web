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
// Continue validates the current step (WizardScreen runs form.trigger first);
// full-schema validation runs on final submit. `maxReached` is the furthest
// step index the user has VALIDLY reached — the rail may jump back freely but
// never past it. Edit mode starts with every step reachable: the record was
// valid when created, so its prefilled values pass each step's gate as-is.
export function useStudentWizard({ mode, initialValues }: UseStudentWizardParams) {
  const t = useTranslations('StudentWizardSchema');
  const schema = useMemo(() => createStudentWizardSchema(t), [t]);
  const form = useForm<StudentWizardValues, unknown, StudentWizardOutput>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { ...WIZARD_DEFAULT_VALUES, ...initialValues },
  });
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(mode === 'edit' ? WIZARD_STEP_COUNT - 1 : 0);

  const back = useCallback(() => {
    setStep((current) => Math.max(0, current - 1));
  }, []);

  // Rail jumps and review-step redirects are clamped to `maxReached` — a step
  // past the furthest validly completed one is unreachable.
  const goToStep = useCallback(
    (target: number) => {
      setStep(Math.min(maxReached, Math.max(0, target)));
    },
    [maxReached],
  );

  // Only called after the current step validated (WizardScreen.handleContinue),
  // so advancing also unlocks the step just reached.
  const next = useCallback(() => {
    setStep((current) => Math.min(WIZARD_STEP_COUNT - 1, current + 1));
    setMaxReached((reached) => Math.min(WIZARD_STEP_COUNT - 1, Math.max(reached, step + 1)));
  }, [step]);

  return {
    form,
    step,
    setStep,
    maxReached,
    goToStep,
    back,
    next,
    mode,
    isFirstStep: step === 0,
    isLastStep: step === WIZARD_STEP_COUNT - 1,
  };
}
