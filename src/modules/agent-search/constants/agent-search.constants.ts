import type {
  AgentServiceValue,
  AgentSortBy,
} from '@/modules/agent-search/types/agent-search.types';

export const PAGE_SIZE = 12;

export const DEFAULT_SORT: AgentSortBy = 'relevance';

// Schema enum values (D-DATA-3 / C10) — labels via i18n, values verbatim.
export const AGENT_SERVICES: readonly AgentServiceValue[] = [
  'counselling',
  'application',
  'visa',
  'scholarship',
  'english_prep',
  'accommodation',
  'under18_welfare',
  'post_arrival',
];

export const SORT_OPTIONS: readonly AgentSortBy[] = [
  'relevance',
  'experience',
  'name_asc',
  'name_desc',
  'recently_verified',
];

// The 8 seeded agent countries (C-SEED-AGENTS) — display-string chip values.
// NEVER the legacy chip list (Australia/Indonesia/Malaysia/Thailand match zero seeds).
export const COUNTRY_CHIPS: readonly string[] = [
  'China',
  'Vietnam',
  'South Korea',
  'India',
  'Brazil',
  'Ghana',
  'France',
  'United Arab Emirates',
];

// The seeded spokenLanguages set (C-SEED-AGENTS) — chip values.
export const LANGUAGE_CHIPS: readonly string[] = [
  'English',
  'Mandarin',
  'Cantonese',
  'Vietnamese',
  'Korean',
  'Hindi',
  'Portuguese',
  'French',
  'Arabic',
];
