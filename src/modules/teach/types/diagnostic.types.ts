// C-RPT-01 class diagnostic payload as consumed by the teacher diagnostic
// dashboard (task 75, st-mvp-pivot). Mastery rows are a verbatim passthrough
// of the stored Result attributes (task 50 sentinel semantics: null prob stays
// null and renders as "not yet assessed", never 0%). The heat map is keyed by
// item code + section only and is framed as items correct / responses —
// attribute names and ACARA phase never appear on this surface (mvp spec 4.9,
// 4.4).

export type DiagnosticStatus = 'mastered' | 'emerging' | 'not_mastered' | 'not_assessed';

export interface DiagnosticAttribute {
  code: string;
  status: DiagnosticStatus;
  prob: number | null;
}

export interface DiagnosticMasteryRow {
  student_ref: string;
  // Stable React key — student_ref collides on real rosters ("Zz67 A." twice).
  student_document_id: string;
  // Drill link target: the latest complete Result behind this row (null when the
  // student has none).
  latest_result_document_id: string | null;
  attributes: DiagnosticAttribute[];
}

// C-RPT-01 v2 (task 94): one differentiation group - children sharing a
// limiting area (weakest assessed area per student; 'not_yet_assessed' always
// sorts last). Rendered by GroupPanel (task 95) with friendly area labels only.
export interface DiagnosticGroup {
  limiting_attribute: string;
  student_refs: string[];
  count: number;
}

export interface DiagnosticHeatmapRow {
  item_code: string;
  section: number;
  correct: number;
  responses: number;
  fraction: number;
}

export interface ClassDiagnostic {
  class: { documentId: string; name: string | null; year_band: string | null };
  form_code: string | null;
  sat_count: number;
  roster_count: number;
  mastery: DiagnosticMasteryRow[];
  groups: DiagnosticGroup[];
  heatmap: DiagnosticHeatmapRow[];
}
