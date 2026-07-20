'use client';

import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';

import type { ReviewSectionModel, StudentWizardValues } from '@/modules/student-wizard/types/student-wizard.types';

function text(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

// Builds the Step 5 text sections (Personal/Education/Guardian) from the live RHF
// values, reusing the step namespaces for labels and resolving enum values to
// their localized display strings. Media (thumb/audio) is rendered separately in
// StepReview from the wizard media store. Empty optionals stay `null` → "—".
export function useReviewModel(): ReviewSectionModel[] {
  const t = useTranslations('StudentWizard');
  const { control } = useFormContext<StudentWizardValues>();
  const values = useWatch({ control }) as StudentWizardValues;

  const gender = values.gender ? t(`personal.gender.${values.gender}`) : null;
  const currentYearLevel = values.current_year_level
    ? values.current_year_level === 'Prep'
      ? t('education.prep')
      : t('education.yearOption', { n: Number(values.current_year_level.slice(5)) })
    : null;
  const yearLevel =
    typeof values.year_level === 'number' ? t('education.yearOption', { n: values.year_level }) : null;
  const term = values.target_entry_term
    ? t('education.term', { n: Number(values.target_entry_term.slice(5)) })
    : null;
  const channel = values.preferred_contact_channel
    ? t(`guardian.channel.${values.preferred_contact_channel}`)
    : null;

  return [
    {
      id: 'personal',
      title: t('review.section.personal'),
      step: 0,
      rows: [
        { label: t('personal.givenName'), value: text(values.given_name) },
        { label: t('personal.familyName'), value: text(values.family_name) },
        { label: t('personal.email'), value: text(values.email) },
        { label: t('personal.dateOfBirth'), value: text(values.date_of_birth) },
        { label: t('personal.gender.label'), value: gender },
        { label: t('personal.nationality'), value: text(values.nationality) },
        { label: t('personal.passportNumber'), value: text(values.passport_number) },
      ],
    },
    {
      id: 'education',
      title: t('review.section.education'),
      step: 1,
      rows: [
        { label: t('education.currentSchool'), value: text(values.current_school) },
        { label: t('education.currentYearLevel'), value: currentYearLevel },
        { label: t('education.yearLevel'), value: yearLevel },
        { label: t('education.targetEntryYear'), value: text(values.target_entry_year) },
        { label: t('education.targetEntryTerm'), value: term },
      ],
    },
    {
      id: 'guardian',
      title: t('review.section.guardian'),
      step: 2,
      rows: [
        { label: t('guardian.name'), value: text(values.parent_guardian_name) },
        { label: t('guardian.phone'), value: text(values.parent_guardian_phone) },
        { label: t('guardian.email'), value: text(values.parent_guardian_email) },
        { label: t('guardian.wechat'), value: text(values.parent_guardian_wechat) },
        { label: t('guardian.preferredContact'), value: channel },
      ],
    },
  ];
}
