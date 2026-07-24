import type { ReportSkill } from '@/modules/report/types/report.types';

// E11-10. The report is ONE route, ONE C-4 read and ONE result; the audience is
// a MODE over that result, never a second report with a second fetch.
export type ReportViewMode = 'teacher' | 'parent';

// E11-13. Three POSITIVE steps — secure > getting_there > not_yet — plus
// `not_assessed`, which is NOT a fourth step: it is the same genuine absence the
// C-4 wire carries when no item loaded that subskill in this sitting.
export type ParentSubskillState = 'secure' | 'getting_there' | 'not_yet' | 'not_assessed';

// A group is emitted only when it holds at least one subskill, so no parent row
// can ever read as a zero.
export interface ParentSubskillGroup {
  state: ParentSubskillState;
  count: number;
}

// The rung alone. Its two absences are the SAME two every crosswalk-derived
// field on this report splits into, so the parent mode can never disagree with
// the teacher mode about which absence a result is.
export type ParentHeadline =
  | { state: 'derived'; label: string }
  | { state: 'pending' }
  | { state: 'not_applicable' };

export type ParentSubskillsView =
  | { state: 'groups'; groups: ParentSubskillGroup[]; total: number }
  | { state: 'not_derived' }
  | { state: 'not_applicable' };

// E11-14/E11-15. THE allow-list. Not a filtered ResultView and not a Pick<> of
// one: a separate shape whose every field is enumerated here, so a field a
// parent must not see cannot be forgotten-to-be-hidden — it has nowhere to live.
// No cefr_band, no acara_phase, no readiness, no low_confidence, no provisional,
// no attribute code and no probability is representable in it.
export interface ParentReportView {
  headline: ParentHeadline;
  skill: ReportSkill | null;
  publishedAt: string | null;
  subskills: ParentSubskillsView;
}
