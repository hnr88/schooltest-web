import type { LucideIcon } from 'lucide-react';
import type { z } from 'zod';

import type { InsightCalloutTone, SubjectProgressTone } from '@/modules/design-system';
import type {
  childProgressDataSchema,
  childProgressMetricsSchema,
  childProgressResultSchema,
  childProgressStudentSchema,
} from '@/modules/children/schemas/child-progress.schema';
import type { studentDetailSchema } from '@/modules/children/schemas/student-detail.schema';

// C-STUDENT-LIST-EXT detail row consumed by the edit wizard prefill. No
// `passport_number` key (API-private, never returned).
export type StudentDetail = z.infer<typeof studentDetailSchema>;

export type ChildProgress = z.infer<typeof childProgressDataSchema>;
export type ChildProgressStudent = z.infer<typeof childProgressStudentSchema>;
export type ChildProgressMetrics = z.infer<typeof childProgressMetricsSchema>;
export type ChildProgressResult = z.infer<typeof childProgressResultSchema>;

export type ResultBadgeVariant = 'accent' | 'success' | 'warning';

// Pill styling metadata for a student status (C-UI-MYCHILDREN §6 uppercase pill).
export interface StatusMeta {
  labelKey: string;
  className: string;
}

// The learning panel's callout: tone, icon and message key for one session state.
export interface CompletionInsight {
  tone: InsightCalloutTone;
  icon: LucideIcon;
  messageKey: 'noSessionProgress' | 'completionDescription';
}

// The two API fields any year-level label is derived from. Structural so the
// list row, the detail read and the progress student all satisfy it.
export interface YearLevelSource {
  current_year_level: string | null;
  year_level: number | null;
}

// The two API fields the target-entry label is derived from.
export interface TargetEntrySource {
  target_entry_year: string | null;
  target_entry_term: string | null;
}

// One labelled record fact. `value` null means the API never recorded it, so the
// caller drops the slot rather than shipping an em-dash placeholder.
export interface ChildProfileFact {
  label: string;
  value: string | null;
}

// Roster meta cells — null means "not recorded", rendered as the canonical "—".
export interface RosterFacts {
  yearLevel: string | null;
  targetEntry: string | null;
  nationality: string | null;
}

// One §5.3 subject card, derived from the official results the API returned.
// `value` is the CEFR band's rank on the six-band ladder — the only ordinal the
// parent progress contract exposes; there is no percentage score in the API.
export interface ChildSkillSummary {
  skill: ChildProgressResult['skill'];
  band: NonNullable<ChildProgressResult['cefrBand']> | null;
  value: number;
  count: number;
  tone: SubjectProgressTone;
}

// Roster pager state: the visible slice plus the canonical footer readout.
export interface RosterPagination<TRow> {
  page: number;
  pageCount: number;
  pageNumbers: number[];
  from: number;
  to: number;
  total: number;
  rows: TRow[];
  setPage: (page: number) => void;
}
