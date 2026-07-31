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
  attributes: DiagnosticAttribute[];
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
  heatmap: DiagnosticHeatmapRow[];
}
