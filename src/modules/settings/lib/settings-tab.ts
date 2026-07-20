import { SETTINGS_TABS } from '@/modules/settings/constants/settings.constants';
import type { SettingsTab } from '@/modules/settings/types/settings.types';

export function coerceSettingsTab(value: string | null): SettingsTab {
  return SETTINGS_TABS.find((tab) => tab === value) ?? 'auth';
}

export function isSettingsTab(value: string): value is SettingsTab {
  return SETTINGS_TABS.some((tab) => tab === value);
}
