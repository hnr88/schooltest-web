'use client';

import { useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';

import { SEARCH_PREFERENCE_STATES } from '@/modules/settings/constants/settings.constants';
import { SearchPreferenceChoiceField } from '@/modules/settings/components/SearchPreferenceChoiceField';
import type { SearchPreferenceFormValues } from '@/modules/settings/types/settings.types';

import type { SearchPreferenceFieldsProps } from '@/modules/settings/types/components.types';

// The "where to look" field of the canonical Profile-card field stack: one
// FieldShell on the canonical field rhythm, no per-field card.
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
    </div>
  );
}
