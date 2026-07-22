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

// DS §5.6 underline tabs are label-only — the canonical row carries no glyphs.
export const SETTINGS_TAB_CONFIG: readonly {
  value: SettingsTab;
  labelKey: string;
}[] = [
  { value: 'auth', labelKey: 'tabs.auth' },
  { value: 'search', labelKey: 'tabs.search' },
  { value: 'notifications', labelKey: 'tabs.notifications' },
  { value: 'children', labelKey: 'tabs.children' },
];

// Canonical in-card section label (DS component sheets): 11.5px/700 uppercase,
// .08em tracking. Drawn at slate-600, not the canonical slate-400: axe flags
// #94A3B8 label text on white as a serious contrast failure. The margin is
// explicit because a <legend> is not a flex item — the fieldset gap skips it.
export const SETTINGS_SECTION_LABEL_CLASS =
  'mb-2 text-overline font-bold tracking-rail text-slate-600 uppercase';

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
