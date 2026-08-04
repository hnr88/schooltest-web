'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { Alert, Button } from '@/modules/design-system';
import { OnboardingTextField } from '@/modules/school-onboarding/components/OnboardingTextField';
import {
  createAdminAccountSchema,
  type AdminAccountValues,
} from '@/modules/school-onboarding/schemas/school-onboarding.schema';
import type { AdminDetails } from '@/modules/school-onboarding/types/school-onboarding.types';

import type { AdminAccountStepProps } from '@/modules/school-onboarding/types/components.types';

// Step 4: the first school_admin account. The password never enters the
// wizard store — it goes straight from this form into the C-ONB-03 body.
export function AdminAccountStep({
  defaultValues,
  serverError,
  pending,
  onSubmit,
  onBack,
}: AdminAccountStepProps) {
  const t = useTranslations('SchoolOnboarding.admin');
  const tv = useTranslations('SchoolOnboarding.validation');
  const schema = useMemo(() => createAdminAccountSchema(tv), [tv]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminDetails & { password: string }, unknown, AdminAccountValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...defaultValues, password: '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{t('title')}</h2>
        <p className="mt-1 text-body-sm text-muted-foreground">{t('description')}</p>
      </div>
      {serverError ? (
        <Alert variant="error" title={serverError}>
          {null}
        </Alert>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <OnboardingTextField
          id="onb-admin-first-name"
          label={t('firstName')}
          autoComplete="given-name"
          error={errors.first_name?.message}
          registration={register('first_name')}
        />
        <OnboardingTextField
          id="onb-admin-last-name"
          label={t('lastName')}
          autoComplete="family-name"
          error={errors.last_name?.message}
          registration={register('last_name')}
        />
      </div>
      <OnboardingTextField
        id="onb-admin-email"
        label={t('email')}
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        registration={register('email')}
      />
      <OnboardingTextField
        id="onb-admin-password"
        label={t('password')}
        type="password"
        autoComplete="new-password"
        helperText={t('passwordHint')}
        error={errors.password?.message}
        registration={register('password')}
      />
      <div className="mt-2 flex justify-between">
        <Button type="button" variant="ghost" size="lg" onClick={onBack} disabled={pending}>
          {t('back')}
        </Button>
        <Button type="submit" size="lg" loading={pending}>
          {pending ? t('submitting') : t('submit')}
        </Button>
      </div>
    </form>
  );
}
