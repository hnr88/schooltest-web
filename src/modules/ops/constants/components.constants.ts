import type { SectionTimersFormValues } from '@/modules/ops/schemas/section-timers.schema';
import type { SchoolPlan } from '@/modules/school-admin';

export const DATE_TIME = 'd MMM yyyy, HH:mm';

// Plan tiers exactly as api::school.school declares them. Spec §Plan System
// makes the full licence an OPS assignment, so this list is the ops console's
// switch - there is no self-serve path onto it.
export const SCHOOL_PLAN_OPTIONS: readonly SchoolPlan[] = ['trial', 'full_license'];

export const SECTION_FIELDS: ReadonlyArray<{ stage: number; name: keyof SectionTimersFormValues }> = [
  { stage: 1, name: 'section1' },
  { stage: 2, name: 'section2' },
  { stage: 3, name: 'section3' },
];
