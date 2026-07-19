import { z } from 'zod';

import {
  schoolSectorSchema,
  schoolStateSchema,
  schoolTypeSchema,
  type SchoolHit,
  type SchoolSearchPagination,
  type SchoolSearchResult,
} from '@/modules/school-search/schemas/school-search.schema';

// A SchoolHit that survived the map coord filter — both coordinates are present.
export type GeoSchoolHit = SchoolHit & { latitude: number; longitude: number };

export type StateCode = z.infer<typeof schoolStateSchema>;
export type SchoolTypeValue = z.infer<typeof schoolTypeSchema>;
export type SectorValue = z.infer<typeof schoolSectorSchema>;
export type LevelValue = 'primary' | 'junior_secondary' | 'senior_secondary';
export type SortBy = 'relevance' | 'name-asc' | 'name-desc' | 'fee-asc' | 'fee-desc';
export type ToggleKey = 'scholarshipAvailable' | 'atarAvailable' | 'elicos';

export interface SchoolSearchRequest {
  q?: string;
  states?: StateCode[];
  schoolTypes?: SchoolTypeValue[];
  sectors?: SectorValue[];
  levels?: LevelValue[];
  atarAvailable?: boolean;
  englishLanguageSupport?: boolean;
  scholarshipAvailable?: boolean;
  feeMin?: number;
  feeMax?: number;
  sortBy?: SortBy;
  page: number;
  pageSize: number;
}

export interface SchoolSearchFilters {
  q: string;
  states: StateCode[];
  schoolTypes: SchoolTypeValue[];
  sectors: SectorValue[];
  levels: LevelValue[];
  atarAvailable: boolean;
  elicos: boolean;
  scholarshipAvailable: boolean;
  feeMin: number;
  feeMax: number;
  sortBy: SortBy;
  page: number;
}

export type { SchoolHit, SchoolSearchPagination, SchoolSearchResult };
