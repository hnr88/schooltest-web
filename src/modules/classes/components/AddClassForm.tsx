'use client';

import { useTranslations } from 'next-intl';
import { Controller } from 'react-hook-form';

import { useAddClassForm } from '@/modules/classes/hooks/use-add-class-form';
import { teacherOption } from '@/modules/classes/lib/class-form.helpers';
import {
  Alert,
  Button,
  DialogFooter,
  FieldShell,
  Input,
  SelectField,
  Separator,
} from '@/modules/design-system';
import { StudentImportFields } from '@/modules/student-import';

import type { AddClassFormProps } from '@/modules/classes/types/components.types';

// The spec §2 add-class body: class details, a divider, then the shared student
// import block. No `classes` prop is passed to StudentImportFields — the class
// is the one being created in this very submit, so there is nothing to pick.
export function AddClassForm({ teachers, onClose }: AddClassFormProps) {
  const t = useTranslations('Classes.addForm');
  const { form, submit, parsed, setParsed, pending } = useAddClassForm(onClose);
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell id="add-class-name" label={t('name')} errorText={errors.name?.message} required>
          <Input
            id="add-class-name"
            autoComplete="off"
            placeholder={t('namePlaceholder')}
            {...register('name')}
          />
        </FieldShell>
        <Controller
          control={control}
          name="teacher_documentId"
          render={({ field }) => (
            <SelectField
              id="add-class-teacher"
              label={t('teacher')}
              placeholder={t('teacherPlaceholder')}
              options={teachers.map(teacherOption)}
              value={field.value}
              onValueChange={field.onChange}
              disabled={teachers.length === 0}
            />
          )}
        />
      </div>
      <Separator />
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{t('importTitle')}</h3>
        <p className="text-sm text-body">{t('importDescription')}</p>
      </div>
      <StudentImportFields onChange={setParsed} />
      {parsed.errors.length > 0 ? (
        <Alert variant="warning" title={t('importErrorsTitle')}>
          {t('importErrorsDescription', { count: parsed.errors.length })}
        </Alert>
      ) : null}
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
          {t('cancel')}
        </Button>
        <Button type="submit" variant="accent" loading={pending}>
          {pending ? t('submitting') : t('submit')}
        </Button>
      </DialogFooter>
    </form>
  );
}
