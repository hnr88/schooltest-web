'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Controller, useFormContext, useFormState } from 'react-hook-form';

import { NationalityCombobox } from '@/modules/student-wizard/components/NationalityCombobox';
import { WizardChoiceField } from '@/modules/student-wizard/components/WizardChoiceField';
import { WizardTextField } from '@/modules/student-wizard/components/WizardTextField';
import { GENDER_VALUES } from '@/modules/student-wizard/constants/student-wizard.constants';
import type { StudentWizardValues } from '@/modules/student-wizard/types/student-wizard.types';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Step 1 — Personal (spec 03 §2.4). Row grouping is the design's, verbatim:
// [given | family], [date of birth | email], [gender full-width], [nationality |
// passport], two-up rows at `1fr 1fr / gap:16px` and 22px between them.
// Date of birth stays a native date input, not the design's DD/MM/YYYY text box:
// the schema this field is bound to accepts ISO only.
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
    <div className="flex flex-col gap-5.5 duration-300 ease-out animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
      <div className="grid gap-4 sm:grid-cols-2">
        <WizardTextField
          id="wizard-given-name"
          label={t('givenName')}
          required
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
      <div className="grid gap-4 sm:grid-cols-2">
        <WizardTextField
          id="wizard-dob"
          type="date"
          max={todayIso()}
          label={t('dateOfBirth')}
          error={errors.date_of_birth?.message}
          registration={register('date_of_birth')}
        />
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
      </div>
      <Controller
        control={control}
        name="gender"
        render={({ field }) => (
          <WizardChoiceField
            id="wizard-gender"
            label={t('gender.label')}
            options={genderOptions}
            value={field.value ?? ''}
            error={errors.gender?.message}
            onValueChange={field.onChange}
          />
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="nationality"
          render={({ field, fieldState }) => (
            <NationalityCombobox
              id="wizard-nationality"
              label={t('nationality')}
              required
              locale={locale}
              value={field.value ?? ''}
              placeholder={t('nationalityPlaceholder')}
              emptyLabel={t('nationalityEmpty')}
              error={fieldState.error?.message}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
            />
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
    </div>
  );
}
