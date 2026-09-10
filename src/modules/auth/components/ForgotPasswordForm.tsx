'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
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
import type { ForgotPasswordErrorKey, StrapiErrorBody } from '@/modules/auth/types/auth.types';
import { Alert, Button } from '@/modules/design-system';

import type { ForgotPasswordFormProps } from '@/modules/auth/types/components.types';

function getRateLimitRetrySeconds(error: unknown): number | undefined {
  if (!isAxiosError<StrapiErrorBody>(error)) return undefined;
  const retryAfterSeconds = error.response?.data?.error?.details?.retryAfterSeconds;
  return typeof retryAfterSeconds === 'number' &&
    Number.isFinite(retryAfterSeconds) &&
    retryAfterSeconds > 0
    ? retryAfterSeconds
    : undefined;
}

// Request state of the forgot-password card (design 'forgot' scenario): title +
// helper copy, email field, primary submit. Success is enumeration-safe — the
// parent swaps to the sent state for ANY accepted email; an initial-send 429
// lands on the sent state with its rate-limit strip instead of a form error.
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
        if (key === 'tooManyRequests') {
          onSent(values.email, {
            rateLimited: true,
            retrySeconds: getRateLimitRetrySeconds(error),
          });
        } else {
          setFormError(key);
        }
        toast.error(t(key));
      },
    });
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-auth-title font-bold text-foreground">{t('portal.forgotTitle')}</h1>
        <p className="text-body-md text-muted-foreground">{t('portal.forgotSubtitle')}</p>
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
