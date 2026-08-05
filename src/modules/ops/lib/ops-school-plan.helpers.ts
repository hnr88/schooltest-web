import { SCHOOL_PLAN_OPTIONS } from '@/modules/ops/constants/components.constants';

import type { SchoolPlan } from '@/modules/school-admin';

/** The select hands back a bare string; only a real tier may reach the PATCH. */
export function isSchoolPlan(value: string): value is SchoolPlan {
  return (SCHOOL_PLAN_OPTIONS as readonly string[]).includes(value);
}
