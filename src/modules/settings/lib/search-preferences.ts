import type {
  SearchPreference,
  SearchPreferenceFormValues,
} from '@/modules/settings/types/settings.types';

export function toSearchPreferenceFormValues(
  preferences: SearchPreference,
): SearchPreferenceFormValues {
  return {
    default_states: preferences.default_states,
    default_school_types: preferences.default_school_types,
    default_sectors: preferences.default_sectors,
    default_sort: preferences.default_sort,
    default_page_size: preferences.default_page_size,
    default_fee_min: preferences.default_fee_min,
    default_fee_max: preferences.default_fee_max,
  };
}

export function toggleSettingValue<T extends string>(values: T[], value: T, checked: boolean): T[] {
  if (checked) return values.includes(value) ? values : [...values, value];
  return values.filter((current) => current !== value);
}

export function parseNullableNumber(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
}
