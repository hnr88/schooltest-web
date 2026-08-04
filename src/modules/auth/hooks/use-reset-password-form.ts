'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useRouter } from '@/i18n/navigation';
import { classifyResetPasswordError } from '@/modules/auth/lib/classify-reset-password-error';
import { useResetPasswordMutation } from '@/modules/auth/queries/use-reset-password.mutation';
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@/modules/auth/schemas/reset-password.schema';

import type { ResetPasswordErrorKey } from '@/modules/auth/types/auth.types';
import type { UseResetPasswordFormOptions } from '@/modules/auth/types/hooks.types';

// Form state + submit wiring for the reset-password card. A 400 (invalid or
// expired code) hands off to the caller's error state; success auto-logs-in
// (the mutation stores the fresh jwt) and lands on the dashboard.
export function useResetPasswordForm({ code, onInvalidCode }: UseResetPasswordFormOptions) {
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

  return {
    register,
    errors,
    onSubmit,
    formError,
    isPending: resetPassword.isPending,
    showPassword,
    toggleShowPassword: () => setShowPassword((current) => !current),
    showConfirmPassword,
    toggleShowConfirmPassword: () => setShowConfirmPassword((current) => !current),
  };
}
