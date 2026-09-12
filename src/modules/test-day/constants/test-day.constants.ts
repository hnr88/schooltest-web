// Test-day constants (task 64). The poll cadence is the "live" in the live
// sitting: about 5 s while the sitting is open, stopped once it closes.
//
// R1 PART B: `RESITTABLE_STATES` and the reveal-audit storage key went with the
// retired console — the Live sessions tab derives a row's own eligibility from
// the monitor payload (`teacher/lib/live-student-actions.ts`) and reveals no
// codes per student.
export const MONITOR_REFETCH_INTERVAL_MS = 5000;
