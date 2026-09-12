import type { ReactNode } from 'react';

import type { RosterRow } from '@/modules/results';
import type { MonitorStudent } from '@/modules/test-day';
import type { TestSessionMonitorResponse } from '@/modules/teacher/types/teacher-session.types';

export type LiveMonitorTile = TestSessionMonitorResponse['students'][number];

/** The C-TS-3 eight-state vocabulary, exactly as the teacher monitor serves it. */
export type LiveStudentStatus = LiveMonitorTile['state'];

export type LiveConnection = 'online' | 'weak' | 'offline';

export type LiveFilter = 'all' | 'inProgress' | 'paused' | 'submitted' | 'attention' | 'notJoined';

/** One student card, merged from the two monitor reads and the class roster. */
export interface LiveStudentRow {
  studentId: string;
  name: string;
  /** From the sitting monitor; `null` there means the student has no email. */
  email: string | null;
  /** False when the sitting monitor has no row for this student (email unknown, not missing). */
  hasIdentity: boolean;
  status: LiveStudentStatus;
  stage: number | null;
  totalStages: number | null;
  inactiveMinutes: number | null;
  connection: LiveConnection | null;
  extraMinutes: number;
  sessionId: string | null;
  /**
   * This sitting's Result: the roster's for this session, the C-TS-3 tile's own
   * `result_document_id` (TB-37 — what a cold load has for a `scoring_failed`
   * attempt, which the roster reports as `result: null`), or one a force submit
   * returned.
   */
  resultId: string | null;
  /** The roster holds that Result as scored (`complete`, official). */
  resultScored: boolean;
  /** The roster says the student has no session at all (`release_state: nosit`). */
  neverSat: boolean;
  /** The attempt exists but holds no answers (server: `joined`, or paused/stalled with no progress). */
  emptyAttempt: boolean;
}

export interface LiveRowsInput {
  tiles: readonly LiveMonitorTile[];
  sittingRows: readonly MonitorStudent[];
  roster: readonly RosterRow[];
  forcedResults: ReadonlyMap<string, string>;
}

export type LiveRowActionKey =
  | 'markAbsent'
  | 'undoAbsent'
  | 'pause'
  | 'resume'
  | 'extend'
  | 'forceSubmit'
  | 'relaunch'
  | 'incident'
  | 'retry'
  | 'raiseManual'
  | 'review'
  | 'rescore';

export interface LiveRowAction {
  key: LiveRowActionKey;
  destructive: boolean;
}

export type LiveBatchKind = 'pause' | 'extend' | 'rescore' | 'absent';

export interface LiveBatchPlan {
  kind: LiveBatchKind;
  eligible: LiveStudentRow[];
  selectedCount: number;
}

export type LiveResitReason = 'absent' | 'scoringFailed' | 'neverSat';

export interface LiveResitEntry {
  studentId: string;
  name: string;
  reason: LiveResitReason;
}

export type LiveSelection = 'none' | 'some' | 'all';

/** Why a per-student write was refused: B2's 409 reasons, then the status-level fallbacks. */
export type LiveControlError =
  | 'not_running'
  | 'already_paused'
  | 'not_paused'
  | 'no_active_attempt'
  | 'notOnRoster'
  | 'badRequest'
  | 'conflict'
  | 'generic';

export type LiveDialog =
  | { type: 'row'; key: LiveRowActionKey; row: LiveStudentRow }
  | { type: 'batch'; plan: LiveBatchPlan }
  | { type: 'nothing'; kind: LiveBatchKind; selectedCount: number };

export interface LiveStudentsSectionProps {
  sittingId: string;
  classDocumentId: string;
  /** Rendered between the student board and "Waiting on a re-sit" (the design puts Session activity there). */
  afterBoard?: ReactNode;
}

/** The row's third line: a key under `detail.*` plus the numbers it interpolates. */
export interface LiveDetail {
  key: 'notJoined' | 'joined' | 'absent' | 'scoringFailed' | 'idle' | 'stage' | 'stageOnly';
  values?: Record<string, number>;
}

export interface LiveSelectBoxProps {
  state: LiveSelection;
  /** Accessible name — the design draws no visible label beside the box. */
  label: string;
  onToggle: () => void;
  className?: string;
}
