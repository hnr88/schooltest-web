'use client';

import { KeyRound } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PasswordField } from '@/modules/auth/components/PasswordField';
import { useResetPasswordForm } from '@/modules/auth/hooks/use-reset-password-form';
import { Alert, Button } from '@/modules/design-system';

import type { ResetPasswordFormProps } from '@/modules/auth/types/components.types';

// Form state of the reset-password card (§14.3 reuse): blue key tile, title +
// helper copy, two PasswordFields, primary submit.
export function ResetPasswordForm({ code, onInvalidCode }: ResetPasswordFormProps) {
  const t = useTranslations('Auth');
  const {
    register,
    errors,
    onSubmit,
    formError,
    isPending,
    showPassword,
    toggleShowPassword,
    showConfirmPassword,
    toggleShowConfirmPassword,
  } = useResetPasswordForm({ code, onInvalidCode });

  return (
    <div className="flex flex-col gap-5">
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-tile bg-blue-50 text-blue-600"
      >
        <KeyRound className="size-5" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-auth-title font-bold text-foreground">{t('resetTitle')}</h1>
        <p className="text-body-md text-body">{t('resetSubtitle')}</p>
      </div>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {formError ? (
          <Alert variant="error" title={t(formError)}>
            {null}
          </Alert>
        ) : null}
        <PasswordField
          id="reset-password"
          label={t('newPasswordLabel')}
          placeholder={t('newPasswordPlaceholder')}
          autoComplete="new-password"
          visible={showPassword}
          onToggleVisible={toggleShowPassword}
          toggleLabel={t(showPassword ? 'hidePassword' : 'showPassword')}
          error={errors.password?.message ? t(errors.password.message) : undefined}
          registration={register('password')}
        />
        <PasswordField
          id="reset-confirm-password"
          label={t('confirmPasswordLabel')}
          placeholder={t('confirmPasswordPlaceholder')}
          autoComplete="new-password"
          visible={showConfirmPassword}
          onToggleVisible={toggleShowConfirmPassword}
          toggleLabel={t(showConfirmPassword ? 'hideConfirmPassword' : 'showConfirmPassword')}
          error={
            errors.passwordConfirmation?.message ? t(errors.passwordConfirmation.message) : undefined
          }
          registration={register('passwordConfirmation')}
        />
        <Button
          type="submit"
          size="xl"
          loading={isPending}
          className="w-full rounded-lg shadow-sm transition-[transform,background-color,box-shadow] duration-150 ease-out-expo hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          {isPending ? t('resettingPassword') : t('resetButton')}
        </Button>
      </form>
    </div>
  );
}
