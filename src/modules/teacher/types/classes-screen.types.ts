import type { ReactNode } from 'react';

import type {
  DirectoryClientResult,
  DirectoryFilterDef,
  DirectorySortDef,
  DirectoryStateApi,
} from '@/modules/directory';
import type { ResultsReadStatus } from '@/modules/teacher/types/results-shell.types';
import type { TeacherStatus } from '@/modules/teacher/types/teacher-kit.types';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';

/**
 * The Classes screen (`/dashboard/results`, Teacher Portal v2 `:57–216`), over
 * C-TD-1's class cards. `reading` and `year_level` are OPTIONAL on the wire (an
 * API build before they shipped omits them); the screen renders the design's
 * "—" while they are absent.
 */

/** The class's year: the served `year_level`, else the served `year_band`. */
export type ClassYear =
  | { kind: 'level'; level: number }
  | { kind: 'band'; from: number; to: number }
  | { kind: 'raw'; text: string };

export type ClassStatusKey = Exclude<TeacherStatus, 'live' | 'today'>;

/** One class as the list and tile bodies draw it — every value from C-TD-1. */
export interface ClassRowView {
  id: string;
  name: string;
  badge: string;
  year: ClassYear | null;
  studentCount: number;
  statusKey: ClassStatusKey;
  isLive: boolean;
  readingAverage: number | null;
  readingDelta: number | null;
  hasExport: boolean;
  href: string;
}

/** One navy card of the live strip (`:77–88`), from `live_sessions[]`. */
export interface LiveStripCardView {
  sittingId: string;
  className: string;
  code: string | null;
  testLabel: string | null;
  href: string;
}

export interface ClassesDirectory {
  state: DirectoryStateApi;
  view: DirectoryClientResult<DashboardClass>;
  filters: readonly DirectoryFilterDef[];
  sorts: readonly DirectorySortDef[];
}

export interface ClassExportPending {
  id: string;
  kind: 'pdf' | 'llm';
}

export interface ClassExportsApi {
  downloadPdf: (row: ClassRowView) => void;
  downloadLlm: (row: ClassRowView) => void;
  pending: ClassExportPending | null;
}

export interface ClassesLiveStripProps {
  cards: readonly LiveStripCardView[];
}

export interface ClassesToolbarProps {
  directory: ClassesDirectory;
}

export interface ClassesListBodyProps {
  status: ResultsReadStatus;
  directory: ClassesDirectory;
  exports: ClassExportsApi;
  onRetry: () => void;
}

export interface TeacherClassesTableProps {
  rows: readonly ClassRowView[];
  exports: ClassExportsApi;
  empty: ReactNode;
}

export interface TeacherClassRowProps {
  row: ClassRowView;
  exports: ClassExportsApi;
}

export interface TeacherClassTilesProps {
  rows: readonly ClassRowView[];
  empty: ReactNode;
}
