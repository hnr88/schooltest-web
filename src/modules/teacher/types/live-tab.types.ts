import type { CONTROL_CONFLICT_REASONS, ROOM_EXTEND_MINUTES } from '@/modules/teacher/constants/live-tab.constants';
import type { SittingSettings } from '@/modules/teacher/schemas/teacher-session.schema';
import type { BookingWindowView, LiveRollupBooking } from '@/modules/teacher/types/live-sessions.types';
import type {
  TeacherTestSession,
  TestSessionMonitorResponse,
} from '@/modules/teacher/types/teacher-session.types';

export type RoomExtendMinutes = (typeof ROOM_EXTEND_MINUTES)[number];
export type ControlConflictReason = (typeof CONTROL_CONFLICT_REASONS)[number];

/** Why a room control did not go through: the 409 reason, or the status class. */
export type ControlFailure = ControlConflictReason | 'not_found' | 'invalid' | 'failed';

/** The room as the monitor serves it. */
export interface RoomState {
  paused: boolean;
  /** When the pause in force began; null while the room runs. */
  pausedAt: string | null;
  extraMinutes: number;
  extensions: number;
}

/** "a online · b weak · c offline · of n still working", counted over the students still working. */
export interface ConnectionCounts {
  online: number;
  weak: number;
  offline: number;
  working: number;
}

/** What the Close sitting confirm names, from the monitor. */
export interface CloseConfirmFacts {
  working: number;
  /** The first three working students' first names, in the monitor's order. */
  firstNames: string[];
  moreCount: number;
  offline: number;
  notJoined: number;
}

/** One Previous sessions row. */
export interface HistoryRow {
  documentId: string;
  test: string | null;
  code: string | null;
  openedAt: string | null;
  completed: number;
  expected: number;
  isLive: boolean;
}

/** One confirm's filled-in copy. */
export interface ConfirmCopy {
  title: string;
  body: string;
  cta: string;
  cancel: string;
}

/** The confirm a room control opens first (design `live.roomToggle` / `live.extendOpts`). */
export type RoomConfirm = { kind: 'pause' } | { kind: 'nobody' } | { kind: 'extend'; minutes: RoomExtendMinutes };

/** The class card facts the header and the no-sitting subtitle print. */
export interface LiveTabClass {
  name: string;
  studentCount: number;
  yearLevel: number | null;
}

export interface LiveTabState {
  status: 'loading' | 'error' | 'ready';
  retry: () => void;
  klass: LiveTabClass | null;
  sitting: TeacherTestSession | null;
  settings: SittingSettings | null;
  monitor: TestSessionMonitorResponse | null;
  bookings: readonly LiveRollupBooking[];
  history: readonly HistoryRow[];
  historyTruncated: boolean;
  historyError: boolean;
}

export interface RoomControlsState {
  room: RoomState | null;
  confirm: RoomConfirm | null;
  isPending: boolean;
  onToggle: () => void;
  onExtend: (minutes: RoomExtendMinutes) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export type { BookingWindowView };
