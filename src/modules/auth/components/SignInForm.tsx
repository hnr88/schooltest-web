'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useLoginMutation } from '@/modules/auth/queries/use-login.mutation';
import { signInSchema, type SignInInput } from '@/modules/auth/schemas/sign-in.schema';
import { Alert, Button, Input, Label } from '@/modules/design-system';

type FormErrorKey = 'loginError' | 'offlineError' | 'serverError';

// Status-only mapping (C-AUTH-LOGIN): 400 covers unknown email AND wrong
// password with one message, no response means offline, anything else is a
// server fault. Raw Strapi error strings are never rendered.
function classifyError(error: unknown): FormErrorKey {
  if (isAxiosError(error)) {
    if (error.response?.status === 400) return 'loginError';
    if (error.response === undefined) return 'offlineError';
  }
  return 'serverError';
}

export function SignInForm() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const login = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<FormErrorKey | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    login.mutate(
      { identifier: values.email, password: values.password },
      {
        onSuccess: () => router.push('/dashboard'),
        onError: (error) => setFormError(classifyError(error)),
      },
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError ? (
        <Alert variant="error" title={t(formError)}>
          {null}
        </Alert>
      ) : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="sign-in-email">{t('emailLabel')}</Label>
        <Input
          id="sign-in-email"
          type="email"
          autoComplete="email"
          placeholder={t('emailPlaceholder')}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'sign-in-email-error' : undefined}
          className="h-11"
          {...register('email')}
        />
        {errors.email?.message ? (
          <p id="sign-in-email-error" className="text-sm text-destructive">
            {t(errors.email.message)}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sign-in-password">{t('passwordLabel')}</Label>
        <div className="relative">
          <Input
            id="sign-in-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder={t('passwordPlaceholder')}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? 'sign-in-password-error' : undefined}
            className="h-11 pr-12"
            {...register('password')}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowPassword((current) => !current)}
            aria-pressed={showPassword}
            aria-label={t(showPassword ? 'hidePassword' : 'showPassword')}
            className="absolute top-0 right-0 size-11 text-muted-foreground"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </Button>
        </div>
        {errors.password?.message ? (
          <p id="sign-in-password-error" className="text-sm text-destructive">
            {t(errors.password.message)}
          </p>
        ) : null}
      </div>
      <Button type="submit" size="lg" loading={login.isPending} className="mt-1 w-full">
        {login.isPending ? t('signingIn') : t('signInButton')}
      </Button>
    </form>
  );
}
