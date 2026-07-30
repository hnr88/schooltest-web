'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { Alert, Button, describedBy, FieldShell, Input } from '@/modules/design-system';
import { useAcceptInvite } from '@/modules/invitation/hooks/use-accept-invite';
import {
  createInviteAcceptSchema,
  type InviteAcceptValues,
} from '@/modules/invitation/schemas/invite-accept.schema';

interface InviteAcceptFormProps {
  token: string;
  defaultValues: { first_name: string; last_name: string };
}

// The accept form (C-INV-06): names prefilled from the invitation, password +
// confirmation collected here. The password never leaves this form except in
// the accept body. Submit/redirect logic lives in useAcceptInvite.
export function InviteAcceptForm({ token, defaultValues }: InviteAcceptFormProps) {
  const t = useTranslations('Invite.form');
  const tv = useTranslations('Invite.validation');
  const schema = useMemo(() => createInviteAcceptSchema(tv), [tv]);
  const { submit, pending, serverError } = useAcceptInvite(token, t('acceptFailed'));
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteAcceptValues, unknown, InviteAcceptValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...defaultValues, password: '', confirm_password: '' },
  });

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="flex flex-col gap-5"
      data-slot="invite-accept-form"
    >
      {serverError ? (
        <Alert variant="error" title={serverError}>
          {null}
        </Alert>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <FieldShell
          id="invite-first-name"
          label={t('firstName')}
          errorText={errors.first_name?.message}
          required
        >
          <Input
            id="invite-first-name"
            autoComplete="given-name"
            aria-invalid={errors.first_name ? true : undefined}
            aria-describedby={describedBy('invite-first-name', undefined, errors.first_name?.message)}
            {...register('first_name')}
          />
        </FieldShell>
        <FieldShell
          id="invite-last-name"
          label={t('lastName')}
          errorText={errors.last_name?.message}
          required
        >
          <Input
            id="invite-last-name"
            autoComplete="family-name"
            aria-invalid={errors.last_name ? true : undefined}
            aria-describedby={describedBy('invite-last-name', undefined, errors.last_name?.message)}
            {...register('last_name')}
          />
        </FieldShell>
      </div>
      <FieldShell
        id="invite-password"
        label={t('password')}
        helperText={t('passwordHint')}
        errorText={errors.password?.message}
        required
      >
        <Input
          id="invite-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={describedBy('invite-password', t('passwordHint'), errors.password?.message)}
          {...register('password')}
        />
      </FieldShell>
      <FieldShell
        id="invite-confirm-password"
        label={t('confirmPassword')}
        errorText={errors.confirm_password?.message}
        required
      >
        <Input
          id="invite-confirm-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.confirm_password ? true : undefined}
          aria-describedby={describedBy('invite-confirm-password', undefined, errors.confirm_password?.message)}
          {...register('confirm_password')}
        />
      </FieldShell>
      <Button type="submit" size="lg" loading={pending} className="mt-2 self-start">
        {pending ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
