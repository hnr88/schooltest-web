'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import { Input, Label } from '@/modules/design-system';
import {
  SEARCH_PREFERENCE_PAGE_SIZES,
  SEARCH_PREFERENCE_SORT_LABEL_KEYS,
  SEARCH_PREFERENCE_SORT_OPTIONS,
} from '@/modules/settings/constants/settings.constants';
import { parseNullableNumber } from '@/modules/settings/lib/search-preferences';
import { SettingsSelectField } from '@/modules/settings/components/SettingsSelectField';
import type { SearchPreferenceFormValues } from '@/modules/settings/types/settings.types';

interface SearchPreferenceDetailsFieldsProps {
  form: UseFormReturn<SearchPreferenceFormValues>;
}

export function SearchPreferenceDetailsFields({ form }: SearchPreferenceDetailsFieldsProps) {
  const t = useTranslations('Settings');
  const tSearch = useTranslations('SchoolSearch');
  const { errors } = form.formState;
  const sortOptions = SEARCH_PREFERENCE_SORT_OPTIONS.map((value) => ({
    value,
    label: tSearch(`sortOptions.${SEARCH_PREFERENCE_SORT_LABEL_KEYS[value]}`),
  }));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={form.control}
          name="default_sort"
          render={({ field }) => (
            <SettingsSelectField
              id="search-preference-sort"
              label={t('defaultSort')}
              options={sortOptions}
              value={field.value}
              onValueChange={field.onChange}
            />
          )}
        />
        <Controller
          control={form.control}
          name="default_page_size"
          render={({ field }) => (
            <SettingsSelectField
              id="search-preference-page-size"
              label={t('defaultPageSize')}
              options={SEARCH_PREFERENCE_PAGE_SIZES.map((value) => ({
                value,
                label: t('pageSizeOption', { count: value }),
              }))}
              value={field.value}
              onValueChange={field.onChange}
            />
          )}
        />
      </div>
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold text-foreground">{t('defaultFeeRange')}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="search-preference-fee-min">{t('defaultFeeMinimum')}</Label>
            <Input
              id="search-preference-fee-min"
              type="number"
              min="0"
              max="1000000"
              inputMode="numeric"
              className="h-11"
              aria-invalid={errors.default_fee_min ? true : undefined}
              {...form.register('default_fee_min', { setValueAs: parseNullableNumber })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="search-preference-fee-max">{t('defaultFeeMaximum')}</Label>
            <Input
              id="search-preference-fee-max"
              type="number"
              min="0"
              max="1000000"
              inputMode="numeric"
              className="h-11"
              aria-invalid={errors.default_fee_max ? true : undefined}
              {...form.register('default_fee_max', { setValueAs: parseNullableNumber })}
            />
          </div>
        </div>
        {errors.default_fee_min?.message ? (
          <p className="text-sm text-destructive">{t(errors.default_fee_min.message)}</p>
        ) : null}
      </fieldset>
    </>
  );
}
