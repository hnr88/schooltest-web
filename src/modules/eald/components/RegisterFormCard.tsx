'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { cn } from '@/lib/utils';
import { Button } from '@/modules/design-system';
import { RegisterFieldWrapper } from '@/modules/eald/components/RegisterFieldWrapper';
import { ROLE_KEYS, STUDENT_KEYS } from '@/modules/eald/constants/components.constants';
import { registerSchema } from '@/modules/eald/schemas/register.schema';

import type { RegisterInput } from '@/modules/eald/schemas/register.schema';
import type { RegisterFormCardProps } from '@/modules/eald/types/components.types';

function RegisterFormCard({ t, onSuccess }: RegisterFormCardProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', school: '', role: '', email: '', students: '' },
  });

  function onValid(_data: RegisterInput) {
    onSuccess();
  }

  const fieldLabel = 'text-xs font-bold tracking-eyebrow text-slate-400 uppercase';
  const fieldBase = cn(
    'h-11 w-full rounded-xl border bg-transparent px-3.5',
    'text-body-md text-foreground placeholder:text-slate-400',
    'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
  );

  return (
    <div className="rounded-3xl border border-border bg-background p-8 shadow-sm sm:p-10">
      <h3 className="text-2xl font-bold tracking-tight text-foreground">
        {t('home.register.formTitle')}
      </h3>
      <p className="mt-2 text-body-md text-body">{t('home.register.formSubtitle')}</p>

      <form onSubmit={handleSubmit(onValid)} className="mt-6 flex flex-col gap-3.5">
        <RegisterFieldWrapper label={t('home.register.nameLabel')} error={errors.name?.message} t={t}>
          <input
            {...register('name')}
            type="text"
            placeholder={t('home.register.namePlaceholder')}
            className={cn(fieldBase, errors.name ? 'border-red-500' : 'border-slate-300')}
          />
        </RegisterFieldWrapper>

        <RegisterFieldWrapper label={t('home.register.schoolLabel')} error={errors.school?.message} t={t}>
          <input
            {...register('school')}
            type="text"
            placeholder={t('home.register.schoolPlaceholder')}
            className={cn(fieldBase, errors.school ? 'border-red-500' : 'border-slate-300')}
          />
        </RegisterFieldWrapper>

        <RegisterFieldWrapper label={t('home.register.roleLabel')} error={errors.role?.message} t={t}>
          <select
            {...register('role')}
            className={cn(fieldBase, errors.role ? 'border-red-500' : 'border-slate-300')}
          >
            <option value="">{t('home.register.selectPlaceholder')}</option>
            {ROLE_KEYS.map((key) => (
              <option key={key} value={t(key)}>{t(key)}</option>
            ))}
          </select>
        </RegisterFieldWrapper>

        <RegisterFieldWrapper label={t('home.register.emailLabel')} error={errors.email?.message} t={t}>
          <input
            {...register('email')}
            type="email"
            placeholder={t('home.register.emailPlaceholder')}
            className={cn(fieldBase, errors.email ? 'border-red-500' : 'border-slate-300')}
          />
        </RegisterFieldWrapper>

        <RegisterFieldWrapper label={t('home.register.studentsLabel')} error={errors.students?.message} t={t}>
          <select
            {...register('students')}
            className={cn(fieldBase, errors.students ? 'border-red-500' : 'border-slate-300')}
          >
            <option value="">{t('home.register.selectPlaceholder')}</option>
            {STUDENT_KEYS.map((key) => (
              <option key={key} value={t(key)}>{t(key)}</option>
            ))}
          </select>
        </RegisterFieldWrapper>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-1.5 h-12 w-full rounded-xl shadow-primary-glow"
        >
          {t('home.register.submitButton')}
        </Button>
      </form>
      <p className="mt-3.5 text-meta text-slate-400">{t('home.register.privacyNote')}</p>
    </div>
  );
}

export { RegisterFormCard };
