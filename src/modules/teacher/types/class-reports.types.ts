import type { RosterRow } from '@/modules/results';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';

/** What the "Reports and data" modal produces (design `rpKinds`, l.4426). */
export type ReportKind = 'student' | 'class' | 'ai';

/** The format pills (design `rpFormats`): PDF / CSV / Print, or Markdown alone for AI data. */
export type ReportFormat = 'pdf' | 'csv' | 'print' | 'markdown';

/** A roster row whose student has a result the server scored (`overall.domain_score` set). */
export interface ScoredRosterRow {
  student: RosterRow['student'];
  result: NonNullable<RosterRow['result']>;
}

/** One CSV field before quoting: `null` is an empty field, never a zero. */
export type CsvCell = string | number | null;

export interface ClassReportsDialogProps {
  classCard: DashboardClass;
  rows: readonly RosterRow[];
}

export interface ClassReportsApi {
  kind: ReportKind;
  format: ReportFormat;
  formats: readonly ReportFormat[];
  /** Students with a real scored result — the count on the CTA. */
  scored: number;
  isPending: boolean;
  pickKind: (kind: ReportKind) => void;
  pickFormat: (format: ReportFormat) => void;
  generate: () => void;
}

export interface ReportsKindFieldProps {
  value: ReportKind;
  /** The class's name, printed in the Class summary card's description. */
  forClass: string;
  onChange: (kind: ReportKind) => void;
}

export interface ReportsFormatFieldProps {
  formats: readonly ReportFormat[];
  value: ReportFormat;
  onChange: (format: ReportFormat) => void;
}

/** Header words of the per-student CSV; `viewModel` resolves a `TeacherPortal.viewModel` key. */
export interface StudentReportsCsvLabels {
  student: string;
  score: string;
  phase: string;
  growth: string;
  skillScore: (skill: string) => string;
  skillBand: (skill: string) => string;
  viewModel: (key: string) => string;
}

/** Section titles and column words of the class summary CSV. */
export interface ClassSummaryCsvLabels {
  averages: string;
  measure: string;
  value: string;
  classAverage: string;
  scored: string;
  roster: string;
  upSinceLast: string;
  paired: string;
  topGap: string;
  phases: string;
  phase: string;
  students: string;
  share: string;
  subskills: string;
  subskill: string;
  mean: string;
  assessed: string;
  secure: string;
  gatePassed: string;
  flag: string;
  viewModel: (key: string) => string;
}
