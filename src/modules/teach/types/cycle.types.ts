// C-TEACH-02 class cycle payload as consumed by the teacher cycle banner
// (task 108, st-mvp-pivot, mvp-updates 4.5): where the class sits in the
// Test A -> Test B cycle. The school's proficiency label (D-10) is never
// projected onto this teacher-scoped read, so it is deliberately absent here.

export type CyclePosition = 'test_a' | 'test_b' | 'unscheduled';

export interface ClassCycle {
  live_form: { documentId: string; form_code: string } | null;
  window: { opens_at: string; closes_at: string } | null;
  position: CyclePosition;
  benchmark_form: string | null;
  progress_form: string | null;
}
