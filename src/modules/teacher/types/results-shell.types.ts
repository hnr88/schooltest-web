import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import type { RESULTS_TAB_ORDER } from '@/modules/teacher/constants/results.constants';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';
import type { ClassStudentsResponse } from '@/modules/teacher/types/teacher-result.types';

/** A closed set — the four tabs of .qa/DESIGN.md §Results, never a free string. */
export type ResultsTabValue = (typeof RESULTS_TAB_ORDER)[number];

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
 * 044 and 045 fill their own tab without editing the shell.
 */
export interface ClassResultsTabsProps {
  students: ReactNode;
  insights: ReactNode;
  progress: ReactNode;
}

export interface ClassResultsScreenProps {
  classDocumentId: string;
}

/**
 * A tab whose feature UI has not landed yet. It states that the tool is not on
 * the page — it issues no query, so it NEVER claims the class has no data.
 */
export interface ResultsTabPendingProps {
  slot: string;
  icon: LucideIcon;
  title: string;
  description: string;
}
