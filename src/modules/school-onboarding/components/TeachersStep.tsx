'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import { Button } from '@/modules/design-system';
import { TeacherRow } from '@/modules/school-onboarding/components/TeacherRow';
import { TEACHER_ROLE_VALUES } from '@/modules/school-onboarding/constants/school-onboarding.constants';
import {
  createTeachersSchema,
  type TeachersValues,
} from '@/modules/school-onboarding/schemas/school-onboarding.schema';
import type { TeacherEntry } from '@/modules/school-onboarding/types/school-onboarding.types';

interface TeachersStepProps {
  defaultValues: TeacherEntry[];
  onSubmit: (teachers: TeacherEntry[]) => void;
  onBack: () => void;
}

const EMPTY_TEACHER: TeacherEntry = { first_name: '', last_name: '', email: '', role: 'teacher' };

// Step 2: teacher invitations. Zero teachers is valid — the school can invite
// staff later (spec section 5 ordering).
export function TeachersStep({ defaultValues, onSubmit, onBack }: TeachersStepProps) {
  const t = useTranslations('SchoolOnboarding.teachers');
  const tv = useTranslations('SchoolOnboarding.validation');
  const schema = useMemo(() => createTeachersSchema(tv), [tv]);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{ teachers: TeacherEntry[] }, unknown, TeachersValues>({
    resolver: zodResolver(schema),
    defaultValues: { teachers: defaultValues },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'teachers' });

  const roleOptions = TEACHER_ROLE_VALUES.map((value) => ({
    value,
    label: t(`roles.${value}`),
  }));
  const rowLabels = {
    firstName: t('firstName'),
    lastName: t('lastName'),
    email: t('email'),
    role: t('role'),
    remove: t('remove'),
  };

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values.teachers))}
      noValidate
      className="flex flex-col gap-5"
    >
      <div>
        <h2 className="text-xl font-semibold text-foreground">{t('title')}</h2>
        <p className="mt-1 text-body-sm text-muted-foreground">{t('description')}</p>
      </div>
      {fields.length === 0 ? (
        <p className="rounded-lg bg-muted px-4 py-3 text-body-sm text-muted-foreground">
          {t('empty')}
        </p>
      ) : null}
      {fields.map((field, index) => (
        <TeacherRow
          key={field.id}
          control={control}
          register={register}
          index={index}
          errors={errors}
          roleOptions={roleOptions}
          labels={{ ...rowLabels, rowLabel: t('rowLabel', { index: index + 1 }) }}
          onRemove={() => remove(index)}
        />
      ))}
      <Button type="button" variant="outline" size="lg" onClick={() => append(EMPTY_TEACHER)}>
        <Plus className="size-4" aria-hidden />
        {t('add')}
      </Button>
      <div className="mt-2 flex justify-between">
        <Button type="button" variant="ghost" size="lg" onClick={onBack}>
          {t('back')}
        </Button>
        <Button type="submit" size="lg">
          {t('continue')}
        </Button>
      </div>
    </form>
  );
}
