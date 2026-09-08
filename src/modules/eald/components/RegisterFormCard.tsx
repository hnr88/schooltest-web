'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/modules/design-system';
import { RegisterFieldWrapper } from '@/modules/eald/components/RegisterFieldWrapper';
import { ROLE_KEYS, STUDENT_KEYS } from '@/modules/eald/constants/components.constants';
import { usePilotRegisterMutation } from '@/modules/eald/queries/use-pilot-register.mutation';
import { registerSchema } from '@/modules/eald/schemas/register.schema';

import type { RegisterInput } from '@/modules/eald/schemas/register.schema';
import type { RegisterFormCardProps } from '@/modules/eald/types/components.types';

function RegisterFormCard({ t, onSuccess }: RegisterFormCardProps) {
  const pilotRegister = usePilotRegisterMutation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', school: '', role: '', email: '', students: '' },
  });
  function onValid(data: RegisterInput) {
    pilotRegister.mutate(data, { onSuccess: () => onSuccess() });
  }
  const fieldBase = cn(
    'h-11.5 w-full rounded-xl border bg-card px-3.5',
    'text-body-md text-foreground placeholder:text-slate-400',
    'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
  );

  const fieldProps = (name: keyof RegisterInput) => ({
    label: t(`home.register.${name}Label`),
    error: errors[name]?.message,
    t,
  });

  return (
    <div className="p-6 sm:p-7.5">
      <p className="text-body-md text-muted-foreground">{t('home.register.formSubtitle')}</p>

      <form noValidate onSubmit={handleSubmit(onValid)} className="mt-6 flex flex-col gap-4">
        <RegisterFieldWrapper {...fieldProps('name')}>
          <input
            {...register('name')}
            type="text"
            placeholder={t('home.register.namePlaceholder')}
            className={cn(fieldBase, errors.name ? 'border-red-500' : 'border-slate-300')}
          />
        </RegisterFieldWrapper>
        <RegisterFieldWrapper {...fieldProps('school')}>
          <input
            {...register('school')}
            type="text"
            placeholder={t('home.register.schoolPlaceholder')}
            className={cn(fieldBase, errors.school ? 'border-red-500' : 'border-slate-300')}
          />
        </RegisterFieldWrapper>
        <RegisterFieldWrapper {...fieldProps('role')}>
          <select
            {...register('role')}
            className={cn(fieldBase, errors.role ? 'border-red-500' : 'border-slate-300')}
          >
            <option value="">{t('home.register.selectPlaceholder')}</option>
            {ROLE_KEYS.map((key) => (
              <option key={key} value={t(key)}>
                {t(key)}
              </option>
            ))}
          </select>
        </RegisterFieldWrapper>
        <RegisterFieldWrapper {...fieldProps('email')}>
          <input
            {...register('email')}
            type="email"
            placeholder={t('home.register.emailPlaceholder')}
            className={cn(fieldBase, errors.email ? 'border-red-500' : 'border-slate-300')}
          />
        </RegisterFieldWrapper>
        <RegisterFieldWrapper {...fieldProps('students')}>
          <select
            {...register('students')}
            className={cn(fieldBase, errors.students ? 'border-red-500' : 'border-slate-300')}
          >
            <option value="">{t('home.register.selectPlaceholder')}</option>
            {STUDENT_KEYS.map((key) => (
              <option key={key} value={t(key)}>
                {t(key)}
              </option>
            ))}
          </select>
        </RegisterFieldWrapper>
        <Button
          type="submit"
          disabled={isSubmitting || pilotRegister.isPending}
          className="mt-1 h-12.5 w-full rounded-xl"
        >
          {t('home.register.submitButton')}
        </Button>
        {pilotRegister.isError && (
          <p role="alert" className="text-meta text-red-600">
            {t('home.register.errorBody')}
          </p>
        )}
      </form>
      <p className="mt-4 text-meta text-muted-foreground">
        {t('home.register.privacyNote')}{' '}
        <Link href="/privacy-policy" className="text-primary underline underline-offset-2">
          {t('home.register.privacyLinkLabel')}
        </Link>
      </p>
    </div>
  );
}

export { RegisterFormCard };
