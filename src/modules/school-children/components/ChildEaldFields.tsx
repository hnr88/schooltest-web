'use client';

import { useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';

import {
  FieldShell,
  Input,
  NativeSelect,
  NativeSelectOption,
} from '@/modules/design-system';
import {
  ACARA_PHASE_OPTIONS,
  FIRST_LANGUAGE_OPTIONS,
} from '@/modules/school-children/constants/child-picklists.constants';
import type { SchoolChildFormValues } from '@/modules/school-children/schemas/school-child.schema';

import type { ChildEaldFieldsProps } from '@/modules/school-children/types/components.types';

// The school-relevant EAL/D background block (spec section 7) — the flat
// C-CHD-02 v2 fields. All optional; tri-state selects keep "Not set" as the
// blank/keep-current choice. The ACARA phase select renders for school_admin
// callers only (D-10): it never appears on a teacher-facing surface.
export function ChildEaldFields({ form, showAcaraPhase }: ChildEaldFieldsProps) {
  const t = useTranslations('SchoolChildren.form');
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <fieldset className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <legend className="px-1 text-sm font-semibold text-foreground">{t('ealdTitle')}</legend>
      <p className="text-meta text-body">{t('ealdDescription')}</p>
      <FieldShell id="child-first-language" label={t('firstLanguage')} errorText={errors.first_language?.message}>
        <NativeSelect id="child-first-language" className="w-full" {...register('first_language')}>
          <NativeSelectOption value="">{t('notSet')}</NativeSelectOption>
          {FIRST_LANGUAGE_OPTIONS.map((option) => (
            <NativeSelectOption key={option} value={option}>
              {t(`firstLanguageOption.${option}`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FieldShell>
      {showAcaraPhase ? (
        <FieldShell
          id="child-acara-phase"
          label={t('acaraPhase')}
          helperText={t('acaraPhaseHint')}
          errorText={errors.acara_phase?.message}
        >
          <NativeSelect id="child-acara-phase" className="w-full" {...register('acara_phase')}>
            <NativeSelectOption value="">{t('notSet')}</NativeSelectOption>
            {ACARA_PHASE_OPTIONS.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {t(`acaraPhaseOption.${option}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FieldShell>
      ) : null}
      <FieldShell
        id="child-other-languages"
        label={t('otherLanguages')}
        helperText={t('otherLanguagesHint')}
        errorText={errors.other_languages?.message}
      >
        <Input id="child-other-languages" autoComplete="off" {...register('other_languages')} />
      </FieldShell>
      <FieldShell id="child-l1-literate" label={t('l1Literate')}>
        <NativeSelect id="child-l1-literate" className="w-full" {...register('l1_literate')}>
          <NativeSelectOption value="">{t('notSet')}</NativeSelectOption>
          <NativeSelectOption value="yes">{t('yes')}</NativeSelectOption>
          <NativeSelectOption value="no">{t('no')}</NativeSelectOption>
        </NativeSelect>
      </FieldShell>
      <FieldShell
        id="child-english-years"
        label={t('timeLearningEnglish')}
        errorText={errors.time_learning_english_yrs?.message}
      >
        <Input
          id="child-english-years"
          inputMode="decimal"
          autoComplete="off"
          {...register('time_learning_english_yrs')}
        />
      </FieldShell>
      <FieldShell
        id="child-australia-months"
        label={t('timeInAustralia')}
        errorText={errors.time_in_australia_months?.message}
      >
        <Input
          id="child-australia-months"
          inputMode="numeric"
          autoComplete="off"
          {...register('time_in_australia_months')}
        />
      </FieldShell>
      <FieldShell id="child-prior-schooling" label={t('priorSchoolingInterrupted')}>
        <NativeSelect
          id="child-prior-schooling"
          className="w-full"
          {...register('prior_schooling_interrupted')}
        >
          <NativeSelectOption value="">{t('notSet')}</NativeSelectOption>
          <NativeSelectOption value="yes">{t('yes')}</NativeSelectOption>
          <NativeSelectOption value="no">{t('no')}</NativeSelectOption>
        </NativeSelect>
      </FieldShell>
    </fieldset>
  );
}
