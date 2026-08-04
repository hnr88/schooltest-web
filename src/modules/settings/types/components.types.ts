import type { ChoiceOption } from '@/modules/design-system';
import type { PublicSettings, SearchPreferenceFormValues, SettingsTab } from '@/modules/settings/types/settings.types';
import type { ReactNode } from 'react';
import type { Control, UseFormReturn } from 'react-hook-form';

export interface PublicSiteBannerProps {
  readonly settings: PublicSettings;
}

export interface SearchPreferenceChoiceFieldProps {
  control: Control<SearchPreferenceFormValues>;
  name: 'default_states';
  label: string;
  options: readonly ChoiceOption[];
}

export interface SearchPreferenceDetailsFieldsProps {
  form: UseFormReturn<SearchPreferenceFormValues>;
}

export interface SearchPreferenceFieldsProps {
  form: UseFormReturn<SearchPreferenceFormValues>;
}

export interface SettingsPanelProps {
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export interface SettingsTabsProps {
  value: SettingsTab;
  onValueChange: (tab: SettingsTab) => void;
}
