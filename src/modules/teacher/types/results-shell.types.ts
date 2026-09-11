import type { RESULTS_TAB_ORDER } from '@/modules/teacher/constants/results.constants';
import type { SKILL_SCOPE_ORDER } from '@/modules/teacher/lib/skill-scope';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';
import type { RosterRow } from '@/modules/results/types/roster.types';

/** A closed set — the six tabs of the class detail, never a free string. */
export type ResultsTabValue = (typeof RESULTS_TAB_ORDER)[number];

/**
 * A closed set — the four skill scopes of the class shell (`Teacher Portal v2`
 * `:601–638`), written once in `lib/skill-scope.ts`.
 */
export type SkillScopeValue = (typeof SKILL_SCOPE_ORDER)[number];

/** Mutually exclusive states of a live read: error beats pending beats emptiness. */
export type ResultsReadStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface ResultsReadCounts {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  itemCount: number;
}

/** The class-detail header (`Teacher Portal v2.dc.html:520–548`) over the ONE C-TD-1 read. */
export interface ClassResultsHeaderProps {
  classCard: DashboardClass;
  /** The teacher's own classes — the switcher's options, from the same cached read. */
  classes: readonly DashboardClass[];
  onSwitchClass: (classDocumentId: string) => void;
}

/** The six tab bodies below the sticky header; each renders in one `data-tab-panel` box. */
export interface ClassResultsTabPanelsProps {
  classDocumentId: string;
  rows: RosterRow[];
  /** `?session=<sittingId>` — the sitting a Monitor link opened, handed to the Live tab. */
  sessionId: string | null;
}

/**
 * The ONE coming-soon body, two scopes: title and description are the caller's
 * (the class shell and the student page word them differently — S06a vs S04d);
 * the four skill status chips are class-scope only.
 */
export interface ComingSoonPanelProps {
  title: string;
  description: string;
  showSkillChips?: boolean;
  /** Padding differs per scope (class 44/24/20, Exit predictions 44/24/30). */
  className?: string;
}

/** Tab, skill and sitting as the class-detail URL carries them (`?tab=&skill=&session=`). */
export interface ClassDetailParams {
  tab: ResultsTabValue;
  skill: SkillScopeValue;
  session: string | null;
}

/** One tab or skill change; the other URL params ride along untouched. */
export type ClassDetailPatch = Partial<Pick<ClassDetailParams, 'tab' | 'skill'>>;

export interface ClassDetailParamsState extends ClassDetailParams {
  setTab: (next: ResultsTabValue) => void;
  setSkill: (next: SkillScopeValue) => void;
  /** Opens another of the teacher's classes on the same tab and skill. */
  switchClass: (classDocumentId: string) => void;
}

/**
 * The class-detail header's two overlays: "Reports and data" (`:1626–1705`) and
 * the class Ask AI drawer (`:550–596`). The header publishes the request; each
 * overlay mounts once and subscribes. One overlay at a time.
 */
export interface ClassOverlaysState {
  reportsOpen: boolean;
  askAiOpen: boolean;
  openReports: () => void;
  openAskAi: () => void;
  close: () => void;
}

export interface ClassResultsScreenProps {
  classDocumentId: string;
}
