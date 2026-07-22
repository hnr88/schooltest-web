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

// PortalCard (.qa/design/spec/03 §1.4): #FFFFFF, radius 24 and a single
// 0 1px 2px rgba(14,35,80,.04) shadow with no border. `overflow-visible` keeps the
// ::after pointer expansions of the pills and switches inside it clickable.
export const PORTAL_CARD_CLASS = 'overflow-visible rounded-card border-0 shadow-sm';

// Portal screen container (§4.1): one 820px column on a 22px rhythm.
export const PORTAL_SCREEN_CLASS =
  'mx-auto flex w-full max-w-portal flex-1 flex-col gap-5.5 px-4 py-6 sm:px-6 lg:px-8';

// PortalChip, Pill variant (§1.4): 42px tall, 18px side padding, 13.5/500, r999.
export const PORTAL_PILL_CLASS =
  'inline-flex h-10.5 items-center rounded-full border px-4.5 text-body-sm font-medium transition duration-200 ease-out-expo focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100';

export const PORTAL_PILL_SELECTED_CLASS = 'border-foreground bg-foreground text-primary-foreground';

export const PORTAL_PILL_IDLE_CLASS =
  'border-portal-input bg-card text-body hover:border-foreground hover:text-foreground';

// PortalGhostButton (§1.4): white pill, 1px #D8DFEA, 13/600 navy, hover moves the
// border to #0E2350.
export const PORTAL_GHOST_BUTTON_CLASS =
  'min-h-11 rounded-full border-portal-input bg-card px-4.5 text-caption font-semibold text-foreground transition duration-200 ease-out-expo hover:border-foreground hover:bg-card active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100';

// PortalSelect (§1.4): 48px tall, radius 12, #D8DFEA border, 12px side padding, 14px
// navy ink on #FFFFFF. The height override REPEATS the `data-[size=default]` variant
// on purpose: the vendored trigger states its 32px height behind that variant, so a
// plain `h-12` loses on specificity and silently does nothing.
export const SETTINGS_SELECT_TRIGGER_CLASS =
  'min-h-12 w-full justify-between rounded-tile border-portal-input bg-card px-3 text-body-md font-medium text-foreground transition-colors duration-200 ease-out-expo hover:border-foreground data-[size=default]:h-12 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 motion-reduce:transition-none';

// PortalInput (§1.4): the same box as the select above so a numeric field and a
// dropdown sitting in one grid line up to the pixel.
export const SETTINGS_INPUT_CLASS =
  'min-h-12 rounded-tile border-portal-input px-3 text-body-md';

// CONTRAST. `--muted-foreground` resolves to #64748B — 4.76:1 on #FFFFFF, which
// clears AA only while nothing composites over it. This screen's tab panel mounts
// under `animate-in fade-in-0`, so for the length of that transition the ink is
// drawn at partial alpha: measured mid-fade it is #718095 on #FDFEFE = 3.97:1, and
// axe fails it as SERIOUS. It is the same ink CONTRAST-SPEC.md already downgrades
// ("Text directly on the well moves #64748B → #475569. NOT a style choice —
// forced by AA"), because #64748B is 4.34:1 on the #F1F5F9/#EFF5FF tints these
// panels sit against.
// Panel ledes therefore take --color-body (#475569): 7.58:1 on white and 6.92:1 on
// every tint used here, so the pair holds AA through the entire transition.
// PanelHeaderRow is a design-system component and out of scope, so the re-ink is
// applied from the consumer by slot, exactly like a vendored-primitive correction.
export const SETTINGS_LEDE_INK = '[&_[data-slot=panel-header-row]_p]:text-body';

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
