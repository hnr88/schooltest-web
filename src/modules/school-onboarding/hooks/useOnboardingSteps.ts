'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import {
  ONBOARDING_STEP_COUNT,
  ONBOARDING_STEP_KEYS,
} from '@/modules/school-onboarding/constants/school-onboarding.constants';
import { mergeOnboardingState } from '@/modules/school-onboarding/lib/merge-onboarding-state';
import { useSaveProgressMutation } from '@/modules/school-onboarding/mutations/use-save-progress.mutation';
import {
  getSchoolOnboardingStore,
  useSchoolOnboardingStore,
} from '@/modules/school-onboarding/stores/use-school-onboarding-store';
import type {
  AdminDetails,
  OnboardingStepDefinition,
  SchoolDetails,
  SchoolOnboardingData,
  TeacherEntry,
} from '@/modules/school-onboarding/types/school-onboarding.types';

/**
 * Wizard step orchestration: adopts server state once (localStorage wins only
 * when strictly newer), advances the stepper, and mirrors every completed
 * step to the API via C-ONB-02. Step components stay dumb — they call the
 * completeX / goBack callbacks with their validated form values.
 */
export function useOnboardingSteps(token: string, data: SchoolOnboardingData) {
  const t = useTranslations('SchoolOnboarding.steps');
  // Adopt server state exactly once (localStorage wins only when strictly
  // newer; ties go to the server). The useState initializer runs during this
  // component's first render, BEFORE the useStore subscriptions below exist,
  // so the merged step/payload is what the first paint and the step forms
  // (whose defaultValues come from the store) actually see.
  useState(() => {
    const store = getSchoolOnboardingStore(token);
    const { step, payload, provenance } = store.getState();
    store
      .getState()
      .applyServerState(mergeOnboardingState({ step, payload, provenance }, data));
    return true;
  });
  const step = useSchoolOnboardingStore(token, (state) => state.step);
  const payload = useSchoolOnboardingStore(token, (state) => state.payload);
  const saveProgress = useSaveProgressMutation();

  const steps: OnboardingStepDefinition[] = ONBOARDING_STEP_KEYS.map((key) => ({
    key,
    label: t(key),
  }));

  // Read the store imperatively after the payload update so the C-ONB-02 body
  // always carries the just-completed step's values.
  const advance = (nextStep: number) => {
    const store = getSchoolOnboardingStore(token);
    store.getState().setStep(nextStep);
    const { payload: nextPayload, provenance } = store.getState();
    saveProgress.mutate({
      token,
      current_step: nextStep,
      payload: nextPayload,
      provenance,
    });
  };

  const completeSchool = (school: SchoolDetails) => {
    getSchoolOnboardingStore(token).getState().setSchool(school);
    advance(1);
  };

  const completeTeachers = (teachers: TeacherEntry[]) => {
    getSchoolOnboardingStore(token).getState().setTeachers(teachers);
    advance(2);
  };

  const confirmReview = () => advance(3);

  const saveAdminDetails = (admin: AdminDetails) => {
    getSchoolOnboardingStore(token).getState().setAdmin(admin);
  };

  const goBack = () => {
    const current = getSchoolOnboardingStore(token).getState().step;
    getSchoolOnboardingStore(token)
      .getState()
      .setStep(Math.max(0, current - 1));
  };

  return {
    steps,
    step,
    payload,
    stepCount: ONBOARDING_STEP_COUNT,
    completeSchool,
    completeTeachers,
    confirmReview,
    saveAdminDetails,
    goBack,
  };
}
