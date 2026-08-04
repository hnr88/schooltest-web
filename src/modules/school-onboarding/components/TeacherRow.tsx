'use client';

import { Trash2 } from 'lucide-react';
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';

import { Button, type ChoiceOption } from '@/modules/design-system';
import { OnboardingSelectField } from '@/modules/school-onboarding/components/OnboardingSelectField';
import { OnboardingTextField } from '@/modules/school-onboarding/components/OnboardingTextField';
import type { TeacherEntry } from '@/modules/school-onboarding/types/school-onboarding.types';

import type { TeacherRowProps } from '@/modules/school-onboarding/types/components.types';

// One teacher invitation row (extracted so TeachersStep stays under the
// 120-line component cap).
export function TeacherRow({
  control,
  register,
  index,
  errors,
  roleOptions,
  labels,
  onRemove,
}: TeacherRowProps) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <legend className="text-body-sm font-semibold text-secondary-foreground">
          {labels.rowLabel}
        </legend>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} aria-label={labels.remove}>
          <Trash2 className="size-4" aria-hidden />
          {labels.remove}
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <OnboardingTextField
          id={`onb-teacher-${index}-first-name`}
          label={labels.firstName}
          autoComplete="off"
          error={errors.teachers?.[index]?.first_name?.message}
          registration={register(`teachers.${index}.first_name`)}
        />
        <OnboardingTextField
          id={`onb-teacher-${index}-last-name`}
          label={labels.lastName}
          autoComplete="off"
          error={errors.teachers?.[index]?.last_name?.message}
          registration={register(`teachers.${index}.last_name`)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <OnboardingTextField
          id={`onb-teacher-${index}-email`}
          label={labels.email}
          type="email"
          autoComplete="off"
          error={errors.teachers?.[index]?.email?.message}
          registration={register(`teachers.${index}.email`)}
        />
        <OnboardingSelectField
          control={control}
          name={`teachers.${index}.role`}
          id={`onb-teacher-${index}-role`}
          label={labels.role}
          options={roleOptions}
          placeholder={labels.role}
        />
      </div>
    </fieldset>
  );
}
