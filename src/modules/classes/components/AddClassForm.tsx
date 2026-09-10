'use client';

import { useTranslations } from 'next-intl';
import { Controller } from 'react-hook-form';

import { useAddClassForm } from '@/modules/classes/hooks/use-add-class-form';
import { teacherOption } from '@/modules/classes/lib/class-form.helpers';
import {
  Button,
  DialogFooter,
  FieldShell,
  Input,
  SelectField,
} from '@/modules/design-system';

import type { AddClassFormProps } from '@/modules/classes/types/components.types';

// The spec §2 add-class body (P-03): name + teacher picker + summary, and
// nothing else — the CSV import block left this modal, so there is exactly ONE
// import flow (the shared dialog) and ONE engine behind it. Students join the
// new class through the class-detail or Students-page import dialog.
export function AddClassForm({ teachers, onClose }: AddClassFormProps) {
  const t = useTranslations('Classes.addForm');
  const { form, submit, pending } = useAddClassForm(onClose);
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
