'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { classifyResetPasswordError } from '@/modules/auth/lib/classify-reset-password-error';
import { isResetPasswordWithinByteLimit } from '@/modules/auth/lib/reset-password-policy';
import { useResetPasswordMutation } from '@/modules/auth/queries/use-reset-password.mutation';
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@/modules/auth/schemas/reset-password.schema';

import type { PasswordRuleState, ResetPasswordErrorKey } from '@/modules/auth/types/auth.types';
import type { UseResetPasswordFormOptions } from '@/modules/auth/types/hooks.types';

// Form state + submit wiring for the reset-password card. The mutation stores
// the fresh jwt; the card keeps the user on its explicit completion state.
export function useResetPasswordForm({
  code,
  onExpiredCode,
  onInvalidCode,
  onSuccess,
}: UseResetPasswordFormOptions) {
  const t = useTranslations('Auth');
  const resetPassword = useResetPasswordMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<Exclude<
    ResetPasswordErrorKey,
    'invalidOrExpired' | 'expiredLink'
  > | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', passwordConfirmation: '' },
  });
  const password = useWatch({ control, name: 'password' });
  const passwordRuleState: PasswordRuleState =
    password.length === 0
      ? 'pending'
      : isResetPasswordWithinByteLimit(password)
        ? 'met'
        : 'unmet';

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    resetPassword.mutate(
      { code, ...values },
      {
        onSuccess: () => {
          toast.success(t('passwordReset'));
          onSuccess();
        },
        onError: (error) => {
          const key = classifyResetPasswordError(error);
          if (key === 'expiredLink') {
            toast.error(t('expiredLinkTitle'));
            onExpiredCode();
          } else if (key === 'invalidOrExpired') {
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

  return {
    register,
    errors,
    onSubmit,
    formError,
    passwordRuleState,
    isPending: resetPassword.isPending,
    showPassword,
    toggleShowPassword: () => setShowPassword((current) => !current),
    showConfirmPassword,
    toggleShowConfirmPassword: () => setShowConfirmPassword((current) => !current),
  };
}
