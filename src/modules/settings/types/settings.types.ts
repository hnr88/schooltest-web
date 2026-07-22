import type { z } from 'zod';

import type {
  searchPreferenceFormSchema,
  searchPreferenceSchema,
} from '@/modules/settings/schemas/search-preferences.schema';

export type SettingsTab = 'auth' | 'search' | 'notifications' | 'children';

export type SearchPreference = z.infer<typeof searchPreferenceSchema>;
export type SearchPreferenceFormValues = z.infer<typeof searchPreferenceFormSchema>;

export type SearchPreferenceArrayField =
  | 'default_states'
  | 'default_school_types'
  | 'default_sectors';

export interface SettingsChoice<T extends string = string> {
  value: T;
  label: string;
}

export interface SettingsSelectFieldProps<T extends string> {
  id: string;
  label: string;
  options: readonly SettingsChoice<T>[];
  value: T;
  onValueChange: (value: T) => void;
  helperText?: string;
}
