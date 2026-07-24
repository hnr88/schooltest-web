import type {
  SearchPreference,
  SearchPreferenceFormValues,
} from '@/modules/settings/types/settings.types';

// The panel edits a SUBSET of the stored row — only the three keys the form
// schema carries make the round trip; the rest stays server-side.
export function toSearchPreferenceFormValues(
  preferences: SearchPreference,
): SearchPreferenceFormValues {
  return {
    default_states: preferences.default_states,
    default_sort: preferences.default_sort,
    default_page_size: preferences.default_page_size,
  };
}

export function toggleSettingValue<T extends string>(values: T[], value: T, checked: boolean): T[] {
  if (checked) return values.includes(value) ? values : [...values, value];
  return values.filter((current) => current !== value);
}
