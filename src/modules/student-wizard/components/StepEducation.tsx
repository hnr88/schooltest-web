'use client';

import { useTranslations } from 'next-intl';
import { Controller, useFormContext, useFormState } from 'react-hook-form';

import { SegmentedControl } from '@/modules/design-system';
import { WizardField } from '@/modules/student-wizard/components/WizardField';
import { WizardSelectField } from '@/modules/student-wizard/components/WizardSelectField';
import { WizardTextField } from '@/modules/student-wizard/components/WizardTextField';
import {
  CURRENT_YEAR_LEVEL_VALUES,
  TARGET_ENTRY_YEARS,
  TERM_VALUES,
  YEAR_LEVEL_VALUES,
} from '@/modules/student-wizard/constants/student-wizard.constants';
import type { StudentWizardValues } from '@/modules/student-wizard/types/student-wizard.types';

// C-UI-STUDENT-WIZARD step 2 — 5 education fields on the shared RHF form (048).
// D-C8: `current_year_level` is the separate school-year string enum (13 opts);
// `year_level` is the int SchoolTest testing band (7–12) — never one field.
export function StepEducation() {
  const t = useTranslations('StudentWizard.education');
  const { register, control } = useFormContext<StudentWizardValues>();
  const { errors } = useFormState({ control });

  const currentYearLevelOptions = CURRENT_YEAR_LEVEL_VALUES.map((value) => ({
    value,
    label: value === 'Prep' ? t('prep') : t('yearOption', { n: Number(value.slice(5)) }),
  }));
  const yearLevelOptions = YEAR_LEVEL_VALUES.map((value) => ({ value, label: t('yearOption', { n: value }) }));
  const targetYearOptions = TARGET_ENTRY_YEARS.map((value) => ({ value, label: value }));
  const termOptions = TERM_VALUES.map((value) => ({ value, label: t('term', { n: Number(value.slice(5)) }) }));

  return (
    <div className="flex flex-col gap-4 duration-300 ease-out animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
      <WizardTextField
        id="wizard-current-school"
        label={t('currentSchool')}
        placeholder={t('currentSchoolPlaceholder')}
        error={errors.current_school?.message}
        registration={register('current_school')}
      />
      <div className="grid grid-cols-2 gap-3.5">
        <Controller
          control={control}
          name="current_year_level"
          render={({ field, fieldState }) => (
            <WizardSelectField
              id="wizard-current-year-level"
              label={t('currentYearLevel')}
              placeholder={t('currentYearLevelPlaceholder')}
              options={currentYearLevelOptions}
              value={field.value ?? null}
              error={fieldState.error?.message}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
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
              onBlur={field.onBlur}
            />
          )}
        />
      </div>
      <div className="grid grid-cols-2 gap-3.5">
        <Controller
          control={control}
          name="target_entry_year"
          render={({ field, fieldState }) => (
            <WizardSelectField
              id="wizard-target-entry-year"
              label={t('targetEntryYear')}
              placeholder={t('targetEntryYearPlaceholder')}
              options={targetYearOptions}
              value={field.value || null}
              error={fieldState.error?.message}
              triggerRef={field.ref}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        <Controller
          control={control}
          name="target_entry_term"
          render={({ field, fieldState }) => (
            <WizardField label={t('targetEntryTerm')} error={fieldState.error?.message}>
              <SegmentedControl
                className="w-full flex-wrap"
                ariaLabel={t('targetEntryTerm')}
                options={termOptions}
                value={field.value ?? ''}
                onValueChange={field.onChange}
              />
            </WizardField>
          )}
        />
      </div>
    </div>
  );
}
