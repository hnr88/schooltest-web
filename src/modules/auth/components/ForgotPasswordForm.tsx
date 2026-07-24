'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

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
      onSuccess: () => {
        toast.success(t('resetLinkSent'));
        onSent(values.email);
      },
      onError: (error) => {
        const key = classifyForgotPasswordError(error);
        setFormError(key);
        toast.error(t(key));
      },
    });
  });

  return (
    <div className="flex flex-col gap-5">
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-tile bg-blue-50 text-blue-600"
      >
        <Lock className="size-5" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-auth-title font-bold text-foreground">{t('forgotTitle')}</h1>
        <p className="text-body-md text-body">{t('forgotSubtitle')}</p>
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
        <Button
          type="submit"
          size="xl"
          loading={forgotPassword.isPending}
          className="w-full rounded-lg shadow-sm transition-[transform,background-color,box-shadow] duration-150 ease-out-expo hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          {forgotPassword.isPending ? t('sendingResetLink') : t('sendResetLink')}
        </Button>
      </form>
    </div>
  );
}
