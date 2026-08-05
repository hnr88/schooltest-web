import type { SchoolPlan } from '@/modules/school-admin/types/school-admin.types';

// Mainstream readiness needs listening, writing and speaking, which the trial
// plan does not carry — the section renders as an info banner on this plan.
export const TRIAL_PLAN: SchoolPlan = 'trial';

// The ordered ACARA EAL/D phase vocabulary C-RPT-06 aggregates into
// `avg_reading_level` and `reading_progress`. Narrowing against this list keeps
// an unrecognised value off t() instead of reaching for a key that never
// existed. Labels live in the locale files under
// SchoolStudents.form.acaraPhaseOption.
export const ACARA_PHASES = ['beginning', 'emerging', 'developing', 'consolidating'] as const;

// Same format the Account renewal date renders in (d MMM yyyy).
export const TEST_WINDOW_DATE_FORMAT = 'd MMM yyyy';
