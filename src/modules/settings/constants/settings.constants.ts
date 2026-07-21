import { Bell, KeyRound, Search, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { SORT_OPTIONS, STATES } from '@/modules/school-search';
import type {
  SearchPreferenceFormValues,
  SettingsTab,
} from '@/modules/settings/types/settings.types';

export const SETTINGS_TAB_PARAM = 'tab';
export const SETTINGS_TABS: readonly SettingsTab[] = [
  'auth',
  'search',
  'notifications',
  'children',
];

export const SETTINGS_TAB_CONFIG: readonly {
  value: SettingsTab;
  labelKey: string;
  icon: LucideIcon;
}[] = [
  { value: 'auth', labelKey: 'tabs.auth', icon: KeyRound },
  { value: 'search', labelKey: 'tabs.search', icon: Search },
  { value: 'notifications', labelKey: 'tabs.notifications', icon: Bell },
  { value: 'children', labelKey: 'tabs.children', icon: Users },
];

export const SEARCH_PREFERENCE_DEFAULTS: SearchPreferenceFormValues = {
  default_states: [],
  default_school_types: [],
  default_sectors: [],
  default_sort: 'relevance',
  default_page_size: 12,
  default_fee_min: null,
  default_fee_max: null,
};

export const SEARCH_PREFERENCE_PAGE_SIZES = [12, 24, 50] as const;
export const SEARCH_PREFERENCE_STATES = STATES;
export const SEARCH_PREFERENCE_SORT_OPTIONS = SORT_OPTIONS;

export const SEARCH_PREFERENCE_SECTOR_LABEL_KEYS = {
  government: 'government',
  'non-government': 'nonGovernment',
  catholic: 'catholic',
} as const;

export const SEARCH_PREFERENCE_SORT_LABEL_KEYS = {
  relevance: 'relevance',
  'name-asc': 'nameAsc',
  'name-desc': 'nameDesc',
  'fee-asc': 'feeAsc',
  'fee-desc': 'feeDesc',
} as const;
