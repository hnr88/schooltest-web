'use client';

import { useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';

import { SCHOOL_TYPES, SECTORS } from '@/modules/school-search';
import {
  SEARCH_PREFERENCE_SECTOR_LABEL_KEYS,
  SEARCH_PREFERENCE_STATES,
} from '@/modules/settings/constants/settings.constants';
import { SearchPreferenceChoiceField } from '@/modules/settings/components/SearchPreferenceChoiceField';
import type { SearchPreferenceFormValues } from '@/modules/settings/types/settings.types';

interface SearchPreferenceFieldsProps {
  form: UseFormReturn<SearchPreferenceFormValues>;
}

// The three "what to look for" fields of the canonical Profile-card field stack:
// one FieldShell per field on the canonical field rhythm, no per-field card.
export function SearchPreferenceFields({ form }: SearchPreferenceFieldsProps) {
  const t = useTranslations('Settings');
  const tSearch = useTranslations('SchoolSearch');

  return (
    <div className="flex flex-col gap-5">
      <SearchPreferenceChoiceField
        control={form.control}
        name="default_states"
        label={t('defaultStates')}
        options={SEARCH_PREFERENCE_STATES.map((value) => ({
          value,
          label: tSearch(`states.${value}`),
        }))}
      />
      <SearchPreferenceChoiceField
        control={form.control}
        name="default_school_types"
        label={t('defaultSchoolTypes')}
        options={SCHOOL_TYPES.map((value) => ({
          value,
          label: tSearch(`schoolTypes.${value}`),
        }))}
      />
      <SearchPreferenceChoiceField
        control={form.control}
        name="default_sectors"
        label={t('defaultSectors')}
        options={SECTORS.map((value) => ({
          value,
          label: tSearch(`sectors.${SEARCH_PREFERENCE_SECTOR_LABEL_KEYS[value]}`),
        }))}
      />
    </div>
  );
}
