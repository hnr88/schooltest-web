'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import type { SchoolOnboardingPayload } from '@/modules/school-onboarding/types/school-onboarding.types';

import type { ReviewStepProps } from '@/modules/school-onboarding/types/components.types';

// Step 3: read-only review of everything the wizard will submit (spec section
// 4: "Review and confirm all submitted information").
export function ReviewStep({ payload, onConfirm, onBack }: ReviewStepProps) {
  const t = useTranslations('SchoolOnboarding');
  const { school, teachers } = payload;

  const schoolRows: Array<[string, string]> = [
    [t('school.name'), school.name],
    [t('school.suburb'), school.suburb],
    [t('school.state'), school.state],
    [t('school.postcode'), school.postcode],
    [t('school.sector'), school.sector ? t(`school.sectors.${school.sector}`) : ''],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{t('review.title')}</h2>
        <p className="mt-1 text-body-sm text-muted-foreground">{t('review.description')}</p>
      </div>
      <section aria-labelledby="onb-review-school">
        <h3
          id="onb-review-school"
          className="text-body-sm font-semibold text-secondary-foreground"
        >
          {t('review.schoolHeading')}
        </h3>
        <dl className="mt-2 divide-y divide-border rounded-lg border border-border">
          {schoolRows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 px-4 py-2.5">
              <dt className="text-body-sm text-muted-foreground">{label}</dt>
              <dd className="text-body-sm font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-labelledby="onb-review-teachers">
        <h3
          id="onb-review-teachers"
          className="text-body-sm font-semibold text-secondary-foreground"
        >
          {t('review.teachersHeading')}
        </h3>
        {teachers.length === 0 ? (
          <p className="mt-2 rounded-lg bg-muted px-4 py-3 text-body-sm text-muted-foreground">
            {t('review.noTeachers')}
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
            {teachers.map((teacher) => (
              <li key={teacher.email} className="flex flex-col gap-0.5 px-4 py-2.5">
                <span className="text-body-sm font-medium text-foreground">
                  {teacher.first_name} {teacher.last_name}
                </span>
                <span className="text-body-sm text-muted-foreground">
                  {teacher.email} · {t(`teachers.roles.${teacher.role}`)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="mt-2 flex justify-between">
        <Button type="button" variant="ghost" size="lg" onClick={onBack}>
          {t('review.back')}
        </Button>
        <Button type="button" size="lg" onClick={onConfirm}>
          {t('review.confirm')}
        </Button>
      </div>
    </div>
  );
}
