'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Controller, useFormContext, useFormState } from 'react-hook-form';

import { SegmentedControl } from '@/modules/design-system';
import { NationalityCombobox } from '@/modules/student-wizard/components/NationalityCombobox';
import { WizardField } from '@/modules/student-wizard/components/WizardField';
import { WizardTextField } from '@/modules/student-wizard/components/WizardTextField';
import { GENDER_VALUES } from '@/modules/student-wizard/constants/student-wizard.constants';
import type { StudentWizardValues } from '@/modules/student-wizard/types/student-wizard.types';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// C-UI-STUDENT-WIZARD step 1 — 7 personal fields on the shared RHF form (048).
export function StepPersonal() {
  const t = useTranslations('StudentWizard.personal');
  const locale = useLocale();
  const { register, control } = useFormContext<StudentWizardValues>();
  // Subscribe THIS child to form-state changes — the `useForm` instance lives in
  // WizardScreen, so reading `formState` off the context alone never re-renders
  // the step when validation runs.
  const { errors } = useFormState({ control });

  const genderOptions = GENDER_VALUES.map((value) => ({ value, label: t(`gender.${value}`) }));

  return (
    <div className="flex flex-col gap-4 duration-300 ease-out animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
      <div className="grid grid-cols-2 gap-3.5">
        <WizardTextField
          id="wizard-given-name"
          label={t('givenName')}
          autoComplete="given-name"
          placeholder={t('givenNamePlaceholder')}
          error={errors.given_name?.message}
          registration={register('given_name')}
        />
        <WizardTextField
          id="wizard-family-name"
          label={t('familyName')}
          autoComplete="family-name"
          placeholder={t('familyNamePlaceholder')}
          helper={t('familyNameHelper')}
          error={errors.family_name?.message}
          registration={register('family_name')}
        />
      </div>
      <WizardTextField
        id="wizard-email"
        type="email"
        inputMode="email"
        label={t('email')}
        autoComplete="email"
        placeholder={t('emailPlaceholder')}
        error={errors.email?.message}
        registration={register('email')}
      />
      <div className="grid grid-cols-2 gap-3.5">
        <WizardTextField
          id="wizard-dob"
          type="date"
          max={todayIso()}
          label={t('dateOfBirth')}
          error={errors.date_of_birth?.message}
          registration={register('date_of_birth')}
        />
        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <WizardField label={t('gender.label')} error={errors.gender?.message}>
              <SegmentedControl
                className="w-full flex-wrap"
                ariaLabel={t('gender.label')}
                options={genderOptions}
                value={field.value ?? ''}
                onValueChange={field.onChange}
              />
            </WizardField>
          )}
        />
      </div>
      <Controller
        control={control}
        name="nationality"
        render={({ field, fieldState }) => (
          <WizardField htmlFor="wizard-nationality" label={t('nationality')} error={fieldState.error?.message}>
            <NationalityCombobox
              id="wizard-nationality"
              locale={locale}
              value={field.value ?? ''}
              placeholder={t('nationalityPlaceholder')}
              emptyLabel={t('nationalityEmpty')}
              ariaLabel={t('nationality')}
              ariaDescribedBy={fieldState.error ? 'wizard-nationality-error' : undefined}
              invalid={Boolean(fieldState.error)}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
            />
          </WizardField>
        )}
      />
      <WizardTextField
        id="wizard-passport"
        label={t('passportNumber')}
        helper={t('passportHelper')}
        placeholder={t('passportPlaceholder')}
        error={errors.passport_number?.message}
        registration={register('passport_number')}
      />
    </div>
  );
}
