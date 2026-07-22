import type {
  LevelValue,
  SchoolTypeValue,
  SectorValue,
  SortBy,
  StateCode,
  ToggleKey,
} from '@/modules/school-search/types/school-search.types';

export const PAGE_SIZE = 12;

// ISO 4217 code for the tuition footer (rendered with narrowSymbol → "$X,XXX").
export const TUITION_CURRENCY = 'AUD';

export const FEE_MIN_BOUND = 5000;
export const FEE_MAX_BOUND = 60000;
export const FEE_STEP = 1000;

export const DEFAULT_SORT_BY: SortBy = 'name-asc';

export const STATES: readonly StateCode[] = ['QLD', 'NSW', 'VIC', 'SA', 'WA', 'TAS', 'NT', 'ACT'];

export const SCHOOL_TYPES: readonly SchoolTypeValue[] = ['combined', 'primary', 'secondary'];

export const SECTORS: readonly SectorValue[] = ['government', 'non-government', 'catholic'];

export const LEVELS: readonly LevelValue[] = ['primary', 'junior_secondary', 'senior_secondary'];

export const SORT_OPTIONS: readonly SortBy[] = [
  'name-asc',
  'fee-asc',
  'fee-desc',
  'name-desc',
  'relevance',
];

export const TOGGLE_KEYS: readonly ToggleKey[] = [
  'scholarshipAvailable',
  'atarAvailable',
  'elicos',
];

// camelCase i18n leaf keys for the hyphenated enum values (catalogs land in 034).
export const SECTOR_LABEL_KEYS: Record<SectorValue, string> = {
  government: 'government',
  'non-government': 'nonGovernment',
  catholic: 'catholic',
};

export const SORT_OPTION_LABEL_KEYS: Record<SortBy, string> = {
  'name-asc': 'nameAsc',
  'name-desc': 'nameDesc',
  'fee-asc': 'feeAsc',
  'fee-desc': 'feeDesc',
  relevance: 'relevance',
};

// Australia-wide Leaflet map config (legacy schoolgo parity, M1 §3/§5).
export const AU_MAP_CENTER: [number, number] = [-28, 133];
export const AU_MAP_ZOOM = 5;
export const AU_MAP_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-46, 110],
  [-8, 160],
];
export const CLUSTER_MAX_RADIUS = 60;
// Spec 01 §8.5: the design swaps city cluster bubbles for individual pins at zoom 9,
// and every camera move that "opens" a place lands on zoom 11.
export const CLUSTER_DISABLE_AT_ZOOM = 9;
export const PLACE_FOCUS_ZOOM = 11;
