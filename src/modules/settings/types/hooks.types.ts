import type { SettingsTab } from '@/modules/settings/types/settings.types';

export interface SettingsTabSync {
  tab: SettingsTab;
  setTab: (tab: SettingsTab) => void;
}
