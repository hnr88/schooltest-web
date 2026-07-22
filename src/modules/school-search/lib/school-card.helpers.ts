// School-card presentation helpers (kept out of the components per module-pattern).

import type { SchoolHit } from '@/modules/school-search/types/school-search.types';

export function getSchoolLocation(suburb: string | null, state: string | null): string {
  return [suburb, state].filter(Boolean).join(', ');
}

// The design's card meta line is `sector · year range · suburb state` (spec 01 §8.4).
// Every part is a REAL response field and every absent part simply drops out — a hit
// with no sector and no school type renders the location alone, never a filler
// segment. The middle slot takes the TRANSLATED schoolType rather than the raw
// `yearLevelBands` enum strings the API ships (`junior_secondary`), which are storage
// values and not copy.
export function getSchoolMetaParts(
  hit: SchoolHit,
  sectorLabel: string | null,
  typeLabel: string | null,
): string[] {
  const location = getSchoolLocation(hit.suburb, hit.state);
  return [sectorLabel, typeLabel, location].filter((part): part is string => Boolean(part));
}

// The tick facts under the card's divider: the attributes the API actually records
// for this school. B-11/B-12 — there is no rating field and no placement-acceptance
// field, so neither is derived here.
export function getSchoolFactKeys(hit: SchoolHit): string[] {
  const keys: string[] = [];
  if (hit.scholarshipAvailable) keys.push('scholarships');
  if (hit.elicosEslSupport) keys.push('elicos');
  if (hit.atarAvailable) keys.push('atar');
  if (hit.cricosCode !== null) keys.push('cricos');
  return keys;
}
