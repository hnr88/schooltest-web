import type { AttributeName } from '@schooltest/scoring-contracts';

import type { RosterReleaseState, RosterRow } from '@/modules/results';
import type { StudentsTabRow } from '@/modules/teacher/types/v2-class-tabs.types';
import type { PhaseView, ViewTone } from '@/modules/teacher/types/v2-view-common.types';

export type ExpectedKind = 'at' | 'approaching' | 'below';

export interface ExpectedView {
  kind: ExpectedKind;
  labelKey: string;
  tone: ViewTone;
}

export interface ReleaseStatusView {
  kind: RosterReleaseState;
  labelKey: string;
  tone: ViewTone;
}

export interface ReleaseActions {
  preview: boolean;
  release: boolean;
  recall: boolean;
}

export type ReportsAudience = 'parents' | 'teachers' | 'principal' | 'admin';

export interface ReportsView {
  rows: StudentsTabRow[];
  scored: number;
  total: number;
}

export interface CarerLine {
  attribute: AttributeName;
  key: string;
}

export interface CarerReportView {
  studentDocumentId: string;
  resultDocumentId: string;
  name: string;
  firstName: string;
  initials: string;
  score: number | null;
  expected: ExpectedView | null;
  phase: PhaseView | null;
  status: ReleaseStatusView;
  satAt: string | null;
  summaryKey: string;
  canDo: CarerLine[];
  next: CarerLine[];
  ealdNoteKey: string | null;
  actions: Pick<ReleaseActions, 'release' | 'recall'>;
}

export interface FamilyReportsPanelProps {
  classDocumentId: string;
  rows: RosterRow[];
}

export interface ReportsDownloadsApi {
  downloadPdf: (row: StudentsTabRow) => void;
  downloadAll: () => void;
  pdfPendingId: string | null;
}

export interface ReportsAudiencePickerProps {
  value: ReportsAudience;
  titleId: string;
  onChange: (audience: ReportsAudience) => void;
}

export interface ReportsClassCardProps {
  className: string;
  audience: ReportsAudience;
  scored: number;
  total: number;
}

export interface ReportsStudentListProps {
  view: ReportsView;
  audience: ReportsAudience;
  downloads: ReportsDownloadsApi;
}
