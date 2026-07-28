'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Button, Container, Eyebrow } from '@/modules/design-system';
import { registerSchema } from '@/modules/eald/schemas/register.schema';
import type { RegisterInput } from '@/modules/eald/schemas/register.schema';

const BENEFITS = [
  'home.register.benefitEarlyAccess',
  'home.register.benefitDirectInput',
  'home.register.benefitFoundingTerms',
] as const;

const ROLE_KEYS = [
  'home.register.roleCoordinator',
  'home.register.roleHod',
  'home.register.roleTeacher',
  'home.register.rolePrincipal',
  'home.register.roleOther',
] as const;

const STUDENT_KEYS = [
  'home.register.students1to20',
  'home.register.students21to50',
  'home.register.students51to100',
  'home.register.students100plus',
] as const;

function RegisterSection() {
  const t = useTranslations('Eald');
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="register" data-slot="register" className="scroll-mt-24 py-16 sm:py-20">
      <Container className="max-w-eald">
        <div className="grid items-stretch gap-6 lg:grid-cols-2">
          <FoundingCard t={t} />
          {submitted ? (
            <SuccessCard t={t} />
          ) : (
            <FormCard t={t} onSuccess={() => setSubmitted(true)} />
          )}
        </div>
      </Container>
    </section>
  );
}

function FoundingCard({ t }: { t: ReturnType<typeof useTranslations<'Eald'>> }) {
  return (
    <div className="relative flex flex-col justify-center overflow-hidden rounded-3xl bg-navy-900 p-10 sm:p-12">
      <div className="absolute inset-0 bg-gradient-to-br from-navy-900/95 to-navy-900/90" />
      <div className="relative">
        <Eyebrow tone="teal">{t('home.register.foundingEyebrow')}</Eyebrow>
        <h2 className="mt-3 text-h2 font-bold text-balance text-white">
          {t('home.register.foundingTitle')}
        </h2>
        <p className="mt-3 text-body-md leading-relaxed text-navy-muted">
          {t('home.register.foundingBody')}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {BENEFITS.map((key) => (
            <span key={key} className="flex items-center gap-2.5 text-body-md text-blue-200">
              <Check className="size-4 shrink-0 text-teal-400" strokeWidth={2.6} />
              {t(key)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function FormCard({
  t,
  onSuccess,
}: {
  t: ReturnType<typeof useTranslations<'Eald'>>;
  onSuccess: () => void;
}) {
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
        <FieldWrapper label={t('home.register.nameLabel')} error={errors.name?.message} t={t}>
          <input
            {...register('name')}
            type="text"
            placeholder={t('home.register.namePlaceholder')}
            className={cn(fieldBase, errors.name ? 'border-red-500' : 'border-slate-300')}
          />
        </FieldWrapper>

        <FieldWrapper label={t('home.register.schoolLabel')} error={errors.school?.message} t={t}>
          <input
            {...register('school')}
            type="text"
            placeholder={t('home.register.schoolPlaceholder')}
            className={cn(fieldBase, errors.school ? 'border-red-500' : 'border-slate-300')}
          />
        </FieldWrapper>

        <FieldWrapper label={t('home.register.roleLabel')} error={errors.role?.message} t={t}>
          <select
            {...register('role')}
            className={cn(fieldBase, errors.role ? 'border-red-500' : 'border-slate-300')}
          >
            <option value="">{t('home.register.selectPlaceholder')}</option>
            {ROLE_KEYS.map((key) => (
              <option key={key} value={t(key)}>{t(key)}</option>
            ))}
          </select>
        </FieldWrapper>

        <FieldWrapper label={t('home.register.emailLabel')} error={errors.email?.message} t={t}>
          <input
            {...register('email')}
            type="email"
            placeholder={t('home.register.emailPlaceholder')}
            className={cn(fieldBase, errors.email ? 'border-red-500' : 'border-slate-300')}
          />
        </FieldWrapper>

        <FieldWrapper label={t('home.register.studentsLabel')} error={errors.students?.message} t={t}>
          <select
            {...register('students')}
            className={cn(fieldBase, errors.students ? 'border-red-500' : 'border-slate-300')}
          >
            <option value="">{t('home.register.selectPlaceholder')}</option>
            {STUDENT_KEYS.map((key) => (
              <option key={key} value={t(key)}>{t(key)}</option>
            ))}
          </select>
        </FieldWrapper>

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

function FieldWrapper({
  label,
  error,
  t,
  children,
}: {
  label: string;
  error: string | undefined;
  t: ReturnType<typeof useTranslations<'Eald'>>;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold tracking-eyebrow text-slate-400 uppercase">{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-red-500" role="alert">
          {t(`home.register.${error}`)}
        </span>
      ) : null}
    </label>
  );
}

function SuccessCard({ t }: { t: ReturnType<typeof useTranslations<'Eald'>> }) {
  return (
    <div className="flex rounded-3xl border border-border bg-background p-8 shadow-sm sm:p-10">
      <div className="my-auto" role="status">
        <span className="inline-grid size-11 place-items-center rounded-full bg-teal-50">
          <Check className="size-5 text-teal-700" strokeWidth={2.8} />
        </span>
        <p className="mt-4 text-2xl font-bold text-foreground">
          {t('home.register.successTitle')}
        </p>
        <p className="mt-2 text-body-md text-body">
          {t('home.register.successBody')}
        </p>
      </div>
    </div>
  );
}

export { RegisterSection };
