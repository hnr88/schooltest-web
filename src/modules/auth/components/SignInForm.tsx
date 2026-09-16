'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Link, useRouter } from '@/i18n/navigation';
import { PasswordField } from '@/modules/auth/components/PasswordField';
import { TextField } from '@/modules/auth/components/TextField';
import { classifySignInError } from '@/modules/auth/lib/classify-sign-in-error';
import { useLoginMutation } from '@/modules/auth/queries/use-login.mutation';
import { signInSchema, type SignInInput } from '@/modules/auth/schemas/sign-in.schema';
import { Alert, Button } from '@/modules/design-system';

import type { SignInFailure } from '@/modules/auth/types/auth.types';
import type { SignInFormProps } from '@/modules/auth/types/components.types';

const ERROR_ALERT_CLASS = 'flex gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-[18px] py-4';

export function SignInForm({ onLocked, returnTo }: SignInFormProps) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const login = useLoginMutation();
  const [failure, setFailure] = useState<SignInFailure | null>(null);
  const { register, handleSubmit, clearErrors, setError, formState: { errors } } =
    useForm<SignInInput>({ resolver: zodResolver(signInSchema), defaultValues: { email: '', password: '' } });

  // FLEETFIX-D7: the login button only visually disables once `login.isPending`
  // flips — which happens a re-render AFTER the async zod resolver has run — so
  // a double-click inside that window fired two POST /api/auth/local. This
  // synchronous ref is checked and set on the raw DOM submit event, before any
  // await, so exactly one request can ever be in flight. It is released on
  // every error path (validation failure included) so the button is retryable,
  // and deliberately held on success: navigation unmounts the form, and
  // releasing it would reopen the double-fire window during the redirect.
  const submitInFlightRef = useRef(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (submitInFlightRef.current) {
      event.preventDefault();
      return;
    }
    submitInFlightRef.current = true;
    handleSubmit(
      (values) => {
        setFailure(null);
        clearErrors('password');
        login.mutate(
          { identifier: values.email, password: values.password },
          {
            onSuccess: () => {
              toast.success(t('signedIn'));
              // NIGHT-2 AUTH-018: return the visitor to the page the guard bounced
              // them from (sanitized in SignInCard — always an in-app path).
              router.push(returnTo ?? '/dashboard');
            },
            onError: (error) => {
              submitInFlightRef.current = false;
              const nextFailure = classifySignInError(error);
              if (nextFailure.lockout) {
                onLocked(nextFailure.lockout);
                toast.error(t('accountLockedTitle'));
                return;
              }
              setFailure(nextFailure);
              if (nextFailure.attemptsRemaining !== undefined) {
                setError('password', { type: 'server', message: 'incorrectPassword' });
              }
              toast.error(
                t(nextFailure.attemptsRemaining !== undefined ? 'loginErrorTitle' : nextFailure.key),
              );
            },
          },
        );
      },
      // Invalid per the schema — the mutation never started, so let the user retry.
      () => {
        submitInFlightRef.current = false;
      },
    )(event);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {failure && failure.attemptsRemaining !== undefined ? (
        <div role="alert" data-slot="alert" className={ERROR_ALERT_CLASS}>
          <CircleAlert aria-hidden="true" strokeWidth={2.2} className="mt-px size-[18px] shrink-0 text-[#B91C1C]" />
          <div>
            <p className="text-[14.5px] font-bold text-[#7F1D1D]">{t('portal.errorTitle')}</p>
            <p className="mt-1 text-sm leading-[1.6] text-[#991B1B]">
              {t('portal.errorBody')} {t('portal.errorAttempts', { count: failure.attemptsRemaining })}
            </p>
          </div>
        </div>
      ) : failure ? (
        <Alert variant={failure.key === 'notConfirmedError' ? 'warning' : 'error'} title={t(failure.key)}>
          {null}
        </Alert>
      ) : null}
      <TextField
        id="sign-in-email"
        type="email"
        label={t('portal.emailLabel')}
        placeholder={t('portal.emailPlaceholder')}
        autoComplete="username"
        error={errors.email?.message ? t(errors.email.message) : undefined}
        registration={register('email')}
      />
      <PasswordField
        id="sign-in-password"
        label={t('portal.passwordLabel')}
        placeholder={t('portal.passwordPlaceholder')}
        autoComplete="current-password"
        visible={false}
        onToggleVisible={() => {}}
        toggleLabel=""
        hideToggle
        error={errors.password?.message ? t(errors.password.message) : undefined}
        registration={register('password')}
        labelAccessory={
          <Link
            href="/forgot-password"
            className="inline-flex min-h-11 items-center rounded-sm px-1 text-[12.5px] font-semibold text-primary transition-colors duration-150 hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {t('portal.forgotLink')}
          </Link>
        }
      />
      <Button
        type="submit"
        size="xl"
        loading={login.isPending}
        className="mt-1 w-full rounded-lg shadow-sm transition-[transform,background-color,box-shadow] duration-150 ease-out-expo hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        {login.isPending ? t('portal.loggingIn') : t('portal.loginButton')}
      </Button>
    </form>
  );
}
