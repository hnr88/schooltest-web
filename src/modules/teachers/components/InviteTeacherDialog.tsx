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
      toast.success(t('successToast', { email: values.email }));
      close(false);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setError('email', { message: serverMessage(error) ?? t('alreadyInSchool') });
        return;
      }
      toast.error(serverMessage(error) ?? t('errorToast'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldShell id="inv-first-name" label={t('firstName')} errorText={errors.first_name?.message} required>
              <Input id="inv-first-name" autoComplete="off" {...register('first_name')} />
            </FieldShell>
            <FieldShell id="inv-last-name" label={t('lastName')} errorText={errors.last_name?.message} required>
              <Input id="inv-last-name" autoComplete="off" {...register('last_name')} />
            </FieldShell>
          </div>
          <FieldShell id="inv-email" label={t('email')} errorText={errors.email?.message} required>
            <Input id="inv-email" type="email" autoComplete="off" {...register('email')} />
          </FieldShell>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)} disabled={invite.isPending}>
              {t('cancel')}
            </Button>
            <Button type="submit" loading={invite.isPending}>
              {invite.isPending ? t('submitting') : t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
