'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { PasswordField } from '@/modules/auth/components/PasswordField';
import { classifyChangePasswordError } from '@/modules/auth/lib/classify-change-password-error';
import { useChangePasswordMutation } from '@/modules/auth/queries/use-change-password.mutation';
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from '@/modules/auth/schemas/change-password.schema';
import type { ChangePasswordErrorKey } from '@/modules/auth/types/auth.types';
import { Alert, Button } from '@/modules/design-system';

// §5.13 change-password form: three PasswordFields + right-aligned primary
// submit. Success → sonner toast + reset (a fresh jwt is stored by the
// mutation; old jwts keep working, so the copy claims no sign-out anywhere).
export function ChangePasswordForm() {
  const t = useTranslations('Auth');
  const changePassword = useChangePasswordMutation();
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const [formError, setFormError] = useState<ChangePasswordErrorKey | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', password: '', passwordConfirmation: '' },
  });

  const toggle = (key: 'current' | 'next' | 'confirm') =>
    setVisible((state) => ({ ...state, [key]: !state[key] }));

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    changePassword.mutate(values, {
      onSuccess: () => {
        toast.success(t('passwordUpdated'));
        reset();
      },
      onError: (error) => setFormError(classifyChangePasswordError(error)),
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError ? (
        <Alert variant="error" title={t(formError)}>
          {null}
        </Alert>
      ) : null}
      <PasswordField
        id="change-current-password"
        label={t('currentPasswordLabel')}
        placeholder={t('currentPasswordPlaceholder')}
        autoComplete="current-password"
        visible={visible.current}
        onToggleVisible={() => toggle('current')}
        toggleLabel={t(visible.current ? 'hidePassword' : 'showPassword')}
        error={errors.currentPassword?.message ? t(errors.currentPassword.message) : undefined}
        registration={register('currentPassword')}
      />
      <PasswordField
        id="change-new-password"
        label={t('newPasswordLabel')}
        placeholder={t('newPasswordPlaceholder')}
        autoComplete="new-password"
        visible={visible.next}
        onToggleVisible={() => toggle('next')}
        toggleLabel={t(visible.next ? 'hidePassword' : 'showPassword')}
        error={errors.password?.message ? t(errors.password.message) : undefined}
        registration={register('password')}
      />
      <PasswordField
        id="change-confirm-password"
        label={t('confirmPasswordLabel')}
        placeholder={t('confirmPasswordPlaceholder')}
        autoComplete="new-password"
        visible={visible.confirm}
        onToggleVisible={() => toggle('confirm')}
        toggleLabel={t(visible.confirm ? 'hideConfirmPassword' : 'showConfirmPassword')}
        error={
          errors.passwordConfirmation?.message ? t(errors.passwordConfirmation.message) : undefined
        }
        registration={register('passwordConfirmation')}
      />
      <div className="flex justify-end">
        <Button type="submit" loading={changePassword.isPending}>
          {changePassword.isPending ? t('updatingPassword') : t('updatePasswordButton')}
        </Button>
      </div>
    </form>
  );
}
