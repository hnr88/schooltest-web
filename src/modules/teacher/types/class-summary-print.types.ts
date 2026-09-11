import type { DisplaySkill } from '@schooltest/scoring-contracts';

import type { CarerReportView } from '@/modules/teacher/types/v2-family.types';
import type { StudentDetailView } from '@/modules/teacher/types/v2-student-detail.types';

/**
 * The class reading report the Classes list's PDF button prints (design
 * `printClassReport`, l.2072) — every number summarised from the roster read
 * `GET /api/my/students/results?class=`.
 */
export interface ClassSubskillSummary {
  skill: DisplaySkill;
  mean: number;
  /** Students the server banded `secure`; `null` for the Critical gate, which carries no band. */
  secure: number | null;
  assessed: number;
}

export interface ClassSkillMean {
  skill: DisplaySkill;
  mean: number;
}

export interface ClassSummary {
  scored: number;
  total: number;
  mean: number | null;
  improved: number;
  held: number;
  slipped: number;
  subskills: ClassSubskillSummary[];
  strength: ClassSkillMean | null;
  gap: ClassSkillMean | null;
  vocab: { a2: number | null; b1: number | null };
}

export interface ClassSummaryInput {
  className: string;
  yearLabel: string | null;
  date: string;
  lang: string;
  summary: ClassSummary;
}

export interface ClassSummaryLabels {
  title: string;
  assessment: string;
  brand: string;
  meanReading: string;
  students: string;
  growth: string;
  subskillProfile: string;
  subskill: string;
  mean: string;
  atSecure: string;
  focus: string;
  strength: string;
  gap: string;
  growthSince: string;
  improved: string;
  held: string;
  slipped: string;
  vocabulary: string;
  everyday: string;
  academic: string;
  footer: string;
  noValue: string;
  secureOf: (secure: number, assessed: number) => string;
  skill: (skill: DisplaySkill) => string;
}

/**
 * The student reading report the Students tab's PDF button prints (design
 * `printStudentReport`, l.2247) — built from `GET /api/results/:id` through
 * `studentDetail()` and `carerReport()`.
 */
export interface StudentReportInput {
  name: string;
  className: string;
  date: string;
  lang: string;
  detail: StudentDetailView;
  carer: CarerReportView;
}

export interface StudentReportLabels {
  title: string;
  assessment: string;
  brand: string;
  overall: string;
  phase: string;
  growth: string;
  subskills: string;
  subskill: string;
  score: string;
  band: string;
  focus: string;
  strength: string;
  focusArea: string;
  vocabulary: string;
  everyday: string;
  academic: string;
  canDo: string;
  next: string;
  footer: string;
  noValue: string;
  /** A signed step ("+5", "−45", "±0") in the report's unit. */
  points: (signed: string) => string;
  /** Resolves a `TeacherPortal.viewModel` key carried by the view models. */
  viewModel: (key: string) => string;
}
