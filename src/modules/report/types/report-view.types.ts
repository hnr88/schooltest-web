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

// Every crosswalk-derived field on the report resolves to exactly one of these
// three states, so the crumb, the panel heading and the fact panel cannot
// disagree about which absence a result is.
export type DisplayLabelState = 'derived' | 'pending' | 'not_applicable';

// absentKey names the i18n key for the absent sentence; a derived resolution
// carries the label itself and nothing else.
export type ResolvedDisplayLabel =
  | { state: 'derived'; label: string }
  | { state: 'pending'; label: null; absentKey: 'displayLabelPending' }
  | { state: 'not_applicable'; label: null; absentKey: 'displayLabelNotApplicable' };

export type ParentSubskillsView =
  | { state: 'groups'; groups: ParentSubskillGroup[]; total: number }
  | { state: 'not_derived' }
  | { state: 'not_applicable' };

