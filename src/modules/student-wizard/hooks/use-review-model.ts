'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';

import { useWizardMediaStore } from '@/modules/student-wizard/stores/use-wizard-media-store';
import type {
  ReviewModel,
  StudentWizardValues,
} from '@/modules/student-wizard/types/student-wizard.types';

function text(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function join(segments: (string | null)[], separator = ' · '): string | null {
  const kept = segments.filter((segment): segment is string => Boolean(segment));
  return kept.length > 0 ? kept.join(separator) : null;
}

// Step-5 summary table (spec 03 §2.8): four rows — Personal, Education, Guardian,
// Media — each a ` · `-joined sentence built from the live RHF values, with every
// enum resolved to its localized label. Nothing is composed that was not entered:
// a missing segment is dropped from the join, and a row with no segments at all
// returns null so the table prints the em-dash rather than inventing a fact.
export function useReviewModel(): ReviewModel {
  const t = useTranslations('StudentWizard');
  const format = useFormatter();
  const { control } = useFormContext<StudentWizardValues>();
  const values = useWatch({ control }) as StudentWizardValues;
  const photo = useWizardMediaStore((state) => state.media.photo);
  const voice = useWizardMediaStore((state) => state.media.voice_intro);

  const born = values.date_of_birth
    ? t('review.born', {
        date: format.dateTime(new Date(`${values.date_of_birth}T00:00:00`), { dateStyle: 'medium' }),
      })
    : null;
  const currentYearLevel = values.current_year_level
    ? values.current_year_level === 'Prep'
      ? t('education.prep')
      : t('education.yearOption', { n: Number(values.current_year_level.slice(5)) })
    : null;
  const band =
    typeof values.year_level === 'number' ? t('review.testingBand', { n: values.year_level }) : null;
  const entry =
    values.target_entry_term && values.target_entry_year
      ? t('review.entry', {
          term: t('education.term', { n: Number(values.target_entry_term.slice(5)) }),
          year: values.target_entry_year,
        })
      : null;
  const channel = values.preferred_contact_channel
    ? t(`guardian.channel.${values.preferred_contact_channel}`)
    : null;

  return {
    rows: [
      {
        label: t('steps.personal.label'),
        value: join([
          join([text(values.given_name), text(values.family_name)], ' '),
          born,
          text(values.nationality),
        ]),
      },
      {
        label: t('steps.education.label'),
        value: join([text(values.current_school), currentYearLevel, band, entry]),
      },
      {
        label: t('steps.guardian.label'),
        value: join([text(values.parent_guardian_name), text(values.parent_guardian_phone), channel]),
      },
      {
        label: t('steps.media.label'),
        value: join([
          photo ? t('review.photoAdded') : t('review.noPhoto'),
          voice ? t('review.voiceAdded') : t('review.noVoice'),
        ]),
      },
    ],
  };
}
