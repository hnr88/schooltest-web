// C-RPT-02 class progress payload as consumed by the teacher progress panel
// (task 76, st-mvp-pivot, mvp-updates §4.9). Transitions are plain statements
// about reading areas between Test A (the benchmark) and Test B — never
// probability arithmetic. A reading area not assessed on either form appears
// in not_assessed, never as "no change". Until Test B results exist the
// payload is the contracted empty state (populated:false + reason), so the
// panel never has to infer emptiness from empty arrays.

export type ProgressStatus = 'mastered' | 'emerging' | 'not_mastered';

export interface ProgressTransition {
  attribute: string;
  from_status: ProgressStatus;
  to_status: ProgressStatus;
  statement: string;
}

export interface ProgressStudent {
  student_ref: string;
  // Stable React key — student_ref collides on real rosters.
  student_document_id: string;
  transitions: ProgressTransition[];
  weeks_between: number;
}

export interface ProgressNotAssessed {
  student_ref: string;
  attribute: string;
}

export interface ClassProgress {
  populated: boolean;
  reason: string | null;
  benchmark_form: string | null;
  progress_form: string | null;
  students: ProgressStudent[];
  not_assessed: ProgressNotAssessed[];
}
