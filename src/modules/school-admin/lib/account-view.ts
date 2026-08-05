import type { TintTileTone } from '@/modules/design-system';
import type { SchoolMe } from '@/modules/school-admin/types/school-admin.types';

// C-SCH-01 returns the address parts separately and every one of them is
// nullable, so the single location line is joined from whatever exists.
export function formatSchoolLocation(school: SchoolMe): string {
  return [school.suburb, school.state, school.postcode]
    .filter((part): part is string => Boolean(part))
    .join(' ');
}

// Spec section 5 "Test allowance": the type the plan actually grants stands out
// in the accent tint; the exhausted rows stay in the neutral recess. Derived
// from the API's own `remaining`, never from the test type.
export function allowanceTone(remaining: number): TintTileTone {
  return remaining > 0 ? 'accent' : 'inset';
}
