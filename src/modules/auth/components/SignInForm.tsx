'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Link, useRouter } from '@/i18n/navigation';
import { PasswordField } from '@/modules/auth/components/PasswordField';
import { TextField } from '@/modules/auth/components/TextField';
import { classifySignInError } from '@/modules/auth/lib/classify-sign-in-error';
import { useLoginMutation } from '@/modules/auth/queries/use-login.mutation';
import { signInSchema, type SignInInput } from '@/modules/auth/schemas/sign-in.schema';
import type { SignInErrorKey } from '@/modules/auth/types/auth.types';
import { Alert, Button } from '@/modules/design-system';

export function SignInForm() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const login = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<SignInErrorKey | null>(null);
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
        onError: (error) => setFormError(classifySignInError(error)),
      },
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError ? (
        <Alert
          variant={formError === 'notConfirmedError' ? 'warning' : 'error'}
          title={t(formError)}
        >
          {null}
        </Alert>
      ) : null}
      <TextField
        id="sign-in-email"
        type="email"
        label={t('emailLabel')}
        placeholder={t('emailPlaceholder')}
        autoComplete="email"
        error={errors.email?.message ? t(errors.email.message) : undefined}
        registration={register('email')}
      />
      <PasswordField
        id="sign-in-password"
        label={t('passwordLabel')}
        placeholder={t('passwordPlaceholder')}
        autoComplete="current-password"
        visible={showPassword}
        onToggleVisible={() => setShowPassword((current) => !current)}
        toggleLabel={t(showPassword ? 'hidePassword' : 'showPassword')}
        error={errors.password?.message ? t(errors.password.message) : undefined}
        registration={register('password')}
        labelAccessory={
          <Link
            href="/forgot-password"
            className="rounded-sm text-caption font-semibold text-primary transition-colors duration-150 hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {t('forgotPasswordLink')}
          </Link>
        }
      />
      <Button
        type="submit"
        size="xl"
        loading={login.isPending}
        className="mt-1 w-full rounded-lg shadow-sm transition-[transform,background-color,box-shadow] duration-150 ease-out-expo hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        {login.isPending ? t('signingIn') : t('signInButton')}
      </Button>
    </form>
  );
}
