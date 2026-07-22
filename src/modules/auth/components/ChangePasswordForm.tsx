'use client';

import { useTranslations } from 'next-intl';

import { PasswordField } from '@/modules/auth/components/PasswordField';
import { useChangePasswordForm } from '@/modules/auth/hooks/use-change-password-form';
import { Alert, Button } from '@/modules/design-system';

// §5.13 change-password form: three PasswordFields + right-aligned primary
// submit. Success → sonner toast + reset (a fresh jwt is stored by the
// mutation; old jwts keep working, so the copy claims no sign-out anywhere).
export function ChangePasswordForm() {
  const t = useTranslations('Auth');
  const { errors, formError, isPending, onSubmit, register, toggle, visible } =
    useChangePasswordForm();

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
        <Button type="submit" className="h-11" loading={isPending}>
          {isPending ? t('updatingPassword') : t('updatePasswordButton')}
        </Button>
      </div>
    </form>
  );
}
