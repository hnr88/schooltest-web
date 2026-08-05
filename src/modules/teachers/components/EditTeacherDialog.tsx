'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FieldShell,
  Input,
} from '@/modules/design-system';
import { serverMessage } from '@/modules/teachers/lib/server-message';
import { useUpdateTeacherMutation } from '@/modules/teachers/queries/use-update-teacher.mutation';
import {
  createEditTeacherSchema,
  type EditTeacherValues,
} from '@/modules/teachers/schemas/edit-teacher.schema';

import type { EditTeacherDialogProps } from '@/modules/teachers/types/components.types';

// C-TCH-04 edit form. Rendered only while open, so the row's own values are the
// defaults. A duplicate email comes back as a 400 ValidationError whose message
// lands inline on the email field; any other failure toasts.
export function EditTeacherDialog({ row, onClose }: EditTeacherDialogProps) {
  const t = useTranslations('Teachers.edit');
  const tv = useTranslations('Teachers.validation');
  const schema = useMemo(() => createEditTeacherSchema(tv), [tv]);
  const update = useUpdateTeacherMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EditTeacherValues, unknown, EditTeacherValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
    },
  });

  const submit = async (values: EditTeacherValues) => {
    try {
      await update.mutateAsync({ documentId: row.documentId, values });
      toast.success(t('successToast', { name: `${values.first_name} ${values.last_name}` }));
      onClose();
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (status === 400 || status === 409) {
        setError('email', { message: serverMessage(error) ?? t('emailInUse') });
        return;
      }
      toast.error(serverMessage(error) ?? t('errorToast'));
    }
  };

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
        <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldShell
              id="edit-first-name"
              label={t('firstName')}
              errorText={errors.first_name?.message}
              required
            >
              <Input id="edit-first-name" autoComplete="off" {...register('first_name')} />
            </FieldShell>
            <FieldShell
              id="edit-last-name"
              label={t('lastName')}
              errorText={errors.last_name?.message}
              required
            >
              <Input id="edit-last-name" autoComplete="off" {...register('last_name')} />
            </FieldShell>
          </div>
          <FieldShell
            id="edit-email"
            label={t('email')}
            errorText={errors.email?.message}
            required
          >
            <Input id="edit-email" type="email" autoComplete="off" {...register('email')} />
          </FieldShell>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={update.isPending}>
              {t('cancel')}
            </Button>
            <Button type="submit" loading={update.isPending}>
              {update.isPending ? t('submitting') : t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
