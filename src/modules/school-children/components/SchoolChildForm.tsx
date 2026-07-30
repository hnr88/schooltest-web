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
import { ChildEaldFields } from '@/modules/school-children/components/ChildEaldFields';
import { useChildForm, type ChildFormTarget } from '@/modules/school-children/hooks/use-child-form';
import { YEAR_LEVEL_OPTIONS } from '@/modules/school-children/schemas/school-child.schema';

interface SchoolChildFormProps {
  target: ChildFormTarget;
  classes: SchoolClass[];
  showAcaraPhase: boolean;
  onCancel: () => void;
  onDone: () => void;
}

// The C-CHD-02 v2/03 form body: name, email, date of birth, year level, class
// and the EAL/D block (first-language picklist, admin-only ACARA phase). No
// guardian, media or parent fields exist here — the server rejects them with
// a 400, and the parent wizard keeps them behind its own routes. Mounted
// fresh per target, so default values always match.
export function SchoolChildForm({ target, classes, showAcaraPhase, onCancel, onDone }: SchoolChildFormProps) {
  const t = useTranslations('SchoolChildren.form');
  const editing = target.mode === 'edit';
  const { form, submit, pending } = useChildForm(target, onDone);
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <FieldShell id="child-given-name" label={t('givenName')} errorText={errors.given_name?.message} required>
        <Input id="child-given-name" autoComplete="off" {...register('given_name')} />
      </FieldShell>
      <FieldShell id="child-family-name" label={t('familyName')} errorText={errors.family_name?.message}>
        <Input id="child-family-name" autoComplete="off" {...register('family_name')} />
      </FieldShell>
      <FieldShell
        id="child-email"
        label={t('email')}
        helperText={t('emailHint')}
        errorText={errors.email?.message}
      >
        <Input id="child-email" type="email" autoComplete="off" {...register('email')} />
      </FieldShell>
      <FieldShell id="child-dob" label={t('dateOfBirth')} errorText={errors.date_of_birth?.message}>
        <Input id="child-dob" type="date" {...register('date_of_birth')} />
      </FieldShell>
      <FieldShell id="child-year-level" label={t('yearLevel')}>
        <NativeSelect id="child-year-level" className="w-full" {...register('year_level')}>
          {YEAR_LEVEL_OPTIONS.map((option) => (
            <NativeSelectOption key={option} value={option}>
              {option === '' ? t('notSet') : t('yearOption', { level: Number(option) })}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FieldShell>
      <FieldShell id="child-class" label={t('classLabel')}>
        <NativeSelect id="child-class" className="w-full" {...register('class_documentId')}>
          <NativeSelectOption value="">{t('classNone')}</NativeSelectOption>
          {classes.map((schoolClass) => (
            <NativeSelectOption key={schoolClass.documentId} value={schoolClass.documentId}>
              {schoolClass.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FieldShell>
      {editing ? <p className="text-meta text-body">{t('keepHint')}</p> : null}
      <ChildEaldFields form={form} showAcaraPhase={showAcaraPhase} />
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
