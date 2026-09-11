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
import { useInviteTeacherMutation } from '@/modules/teachers/queries/use-invite-teacher.mutation';
import {
  createInviteTeacherSchema,
  type InviteTeacherValues,
} from '@/modules/teachers/schemas/invite-teacher.schema';

import type { InviteTeacherDialogProps } from '@/modules/teachers/types/components.types';
import {
  DEFAULT_INVITE_ROLE,
  DEFAULT_VALUES,
} from '@/modules/teachers/constants/components.constants';

// C-INV-01 invite form. Spec section 3's field table is first name / last name /
// email, so those are the only three fields the admin fills; the role C-INV-01
// requires comes from the `role` prop (teacher unless a caller says otherwise).
// A 409 (active user with that email already in this school, or an invitation
// already pending for it) lands inline on the email field, carrying the API's
// OWN wording so the admin learns WHICH clash it was; the generic warning is
// only the fallback. Any other failure toasts.
export function InviteTeacherDialog({
  open,
  onOpenChange,
  role = DEFAULT_INVITE_ROLE,
}: InviteTeacherDialogProps) {
  const t = useTranslations('Teachers.invite');
  const tv = useTranslations('Teachers.validation');
  const schema = useMemo(() => createInviteTeacherSchema(tv), [tv]);
  const invite = useInviteTeacherMutation();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<InviteTeacherValues, unknown, InviteTeacherValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  const close = (next: boolean) => {
    if (!next) reset(DEFAULT_VALUES);
    onOpenChange(next);
  };

  const submit = async (values: InviteTeacherValues) => {
    try {
      await invite.mutateAsync({ values, role });
      showOpsToast({ tone: 'ok', message: t('successToast', { email: values.email }) });
      close(false);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setError('email', { message: serverMessage(error) ?? t('alreadyInSchool') });
        return;
      }
      showOpsToast({ tone: 'error', message: serverMessage(error) ?? t('errorToast') });
    }
  };

  return (
    <OpsDialog open={open} onOpenChange={close}>
      <OpsDialogContent className="sm:max-w-[520px]">
        <OpsDialogHeader title={t('title')} sub={t('description')} />
        <form onSubmit={handleSubmit(submit)} noValidate>
          <OpsDialogBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <OpsFieldShell id="inv-first-name" label={t('firstName')} errorText={errors.first_name?.message} required>
                <Input id="inv-first-name" autoComplete="off" className={OPS_CONTROL_CLASS} {...register('first_name')} />
              </OpsFieldShell>
              <OpsFieldShell id="inv-last-name" label={t('lastName')} errorText={errors.last_name?.message} required>
                <Input id="inv-last-name" autoComplete="off" className={OPS_CONTROL_CLASS} {...register('last_name')} />
              </OpsFieldShell>
            </div>
            <OpsFieldShell id="inv-email" label={t('email')} errorText={errors.email?.message} required>
              <Input id="inv-email" type="email" autoComplete="off" className={OPS_CONTROL_CLASS} {...register('email')} />
            </OpsFieldShell>
          </OpsDialogBody>
          <OpsDialogFooter>
            <OpsDialogCancel type="button" onClick={() => close(false)} disabled={invite.isPending}>
              {t('cancel')}
            </OpsDialogCancel>
            <OpsDialogCta type="submit" loading={invite.isPending}>
              {invite.isPending ? t('submitting') : t('submit')}
            </OpsDialogCta>
          </OpsDialogFooter>
        </form>
      </OpsDialogContent>
    </OpsDialog>
  );
}
