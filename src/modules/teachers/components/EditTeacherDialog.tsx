'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import {
  Input,
  OPS_CONTROL_CLASS,
  OpsDialog,
  OpsDialogBody,
  OpsDialogCancel,
  OpsDialogContent,
  OpsDialogCta,
  OpsDialogFooter,
  OpsDialogHeader,
  OpsFieldShell,
} from '@/modules/design-system';
import { showOpsToast } from '@/modules/ops/actions';
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
      showOpsToast({ tone: 'ok', message: t('successToast', { name: `${values.first_name} ${values.last_name}` }) });
      onClose();
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (status === 400 || status === 409) {
        setError('email', { message: serverMessage(error) ?? t('emailInUse') });
        return;
      }
      showOpsToast({ tone: 'error', message: serverMessage(error) ?? t('errorToast') });
    }
  };

  return (
    <OpsDialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <OpsDialogContent className="sm:max-w-[520px]">
        <OpsDialogHeader title={t('title')} sub={t('description')} />
        <form onSubmit={handleSubmit(submit)} noValidate>
          <OpsDialogBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <OpsFieldShell
                id="edit-first-name"
                label={t('firstName')}
                errorText={errors.first_name?.message}
                required
              >
                <Input
                  id="edit-first-name"
                  autoComplete="off"
                  className={OPS_CONTROL_CLASS}
                  {...register('first_name')}
                />
              </OpsFieldShell>
              <OpsFieldShell
                id="edit-last-name"
                label={t('lastName')}
                errorText={errors.last_name?.message}
                required
              >
                <Input
                  id="edit-last-name"
                  autoComplete="off"
                  className={OPS_CONTROL_CLASS}
                  {...register('last_name')}
                />
              </OpsFieldShell>
            </div>
            <OpsFieldShell
              id="edit-email"
              label={t('email')}
              errorText={errors.email?.message}
              required
            >
              <Input
                id="edit-email"
                type="email"
                autoComplete="off"
                className={OPS_CONTROL_CLASS}
                {...register('email')}
              />
            </OpsFieldShell>
          </OpsDialogBody>
          <OpsDialogFooter>
            <OpsDialogCancel type="button" onClick={onClose} disabled={update.isPending}>
              {t('cancel')}
            </OpsDialogCancel>
            <OpsDialogCta type="submit" loading={update.isPending}>
              {update.isPending ? t('submitting') : t('submit')}
            </OpsDialogCta>
          </OpsDialogFooter>
        </form>
      </OpsDialogContent>
    </OpsDialog>
  );
}
