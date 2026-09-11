import type { AttributeName } from '@schooltest/scoring-contracts';

import type { RosterReleaseState, RosterRow } from '@/modules/results';
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

export type FamilyFilter = 'all' | 'held' | 'released' | 'blocked';

export interface FamilyReportsOptions {
  filter?: FamilyFilter;
}

export interface FamilyReportRow {
  studentDocumentId: string;
  resultDocumentId: string | null;
  name: string;
  initials: string;
  status: ReleaseStatusView;
  whyKey: string;
  releasedAt: string | null;
  score: number | null;
  expected: ExpectedView | null;
  actions: ReleaseActions;
}

export interface FamilyCounts {
  total: number;
  scored: number;
  released: number;
  held: number;
  recalled: number;
  open: number;
  blocked: number;
  noResult: number;
}

export interface BannerTone extends ViewTone {
  border: string;
}

export interface FamilyBanner {
  kind: 'incomplete' | 'complete';
  open: number;
  blocked: number;
  tone: BannerTone;
}

export interface FamilyReportsView {
  filter: FamilyFilter;
  rows: FamilyReportRow[];
  counts: FamilyCounts;
  banner: FamilyBanner | null;
  releasableResultIds: string[];
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

export type FamilyConfirm =
  | { kind: 'release'; row: FamilyReportRow }
  | { kind: 'recall'; row: FamilyReportRow }
  | { kind: 'releaseAll' }
  | { kind: 'nothingHeld' };

export interface FamilyFailureGroup {
  reasonKey: string;
  names: string[];
}

export interface ReleaseBatchSummary {
  tone: 'ok' | 'warn' | 'error';
  released: number;
  total: number;
  failures: FamilyFailureGroup[];
}

export interface FamilyReportsPanelProps {
  classDocumentId: string;
  rows: RosterRow[];
}

export interface FamilyReportActions {
  confirm: FamilyConfirm | null;
  reason: string;
  error: string | null;
  pending: boolean;
  setReason: (reason: string) => void;
  askRelease: (row: FamilyReportRow) => void;
  askRecall: (row: FamilyReportRow) => void;
  askReleaseAll: () => void;
  close: () => void;
  run: () => void;
}

export interface FamilyReportsSummaryProps {
  counts: FamilyCounts;
  banner: FamilyBanner | null;
}

export interface FamilyReportRowItemProps {
  row: FamilyReportRow;
  onPreview: () => void;
  onRelease: () => void;
  onRecall: () => void;
}

export interface CarerReportPreviewProps {
  report: CarerReportView;
  classDocumentId: string;
  className: string;
  onClose: () => void;
  onRelease: () => void;
  onRecall: () => void;
}

export interface FamilyReportDialogsProps {
  actions: FamilyReportActions;
  counts: FamilyCounts;
  heldCount: number;
  className: string;
}

export interface RecallReportDialogProps {
  actions: FamilyReportActions;
  name: string;
}
