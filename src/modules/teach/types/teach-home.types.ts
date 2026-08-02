// C-TEACH-01 teach home payload as consumed by the teacher landing dashboard
// (task 83, st-mvp-pivot; mvp-updates §4.9). One entry per class the caller
// may see (teacher: own classes; school_admin: all school classes). Both
// summaries are nullable: diagnostic is null until Test A results exist,
// monitor is null while no sitting is running - the panels render their
// unpopulated states from the same component tree.

export interface TeachHomeDiagnosticSummary {
  sat_count: number;
  roster_count: number;
  latest_form: string | null;
  mastered_pct: number;
}

// The five MonitorState buckets, keyed exactly as the test-day sitting states.
export interface TeachHomeMonitorSummary {
  not_joined: number;
  joined: number;
  in_progress: number;
  submitted: number;
  stalled: number;
}

export interface TeachHomeClass {
  documentId: string;
  name: string;
  diagnostic: TeachHomeDiagnosticSummary | null;
  monitor: TeachHomeMonitorSummary | null;
}

export interface TeachHome {
  classes: TeachHomeClass[];
}
