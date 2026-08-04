'use client';

import { useTranslations } from 'next-intl';

import {
  CURRENT_YEAR_LEVEL_VALUES,
  TARGET_ENTRY_YEARS,
  TERM_VALUES,
  YEAR_LEVEL_VALUES,
} from '@/modules/student-wizard/constants/student-wizard.constants';

// The four localized option lists step 2 renders. D-C8: `current_year_level` is
// the school-year string enum, `year_level` the int band (7-12) — never one field.
export function useEducationOptions() {
  const t = useTranslations('StudentWizard.education');

  return {
    currentYearLevelOptions: CURRENT_YEAR_LEVEL_VALUES.map((value) => ({
      value,
      label: value === 'Prep' ? t('prep') : t('yearOption', { n: Number(value.slice(5)) }),
    })),
    yearLevelOptions: YEAR_LEVEL_VALUES.map((value) => ({
      value,
      label: t('yearOption', { n: value }),
    })),
    targetYearOptions: TARGET_ENTRY_YEARS.map((value) => ({ value, label: value })),
    termOptions: TERM_VALUES.map((value) => ({
      value,
      label: t('term', { n: Number(value.slice(5)) }),
    })),
  };
}
