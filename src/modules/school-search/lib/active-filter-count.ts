import {
  FEE_MAX_BOUND,
  FEE_MIN_BOUND,
} from '@/modules/school-search/constants/school-search.constants';
import type { SchoolSearchFilters } from '@/modules/school-search/types/school-search.types';

// How many filter GROUPS are narrowing the corpus — drives the count badge on the
// `< lg` "Filters" trigger, which is the only affordance telling a phone user that
// the collapsed rail is not in its default state.
export function countActiveSchoolFilters(filters: SchoolSearchFilters): number {
  const booleans = [filters.atarAvailable, filters.elicos, filters.scholarshipAvailable];
  const feeNarrowed = filters.feeMin > FEE_MIN_BOUND || filters.feeMax < FEE_MAX_BOUND;
  return (
    filters.states.length +
    filters.sectors.length +
    filters.schoolTypes.length +
    booleans.filter(Boolean).length +
    (feeNarrowed ? 1 : 0)
  );
}
