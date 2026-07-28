'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Button, Container, Eyebrow } from '@/modules/design-system';

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section id="register" data-slot="register" className="scroll-mt-24 py-16 sm:py-20">
      <Container className="max-w-eald">
        <div className="grid items-stretch gap-5 lg:grid-cols-2">
          <FoundingCard t={t} />
          {submitted ? <SuccessCard t={t} /> : <FormCard t={t} onSubmit={handleSubmit} />}
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
  onSubmit,
}: {
  t: ReturnType<typeof useTranslations<'Eald'>>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const fieldLabel = 'text-xs font-bold tracking-eyebrow text-slate-400 uppercase';
  const fieldInput = cn(
    'h-11 w-full rounded-xl border border-slate-300 bg-transparent px-3.5',
    'text-body-md text-foreground placeholder:text-slate-400',
    'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
  );

  return (
    <div className="rounded-3xl border border-border bg-background p-8 shadow-sm sm:p-10">
      <h3 className="text-2xl font-bold tracking-tight text-foreground">
        {t('home.register.formTitle')}
      </h3>
      <p className="mt-2 text-body-md text-body">{t('home.register.formSubtitle')}</p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5">
          <span className={fieldLabel}>{t('home.register.nameLabel')}</span>
          <input
            type="text"
            required
            placeholder={t('home.register.namePlaceholder')}
            className={fieldInput}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={fieldLabel}>{t('home.register.schoolLabel')}</span>
          <input
            type="text"
            required
            placeholder={t('home.register.schoolPlaceholder')}
            className={fieldInput}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={fieldLabel}>{t('home.register.roleLabel')}</span>
          <select required className={fieldInput}>
            <option value="">{t('home.register.selectPlaceholder')}</option>
            {ROLE_KEYS.map((key) => (
              <option key={key} value={t(key)}>{t(key)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={fieldLabel}>{t('home.register.emailLabel')}</span>
          <input
            type="email"
            required
            placeholder={t('home.register.emailPlaceholder')}
            className={fieldInput}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={fieldLabel}>{t('home.register.studentsLabel')}</span>
          <select required className={fieldInput}>
            <option value="">{t('home.register.selectPlaceholder')}</option>
            {STUDENT_KEYS.map((key) => (
              <option key={key} value={t(key)}>{t(key)}</option>
            ))}
          </select>
        </label>
        <Button type="submit" className="mt-1.5 h-12 w-full rounded-xl shadow-primary-glow">
          {t('home.register.submitButton')}
        </Button>
      </form>
      <p className="mt-3.5 text-meta text-slate-400">{t('home.register.privacyNote')}</p>
    </div>
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
