'use client';

import { useTranslations } from 'next-intl';
import { Controller, type UseFormReturn } from 'react-hook-form';

import { FieldShell, SegmentedChoice } from '@/modules/design-system';
import {
  SEARCH_PREFERENCE_PAGE_SIZES,
  SEARCH_PREFERENCE_SORT_LABEL_KEYS,
  SEARCH_PREFERENCE_SORT_OPTIONS,
} from '@/modules/settings/constants/settings.constants';
import { SettingsPanel } from '@/modules/settings/components/SettingsPanel';
import { SettingsSelectField } from '@/modules/settings/components/SettingsSelectField';
import type { SearchPreferenceFormValues } from '@/modules/settings/types/settings.types';

interface SearchPreferenceDetailsFieldsProps {
  form: UseFormReturn<SearchPreferenceFormValues>;
}

// "Results view" — the short second-column panel. It pairs the one field canonical
// still gives a dropdown with a SegmentedChoice: canonical's equal-width row for a
// 3-value enum inside a narrow panel (App Screens L1730 "Points 1 | 2 | 3"), which
// is what a page size is. The segment labels are the numbers themselves; the field
// label above the group is what names them, exactly as canonical draws it.
export function SearchPreferenceDetailsFields({ form }: SearchPreferenceDetailsFieldsProps) {
  const t = useTranslations('Settings');
  const tSearch = useTranslations('SchoolSearch');

  return (
    <SettingsPanel
      id="settings-search-results"
      title={t('searchResultsViewTitle')}
      description={t('searchResultsViewDescription')}
    >
      <div className="flex flex-col gap-5">
        <Controller
          control={form.control}
          name="default_sort"
          render={({ field }) => (
            <SettingsSelectField
              id="search-preference-sort"
              label={t('defaultSort')}
              options={SEARCH_PREFERENCE_SORT_OPTIONS.map((value) => ({
                value,
                label: tSearch(`sortOptions.${SEARCH_PREFERENCE_SORT_LABEL_KEYS[value]}`),
              }))}
              value={field.value}
              onValueChange={field.onChange}
            />
          )}
        />
        <Controller
          control={form.control}
          name="default_page_size"
          render={({ field }) => (
            <FieldShell
              id="search-preference-page-size"
              labelId="search-preference-page-size-label"
              label={t('defaultPageSize')}
            >
              <SegmentedChoice
                options={SEARCH_PREFERENCE_PAGE_SIZES.map((value) => ({
                  value: String(value),
                  label: String(value),
                }))}
                value={String(field.value)}
                onValueChange={(next) => field.onChange(Number(next))}
                ariaLabelledBy="search-preference-page-size-label"
              />
            </FieldShell>
          )}
        />
      </div>
    </SettingsPanel>
  );
}
