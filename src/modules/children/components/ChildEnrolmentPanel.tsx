'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { GENDER_VALUES } from '@/modules/student-wizard';
import { ChildFactList } from '@/modules/children/components/ChildFactList';
import { getEnrolmentFacts } from '@/modules/children/lib/child-profile-facts';
import { getTargetEntry } from '@/modules/children/lib/student-display';
import type { StudentDetail } from '@/modules/children/types/children.types';

function isGender(value: string | null): value is (typeof GENDER_VALUES)[number] {
  return value !== null && (GENDER_VALUES as readonly string[]).includes(value);
}

// Canonical detail-rail record panel. Every row is a field GET
// /api/my/students/:documentId really returns for THIS child; anything the API
// left null is filtered out, and a child with nothing but a name gets the honest
// sentence instead of a list of dashes.
export function ChildEnrolmentPanel({ detail }: { detail: StudentDetail }) {
  const t = useTranslations('Children');
  const tWizard = useTranslations('StudentWizard');
  const format = useFormatter();

  const facts = getEnrolmentFacts(detail, {
    formatYear: (year) => tWizard('education.yearOption', { n: year }),
    yearLevel: t('yearLevel'),
    dateOfBirth: tWizard('personal.dateOfBirth'),
    gender: tWizard('personal.gender.label'),
    genderValue: isGender(detail.gender) ? tWizard(`personal.gender.${detail.gender}`) : null,
    nationality: t('nationality'),
    currentSchool: tWizard('education.currentSchool'),
    targetEntry: t('targetEntry'),
    signInEmail: t('signInEmail'),
    addedOn: t('addedOn'),
    born: detail.date_of_birth
      ? format.dateTime(new Date(`${detail.date_of_birth}T00:00:00`), { dateStyle: 'long' })
      : null,
    added: format.dateTime(new Date(detail.createdAt), { dateStyle: 'medium' }),
    targetEntryValue: getTargetEntry(detail),
  }).filter((fact) => fact.value !== null);

  return (
    <section
      data-slot="child-enrolment-panel"
      aria-labelledby="child-enrolment-title"
      className="flex flex-col gap-3 rounded-panel border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <h2 id="child-enrolment-title" className="text-panel-title font-semibold text-foreground">
        {t('enrolmentHeading')}
      </h2>
      {facts.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">{t('enrolmentEmpty')}</p>
      ) : (
        <ChildFactList facts={facts} />
      )}
    </section>
  );
}
