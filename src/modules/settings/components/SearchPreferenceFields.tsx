'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import {
  SEARCH_PREFERENCE_SECTOR_LABEL_KEYS,
  SEARCH_PREFERENCE_STATES,
} from '@/modules/settings/constants/settings.constants';
import { toggleSettingValue } from '@/modules/settings/lib/search-preferences';
import { SettingsCheckboxGroup } from '@/modules/settings/components/SettingsCheckboxGroup';
import { SearchPreferenceDetailsFields } from '@/modules/settings/components/SearchPreferenceDetailsFields';
import type { SearchPreferenceFormValues } from '@/modules/settings/types/settings.types';
import { SCHOOL_TYPES, SECTORS } from '@/modules/school-search';

interface SearchPreferenceFieldsProps {
  form: UseFormReturn<SearchPreferenceFormValues>;
}

export function SearchPreferenceFields({ form }: SearchPreferenceFieldsProps) {
  const t = useTranslations('Settings');
  const tSearch = useTranslations('SchoolSearch');
  const stateOptions = SEARCH_PREFERENCE_STATES.map((value) => ({
    value,
    label: tSearch(`states.${value}`),
  }));
  const typeOptions = SCHOOL_TYPES.map((value) => ({
    value,
    label: tSearch(`schoolTypes.${value}`),
  }));
  const sectorOptions = SECTORS.map((value) => ({
    value,
    label: tSearch(`sectors.${SEARCH_PREFERENCE_SECTOR_LABEL_KEYS[value]}`),
  }));

  return (
    <div className="flex flex-col gap-6">
      <Controller
        control={form.control}
        name="default_states"
        render={({ field }) => (
          <SettingsCheckboxGroup
            id="search-preference-states"
            label={t('defaultStates')}
            options={stateOptions}
            values={field.value}
            onCheckedChange={(value, checked) =>
              field.onChange(toggleSettingValue(field.value, value, checked))
            }
          />
        )}
      />
      <Controller
        control={form.control}
        name="default_school_types"
        render={({ field }) => (
          <SettingsCheckboxGroup
            id="search-preference-types"
            label={t('defaultSchoolTypes')}
            options={typeOptions}
            values={field.value}
            onCheckedChange={(value, checked) =>
              field.onChange(toggleSettingValue(field.value, value, checked))
            }
          />
        )}
      />
      <Controller
        control={form.control}
        name="default_sectors"
        render={({ field }) => (
          <SettingsCheckboxGroup
            id="search-preference-sectors"
            label={t('defaultSectors')}
            options={sectorOptions}
            values={field.value}
            onCheckedChange={(value, checked) =>
              field.onChange(toggleSettingValue(field.value, value, checked))
            }
          />
        )}
      />
      <SearchPreferenceDetailsFields form={form} />
    </div>
  );
}
