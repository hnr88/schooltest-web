'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useRouter } from '@/i18n/navigation';
import { PasswordField } from '@/modules/auth/components/PasswordField';
import { classifyResetPasswordError } from '@/modules/auth/lib/classify-reset-password-error';
import { useResetPasswordMutation } from '@/modules/auth/queries/use-reset-password.mutation';
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@/modules/auth/schemas/reset-password.schema';
import type { ResetPasswordErrorKey } from '@/modules/auth/types/auth.types';
import { Alert, Button } from '@/modules/design-system';

interface ResetPasswordFormProps {
  code: string;
  onInvalidCode: () => void;
}

// Form state of the reset-password card (§14.3 reuse): blue key tile, title +
// helper copy, two PasswordFields, primary submit. A 400 (invalid/expired
// code) hands off to the parent's error state; success auto-logs-in (mutation
// stores the fresh jwt) and lands on the dashboard.
export function ResetPasswordForm({ code, onInvalidCode }: ResetPasswordFormProps) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const resetPassword = useResetPasswordMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<Exclude<
    ResetPasswordErrorKey,
    'invalidOrExpired'
  > | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', passwordConfirmation: '' },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    resetPassword.mutate(
      { code, ...values },
      {
        onSuccess: () => {
          toast.success(t('passwordReset'));
          router.replace('/dashboard');
        },
        onError: (error) => {
          const key = classifyResetPasswordError(error);
          if (key === 'invalidOrExpired') {
            toast.error(t('invalidLinkTitle'));
            onInvalidCode();
          } else {
            setFormError(key);
            toast.error(t(key));
          }
        },
      },
    );
  });

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
          onToggleVisible={() => setShowPassword((current) => !current)}
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
          onToggleVisible={() => setShowConfirmPassword((current) => !current)}
          toggleLabel={t(showConfirmPassword ? 'hideConfirmPassword' : 'showConfirmPassword')}
          error={
            errors.passwordConfirmation?.message ? t(errors.passwordConfirmation.message) : undefined
          }
          registration={register('passwordConfirmation')}
        />
        <Button
          type="submit"
          size="xl"
          loading={resetPassword.isPending}
          className="w-full rounded-lg shadow-sm transition-[transform,background-color,box-shadow] duration-150 ease-out-expo hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          {resetPassword.isPending ? t('resettingPassword') : t('resetButton')}
        </Button>
      </form>
    </div>
  );
}
