import type { SchoolPlan, TestType } from '@/modules/school-admin/types/school-admin.types';

// Spec §Plan System: the MVP ships reading only, so every allowance figure the
// School analytics home renders comes off this one C-ENT-01 row.
export const READING_TEST_TYPE: TestType = 'reading';

// Mainstream readiness needs listening, writing and speaking, which the trial
// plan does not carry — the section renders as an info banner on this plan.
export const TRIAL_PLAN: SchoolPlan = 'trial';
