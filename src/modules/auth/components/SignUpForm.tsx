'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { PasswordField } from '@/modules/auth/components/PasswordField';
import { TextField } from '@/modules/auth/components/TextField';
import { useRegisterMutation } from '@/modules/auth/queries/use-register.mutation';
import { signUpSchema, type SignUpInput } from '@/modules/auth/schemas/sign-up.schema';
import { Alert, Button } from '@/modules/design-system';

type FormErrorKey = 'takenError' | 'offlineError' | 'registerError';

// Status-only mapping (C-AUTH-REGISTER): 400 covers taken email/username, no
// response means offline, anything else is a server fault. Raw Strapi error
// strings are never rendered.
function classifyError(error: unknown): FormErrorKey {
  if (isAxiosError(error)) {
    if (error.response?.status === 400) return 'takenError';
    if (error.response === undefined) return 'offlineError';
  }
  return 'registerError';
}

interface SignUpFormProps {
  onRegistered: (email: string) => void;
}

export function SignUpForm({ onRegistered }: SignUpFormProps) {
  const t = useTranslations('Auth');
  const signUp = useRegisterMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<FormErrorKey | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    signUp.mutate(
      { username: values.username, email: values.email, password: values.password },
      {
        // D-AUTH-1 (C-AUTH-REGISTER): register returns {user} with NO jwt —
        // the card swaps to the check-your-email state instead of navigating.
        onSuccess: () => onRegistered(values.email),
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
      <TextField
        id="sign-up-username"
        type="text"
        label={t('usernameLabel')}
        placeholder={t('usernamePlaceholder')}
        autoComplete="username"
        error={errors.username?.message ? t(errors.username.message) : undefined}
        registration={register('username')}
      />
      <TextField
        id="sign-up-email"
        type="email"
        label={t('emailLabel')}
        placeholder={t('emailPlaceholder')}
        autoComplete="email"
        error={errors.email?.message ? t(errors.email.message) : undefined}
        registration={register('email')}
      />
      {/* §1.2 row 4: password + confirm sit side by side from sm up. DOM order is
          unchanged, so a11y-auth.spec's focus order still holds. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordField
          id="sign-up-password"
          label={t('passwordLabel')}
          placeholder={t('passwordPlaceholder')}
          autoComplete="new-password"
          visible={showPassword}
          onToggleVisible={() => setShowPassword((current) => !current)}
          toggleLabel={t(showPassword ? 'hidePassword' : 'showPassword')}
          error={errors.password?.message ? t(errors.password.message) : undefined}
          registration={register('password')}
        />
        <PasswordField
          id="sign-up-confirm-password"
          label={t('confirmPasswordLabel')}
          placeholder={t('confirmPasswordPlaceholder')}
          autoComplete="new-password"
          visible={showConfirmPassword}
          onToggleVisible={() => setShowConfirmPassword((current) => !current)}
          toggleLabel={t(showConfirmPassword ? 'hideConfirmPassword' : 'showConfirmPassword')}
          error={errors.confirmPassword?.message ? t(errors.confirmPassword.message) : undefined}
          registration={register('confirmPassword')}
        />
      </div>
      <Button
        type="submit"
        size="xl"
        loading={signUp.isPending}
        className="mt-1 w-full rounded-lg shadow-sm transition-[transform,background-color,box-shadow] duration-150 ease-out-expo hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        {signUp.isPending ? t('signingUp') : t('signUpButton')}
      </Button>
    </form>
  );
}
