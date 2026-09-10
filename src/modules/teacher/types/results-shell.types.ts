import type { ReactNode } from 'react';

import type { RESULTS_TAB_ORDER } from '@/modules/teacher/constants/results.constants';
import type { SKILL_SCOPE_ORDER } from '@/modules/teacher/lib/skill-scope';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';
import type { ClassStudentsResponse } from '@/modules/teacher/types/teacher-result.types';

/** A closed set — the four tabs of .qa/DESIGN.md §Results, never a free string. */
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

export interface ResultsClassRowProps {
  classCard: DashboardClass;
  /**
   * teacher/06 — the layout axis's two renderings of ONE class. `'cell'` is the
   * class column's content inside the kit's whole-row anchor (no Link of its
   * own, or the row would nest interactives); `'tile'` owns its whole-card
   * anchor, as §L-rownav requires of non-table layouts.
   */
  variant: 'cell' | 'tile';
}

export interface ClassResultsHeaderProps {
  className: string;
  studentCount: number;
  summary: ClassStudentsResponse['summary'];
}

/**
 * One cell of the class-detail summary header. `pill` carries the not-yet count
 * of the top gap — the band is spelled out in WORDS there, never colour alone;
 * `note` explains a `null` the server sent rather than filling it with a zero.
 */
export interface ClassResultsStatItem {
  key: string;
  label: string;
  value: string;
  pill?: string;
  note?: string;
}

export interface ClassResultsStatProps {
  item: ClassResultsStatItem;
}

/**
 * The tab frame is a FRAME: each panel's content arrives as a node so tasks 041,
 * 044 and 045 fill their own tab without editing the shell. The tab VALUE is
 * controlled by the screen, because hiding the strip for a non-reading skill
 * must not lose the teacher's tab ("Reading restores the previous tab",
 * `:4579` + `:3089`).
 */
export interface ClassResultsTabsProps {
  value: ResultsTabValue;
  onValueChange: (next: ResultsTabValue) => void;
  students: ReactNode;
  insights: ReactNode;
  progress: ReactNode;
  /** teacher/08 — the folded live console; absent keeps the panel honestly empty. */
  live?: ReactNode;
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
}

/** The header class select, over the same cached C-TD-1 `classes[]` the screen reads. */
export interface ClassSwitcherProps {
  options: ReadonlyArray<{ value: string; label: string }>;
  value: string;
  onValueChange: (next: string) => void;
}

export interface ClassResultsScreenProps {
  classDocumentId: string;
}
