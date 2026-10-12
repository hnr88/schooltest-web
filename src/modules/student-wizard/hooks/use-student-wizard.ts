'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useFormContext, useWatch } from 'react-hook-form';

import type { ConsentConfig } from '@/modules/privacy-consent/types/consent.types';
import { useConsentConfigQuery } from '@/modules/privacy-consent/queries/use-consent-config.query';
import {
  activeWizardStepKeys,
  DEFAULT_WIZARD_SCHEMA_OPTIONS,
  WIZARD_DEFAULT_VALUES,
} from '@/modules/student-wizard/constants/student-wizard.constants';
import {
  createStudentWizardSchema,
  type StudentWizardOutput,
  type StudentWizardValues,
} from '@/modules/student-wizard/schemas/student-wizard.schema';
import type { WizardSchemaOptions } from '@/modules/student-wizard/types/schemas.types';
import type { WizardMode } from '@/modules/student-wizard/types/student-wizard.types';

import type { UseStudentWizardParams } from '@/modules/student-wizard/types/hooks.types';

// W4-19 (D5 S1/S4): the schema options for the live consent config. Anything
// that is not a loaded config in CREATE mode (pending, failed, or the edit
// screen) is today's behaviour, exactly: OFF = today's required set. The edit
// screen's payload and optionality rules must not change.
export function resolveWizardOptions(
  config: ConsentConfig | undefined,
  mode: WizardMode,
): WizardSchemaOptions {
  if (!config || mode === 'edit') return DEFAULT_WIZARD_SCHEMA_OPTIONS;
  return {
    minimised: config.minimised_student_profile,
    recordsEnabled: config.consent_records_enabled,
    guardianConsentRequired: config.consent_records_enabled && config.guardian_consent_required,
  };
}

// The same options for the step components, which sit inside the FormProvider
// and do not receive `mode`. Edit mode never has the consent fields in the form
// (see wizardDefaultValues), so their absence is the edit-mode signal.
export function useWizardPrivacyOptions() {
  const { control } = useFormContext<StudentWizardValues>();
  const consentField = useWatch({ control, name: 'consent_data_collection' });
  const query = useConsentConfigQuery();
  const isCreate = consentField !== undefined;
  return {
    config: query.data,
    isPending: query.isPending,
    isCreate,
    options: resolveWizardOptions(query.data, isCreate ? 'create' : 'edit'),
  };
}

// Create starts with every consent box unticked. Edit never sends consents, so
// its form simply does not carry the two consent keys.
function wizardDefaultValues(
  mode: WizardMode,
  initialValues: UseStudentWizardParams['initialValues'],
) {
  const values = { ...WIZARD_DEFAULT_VALUES, ...initialValues };
  if (mode === 'edit') {
    delete values.consent_data_collection;
    delete values.consent_ai_processing;
  }
  return values;
}

// Step-state machinery for the wizard (C-UI-STUDENT-WIZARD Navigation):
// Continue validates the current step (WizardScreen runs form.trigger first);
// full-schema validation runs on final submit. `maxReached` is the furthest
// step index the user has VALIDLY reached — the rail may jump back freely but
// never past it. Edit mode starts with every step reachable: the record was
// valid when created, so its prefilled values pass each step's gate as-is.
// Step count comes from the ACTIVE step list (task 47): three steps while the
// guardian/media steps are masked, five with the parent views flag on.
export function useStudentWizard({ mode, initialValues }: UseStudentWizardParams) {
  const t = useTranslations('StudentWizardSchema');
  // The consent config is read from the API, never from env (D5). A pending or
  // failed request keeps today's schema; navigation is never blocked on it.
  const configQuery = useConsentConfigQuery();
  const options = useMemo(
    () => resolveWizardOptions(configQuery.data, mode),
    [configQuery.data, mode],
  );
  const schema = useMemo(() => createStudentWizardSchema(t, options), [t, options]);
  const form = useForm<StudentWizardValues, unknown, StudentWizardOutput>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: wizardDefaultValues(mode, initialValues),
  });
  const { setValue } = form;
  // Minimised: the passport field is gone and must never ship, even if a parent
  // typed one while the config request was still in flight.
  useEffect(() => {
    if (options.minimised) setValue('passport_number', '');
  }, [options.minimised, setValue]);
  // The flag is build-time static, so the active list never changes mid-run.
  const [stepKeys] = useState(() => activeWizardStepKeys());
  const stepCount = stepKeys.length;
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(mode === 'edit' ? stepCount - 1 : 0);

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
    setStep((current) => Math.min(stepCount - 1, current + 1));
    setMaxReached((reached) => Math.min(stepCount - 1, Math.max(reached, step + 1)));
  }, [step, stepCount]);

  return {
    form,
    step,
    setStep,
    stepKeys,
    stepCount,
    maxReached,
    goToStep,
    back,
    next,
    mode,
    isFirstStep: step === 0,
    isLastStep: step === stepCount - 1,
  };
}
