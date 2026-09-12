import type {
  LiveBatchKind,
  LiveConnection,
  LiveControlError,
  LiveFilter,
  LiveRowActionKey,
  LiveStudentStatus,
} from '@/modules/teacher/types/live-students.types';
import type { ToneChipTone } from '@/modules/teacher/types/teacher-kit.types';

/** Teacher Portal v2.dc.html:4117 — the Live tab's filter pills, in order. */
export const LIVE_FILTERS: readonly LiveFilter[] = [
  'all',
  'inProgress',
  'paused',
  'submitted',
  'attention',
  'notJoined',
];

/** :3319–3326 — "Needs attention" is Stalled + Scoring failed; "Not joined" is Not joined + Absent. */
export const LIVE_FILTER_STATUSES: Record<Exclude<LiveFilter, 'all'>, readonly LiveStudentStatus[]> = {
  inProgress: ['in_progress'],
  paused: ['paused'],
  submitted: ['submitted'],
  attention: ['stalled', 'scoring_failed'],
  notJoined: ['not_joined', 'absent'],
};

/** :3365 `chipFor` on the kit's tone pairs. */
export const LIVE_STATUS_TONE: Record<LiveStudentStatus, ToneChipTone> = {
  submitted: 'success',
  in_progress: 'navy',
  joined: 'navy',
  stalled: 'today',
  paused: 'today',
  absent: 'slate',
  not_joined: 'danger',
  scoring_failed: 'danger',
};

export const LIVE_CONNECTION_TONE: Record<LiveConnection, ToneChipTone> = {
  online: 'success',
  weak: 'today',
  offline: 'danger',
};

/** :4141–4166 minus "Send reminder" (no real mechanism). */
export const LIVE_BATCH_KINDS: readonly LiveBatchKind[] = ['pause', 'extend', 'rescore', 'absent'];

export const LIVE_BATCH_ELIGIBLE: Record<LiveBatchKind, readonly LiveStudentStatus[]> = {
  pause: ['in_progress', 'joined'],
  extend: ['in_progress', 'joined', 'paused', 'stalled'],
  rescore: ['submitted'],
  absent: ['not_joined', 'stalled'],
};

/** The single-student write each batch action loops over its eligible students. */
export const LIVE_BATCH_ACTION: Record<LiveBatchKind, LiveRowActionKey> = {
  pause: 'pause',
  extend: 'extend',
  rescore: 'rescore',
  absent: 'markAbsent',
};

/** "Allow 10 more minutes" / "Allow extra time". */
export const LIVE_EXTEND_MINUTES = 10;

/** The row actions that ask first (:3380–3500); the rest act on click. */
export const LIVE_CONFIRMED_ACTIONS: ReadonlySet<LiveRowActionKey> = new Set<LiveRowActionKey>([
  'markAbsent',
  'undoAbsent',
  'pause',
  'relaunch',
  'forceSubmit',
  'rescore',
  'raiseManual',
]);

export const LIVE_CONTROL_REASONS: readonly LiveControlError[] = [
  'not_running',
  'already_paused',
  'not_paused',
  'no_active_attempt',
];

/** `sittingActivityAppendSchema.note` max. */
export const LIVE_INCIDENT_NOTE_MAX = 120;
