'use client';

import { useTranslations } from 'next-intl';

import { useEditClassForm } from '@/modules/classes/hooks/use-edit-class-form';
import { teacherLabel } from '@/modules/classes/lib/class-form.helpers';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FieldShell,
  Input,
  NativeSelect,
  NativeSelectOption,
  Skeleton,
} from '@/modules/design-system';
import { useTeachersQuery } from '@/modules/teachers';

import type { EditClassDialogProps } from '@/modules/classes/types/components.types';

// Spec §1 Edit Class modal: rename the class and reassign its teacher through a
// SINGLE dropdown — one teacher per class for MVP. This replaces the old
// checkbox-based assignment panel; the roster is not edited here.
export function EditClassDialog({ schoolClass, onClose }: EditClassDialogProps) {
  const t = useTranslations('Classes.detail.edit');
  const teachersQuery = useTeachersQuery(true);
  const { form, submit, pending } = useEditClassForm(schoolClass, onClose);
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        {teachersQuery.isPending ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : teachersQuery.isError ? (
          <Alert variant="error" title={t('loadError')}>
            {t('loadErrorDescription')}
          </Alert>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <FieldShell
              id="edit-class-name"
              label={t('nameLabel')}
              errorText={errors.name?.message}
              required
            >
              <Input id="edit-class-name" autoComplete="off" {...register('name')} />
            </FieldShell>
            <FieldShell id="edit-class-teacher" label={t('teacherLabel')}>
              <NativeSelect
                id="edit-class-teacher"
                className="w-full"
                {...register('teacher_documentId')}
              >
                <NativeSelectOption value="">{t('teacherUnassigned')}</NativeSelectOption>
                {(teachersQuery.data ?? []).map((teacher) => (
                  <NativeSelectOption key={teacher.documentId} value={teacher.documentId}>
                    {teacherLabel(teacher)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FieldShell>
            <DialogFooter>
              <Button type="button" size="lg" variant="outline" onClick={onClose} disabled={pending}>
                {t('cancel')}
              </Button>
              <Button type="submit" size="lg" loading={pending}>
                {pending ? t('saving') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
