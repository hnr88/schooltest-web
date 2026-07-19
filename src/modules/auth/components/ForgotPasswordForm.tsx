'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { TextField } from '@/modules/auth/components/TextField';
import { classifyForgotPasswordError } from '@/modules/auth/lib/classify-forgot-password-error';
import { useForgotPasswordMutation } from '@/modules/auth/queries/use-forgot-password.mutation';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/modules/auth/schemas/forgot-password.schema';
import type { ForgotPasswordErrorKey } from '@/modules/auth/types/auth.types';
import { Alert, Button } from '@/modules/design-system';

interface ForgotPasswordFormProps {
  onSent: (email: string) => void;
}

// Request state of the forgot-password card (§14.3): blue lock tile, title +
// helper copy, email field, primary submit. Success is enumeration-safe — the
// parent swaps to the sent state for ANY accepted email.
export function ForgotPasswordForm({ onSent }: ForgotPasswordFormProps) {
  const t = useTranslations('Auth');
  const forgotPassword = useForgotPasswordMutation();
  const [formError, setFormError] = useState<ForgotPasswordErrorKey | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    forgotPassword.mutate(values, {
      onSuccess: () => onSent(values.email),
      onError: (error) => setFormError(classifyForgotPasswordError(error)),
    });
  });

  return (
    <div className="flex flex-col gap-5">
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
      >
        <Lock className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t('forgotTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('forgotSubtitle')}</p>
      </div>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {formError ? (
          <Alert variant="error" title={t(formError)}>
            {null}
          </Alert>
        ) : null}
        <TextField
          id="forgot-password-email"
          label={t('emailLabel')}
          type="email"
          autoComplete="email"
          placeholder={t('emailPlaceholder')}
          error={errors.email?.message ? t(errors.email.message) : undefined}
          registration={register('email')}
        />
        <Button type="submit" size="lg" loading={forgotPassword.isPending} className="w-full">
          {forgotPassword.isPending ? t('sendingResetLink') : t('sendResetLink')}
        </Button>
      </form>
    </div>
  );
}
