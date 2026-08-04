'use client';

import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

import { SelectField, type ChoiceOption } from '@/modules/design-system';

import type { OnboardingSelectFieldProps } from '@/modules/school-onboarding/types/components.types';

// Controller bridge between RHF and the controlled DS SelectField.
export function OnboardingSelectField<T extends FieldValues>({
  control,
  name,
  id,
  label,
  options,
  placeholder,
  error,
}: OnboardingSelectFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <SelectField
          id={id}
          label={label}
          options={options}
          placeholder={placeholder}
          value={typeof field.value === 'string' ? field.value : ''}
          onValueChange={field.onChange}
          errorText={error}
          required
        />
      )}
    />
  );
}
