'use client';

import { useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';

import {
  Input,
  NativeSelect,
  NativeSelectOption,
  OPS_CONTROL_CLASS,
  OpsFieldShell,
} from '@/modules/design-system';
import {
  ACARA_PHASE_OPTIONS,
  FIRST_LANGUAGE_OPTIONS,
} from '@/modules/school-students/constants/student-picklists.constants';
import type { SchoolStudentFormValues } from '@/modules/school-students/schemas/school-student.schema';

import type { StudentEaldFieldsProps } from '@/modules/school-students/types/components.types';

// The design's 48px modal select; NativeSelect renders its classes on the
// wrapper, so the control itself is reached with a descendant variant.
const SELECT_CLASS =
  'w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:border-[1.5px] [&_select]:border-[#D8DFEA] [&_select]:bg-white [&_select]:px-3 [&_select]:text-sm [&_select]:text-[#0E2350] [&_select]:outline-none [&_select]:focus-visible:border-[#2563EB] [&_select]:focus-visible:ring-0';

// The school-relevant EAL/D background block (spec section 7) — the flat
// C-CHD-02 v2 fields. All optional; tri-state selects keep "Not set" as the
// blank/keep-current choice. The ACARA phase select renders for school_admin
// callers only (D-10): it never appears on a teacher-facing surface.
export function StudentEaldFields({ form, showAcaraPhase }: StudentEaldFieldsProps) {
  const t = useTranslations('SchoolStudents.form');
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <fieldset className="flex flex-col gap-4 rounded-[14px] border border-[#EEF1F6] p-4">
      <legend className="px-1 text-sm font-semibold text-foreground">{t('ealdTitle')}</legend>
      <p className="text-meta text-body">{t('ealdDescription')}</p>
      <OpsFieldShell id="student-first-language" label={t('firstLanguage')} errorText={errors.first_language?.message}>
        <NativeSelect id="student-first-language" className={SELECT_CLASS} {...register('first_language')}>
          <NativeSelectOption value="">{t('notSet')}</NativeSelectOption>
          {FIRST_LANGUAGE_OPTIONS.map((option) => (
            <NativeSelectOption key={option} value={option}>
              {t(`firstLanguageOption.${option}`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </OpsFieldShell>
      {showAcaraPhase ? (
        <OpsFieldShell
          id="student-acara-phase"
          label={t('acaraPhase')}
          helperText={t('acaraPhaseHint')}
          errorText={errors.acara_phase?.message}
        >
          <NativeSelect id="student-acara-phase" className={SELECT_CLASS} {...register('acara_phase')}>
            <NativeSelectOption value="">{t('notSet')}</NativeSelectOption>
            {ACARA_PHASE_OPTIONS.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {t(`acaraPhaseOption.${option}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </OpsFieldShell>
      ) : null}
      <OpsFieldShell
        id="student-other-languages"
        label={t('otherLanguages')}
        helperText={t('otherLanguagesHint')}
        errorText={errors.other_languages?.message}
      >
        <Input id="student-other-languages" autoComplete="off" className={OPS_CONTROL_CLASS} {...register('other_languages')} />
      </OpsFieldShell>
      <OpsFieldShell id="student-l1-literate" label={t('l1Literate')}>
        <NativeSelect id="student-l1-literate" className={SELECT_CLASS} {...register('l1_literate')}>
          <NativeSelectOption value="">{t('notSet')}</NativeSelectOption>
          <NativeSelectOption value="yes">{t('yes')}</NativeSelectOption>
          <NativeSelectOption value="no">{t('no')}</NativeSelectOption>
        </NativeSelect>
      </OpsFieldShell>
      <OpsFieldShell
        id="student-english-years"
        label={t('timeLearningEnglish')}
        errorText={errors.time_learning_english_yrs?.message}
      >
        <Input
          id="student-english-years"
          inputMode="decimal"
          autoComplete="off"
          {...register('time_learning_english_yrs')}
        />
      </OpsFieldShell>
      <OpsFieldShell
        id="student-australia-months"
        label={t('timeInAustralia')}
        errorText={errors.time_in_australia_months?.message}
      >
        <Input
          id="student-australia-months"
          inputMode="numeric"
          autoComplete="off"
          {...register('time_in_australia_months')}
        />
      </OpsFieldShell>
      <OpsFieldShell id="student-prior-schooling" label={t('priorSchoolingInterrupted')}>
        <NativeSelect
          id="student-prior-schooling"
          className={SELECT_CLASS}
          {...register('prior_schooling_interrupted')}
        >
          <NativeSelectOption value="">{t('notSet')}</NativeSelectOption>
          <NativeSelectOption value="yes">{t('yes')}</NativeSelectOption>
          <NativeSelectOption value="no">{t('no')}</NativeSelectOption>
        </NativeSelect>
      </OpsFieldShell>
    </fieldset>
  );
}
