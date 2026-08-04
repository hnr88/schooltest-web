'use client';

import { useTranslations } from 'next-intl';
import { Controller, useFormContext, useFormState } from 'react-hook-form';

import { WizardChoiceField } from '@/modules/student-wizard/components/WizardChoiceField';
import { WizardSelectField } from '@/modules/student-wizard/components/WizardSelectField';
import { WizardTextField } from '@/modules/student-wizard/components/WizardTextField';
import { useEducationOptions } from '@/modules/student-wizard/hooks/use-education-options';

import type { StudentWizardValues } from '@/modules/student-wizard/types/student-wizard.types';

// Step 2 — Education (spec 03 §2.5): [current school | current year level],
// [test year level | target entry year], [target entry term, full width]. The
// testing band stays the canonical select (INT the API validates; localized
// "Year 9" label asserted by 053).
export function StepEducation() {
  const t = useTranslations('StudentWizard.education');
  const { register, control } = useFormContext<StudentWizardValues>();
  const { errors } = useFormState({ control });
  const { currentYearLevelOptions, yearLevelOptions, targetYearOptions, termOptions } =
    useEducationOptions();

  return (
    <div className="flex flex-col gap-5.5 duration-300 ease-out animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
      <div className="grid gap-4 sm:grid-cols-2">
        <WizardTextField
          id="wizard-current-school"
          label={t('currentSchool')}
          required
          placeholder={t('currentSchoolPlaceholder')}
          error={errors.current_school?.message}
          registration={register('current_school')}
        />
        <Controller
          control={control}
          name="current_year_level"
          render={({ field, fieldState }) => (
            <WizardSelectField
              id="wizard-current-year-level"
              label={t('currentYearLevel')}
              required
              placeholder={t('currentYearLevelPlaceholder')}
              options={currentYearLevelOptions}
              value={field.value ?? null}
              error={fieldState.error?.message}
              triggerRef={field.ref}
              onValueChange={field.onChange}
            />
          )}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="year_level"
          render={({ field, fieldState }) => (
            <WizardSelectField
              id="wizard-year-level"
              label={t('yearLevel')}
              helper={t('yearLevelHelper')}
              placeholder={t('yearLevelPlaceholder')}
              options={yearLevelOptions}
              value={field.value ?? null}
              error={fieldState.error?.message}
              onValueChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="target_entry_year"
          render={({ field, fieldState }) => (
            <WizardSelectField
              id="wizard-target-entry-year"
              label={t('targetEntryYear')}
              required
              placeholder={t('targetEntryYearPlaceholder')}
              options={targetYearOptions}
              value={field.value || null}
              error={fieldState.error?.message}
              triggerRef={field.ref}
              onValueChange={field.onChange}
            />
          )}
        />
      </div>
      <Controller
        control={control}
        name="target_entry_term"
        render={({ field, fieldState }) => (
          <WizardChoiceField
            id="wizard-target-entry-term"
            label={t('targetEntryTerm')}
            required
            size="medium"
            options={termOptions}
            value={field.value ?? ''}
            error={fieldState.error?.message}
            onValueChange={field.onChange}
          />
        )}
      />
    </div>
  );
}
