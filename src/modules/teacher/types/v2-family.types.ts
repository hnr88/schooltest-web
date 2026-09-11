import type { AttributeName } from '@schooltest/scoring-contracts';

import type { RosterReleaseState } from '@/modules/results';
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
