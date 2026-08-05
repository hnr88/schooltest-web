'use client';

import { useTranslations } from 'next-intl';

import type { SchoolClass } from '@/modules/classes';
import {
  Button,
  FieldShell,
  Input,
  NativeSelect,
  NativeSelectOption,
} from '@/modules/design-system';
import { StudentEaldFields } from '@/modules/school-students/components/StudentEaldFields';
import { useStudentForm } from '@/modules/school-students/hooks/use-student-form';
import type { StudentFormTarget } from '@/modules/school-students/types/hooks.types';
import { YEAR_LEVEL_OPTIONS } from '@/modules/school-students/constants/schemas.constants';

import type { SchoolStudentFormProps } from '@/modules/school-students/types/components.types';

// The C-CHD-02 v2/03 form body: name, email, date of birth, year level, class
// and the EAL/D block (first-language picklist, admin-only ACARA phase). No
// guardian, media or parent fields exist here — the server rejects them with
// a 400, and the parent wizard keeps them behind its own routes. Mounted
// fresh per target, so default values always match.
export function SchoolStudentForm({ target, classes, showAcaraPhase, onCancel, onDone }: SchoolStudentFormProps) {
  const t = useTranslations('SchoolStudents.form');
  const editing = target.mode === 'edit';
  const { form, submit, pending } = useStudentForm(target, onDone);
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <FieldShell id="student-given-name" label={t('givenName')} errorText={errors.given_name?.message} required>
        <Input id="student-given-name" autoComplete="off" {...register('given_name')} />
      </FieldShell>
      <FieldShell id="student-family-name" label={t('familyName')} errorText={errors.family_name?.message}>
        <Input id="student-family-name" autoComplete="off" {...register('family_name')} />
      </FieldShell>
      <FieldShell
        id="student-email"
        label={t('email')}
        helperText={t('emailHint')}
        errorText={errors.email?.message}
      >
        <Input id="student-email" type="email" autoComplete="off" {...register('email')} />
      </FieldShell>
      <FieldShell id="student-dob" label={t('dateOfBirth')} errorText={errors.date_of_birth?.message}>
        <Input id="student-dob" type="date" {...register('date_of_birth')} />
      </FieldShell>
      <FieldShell id="student-year-level" label={t('yearLevel')}>
        <NativeSelect id="student-year-level" className="w-full" {...register('year_level')}>
          {YEAR_LEVEL_OPTIONS.map((option) => (
            <NativeSelectOption key={option} value={option}>
              {option === '' ? t('notSet') : t('yearOption', { level: Number(option) })}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FieldShell>
      <FieldShell id="student-class" label={t('classLabel')}>
        <NativeSelect id="student-class" className="w-full" {...register('class_documentId')}>
          <NativeSelectOption value="">{t('classNone')}</NativeSelectOption>
          {classes.map((schoolClass) => (
            <NativeSelectOption key={schoolClass.documentId} value={schoolClass.documentId}>
              {schoolClass.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FieldShell>
      {editing ? <p className="text-meta text-body">{t('keepHint')}</p> : null}
      <StudentEaldFields form={form} showAcaraPhase={showAcaraPhase} />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          {t('cancel')}
        </Button>
        <Button type="submit" loading={pending}>
          {pending ? t('submitting') : editing ? t('submitEdit') : t('submitCreate')}
        </Button>
      </div>
    </form>
  );
}
