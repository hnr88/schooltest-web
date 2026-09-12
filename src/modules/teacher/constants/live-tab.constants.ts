import type { SittingSettings } from '@/modules/teacher/schemas/teacher-session.schema';
import type { ControlFailure } from '@/modules/teacher/types/live-tab.types';
import type { MonitorState } from '@/modules/teacher/types/teacher.types';

/** The ten toggles in the design's order (`settingDefs`); `timeLimit` is the 11th, numeric row. */
export const SITTING_TOGGLE_KEYS = [
  'lowBw',
  'skip',
  'review',
  'flag',
  'bigText',
  'lockdown',
  'focusFlag',
  'warn5',
  'autoSubmit',
  'showScore',
] as const satisfies readonly (keyof SittingSettings)[];

/** Still in the room (design `liveAll` filters): what a close cuts off and a pause stops. */
export const WORKING_STATES: ReadonlySet<MonitorState> = new Set(['joined', 'in_progress', 'stalled', 'paused']);

/** Who a room pause still reaches — anyone working who is not paused already. */
export const PAUSABLE_STATES: ReadonlySet<MonitorState> = new Set(['joined', 'in_progress', 'stalled']);

/** The room's "+5 min" / "+10 min" — the only grants the extend endpoint accepts. */
export const ROOM_EXTEND_MINUTES = [5, 10] as const;

/** How long "Copy code" reads "Copied" (design `live.copy`: 1.6 s). */
export const COPY_FLASH_MS = 1_600;

/** Session activity re-reads the trail on this cadence while the sitting is live. */
export const LIVE_ACTIVITY_POLL_MS = 10_000;

/** Previous sessions: one server page of the class's closed sittings, the newest shown. */
export const HISTORY_PAGE_SIZE = 50;
export const HISTORY_SHOWN = 10;

/** The 409 `details.reason` values a room or student control can answer. */
export const CONTROL_CONFLICT_REASONS = [
  'not_running',
  'already_paused',
  'not_paused',
  'no_active_attempt',
] as const;

/** `TeacherPortal.live.room.errors.<key>` per refusal. */
export const CONTROL_FAILURE_KEY: Readonly<Record<ControlFailure, string>> = {
  not_running: 'notRunning',
  already_paused: 'alreadyPaused',
  not_paused: 'notPaused',
  no_active_attempt: 'noActiveAttempt',
  not_found: 'notFound',
  invalid: 'invalid',
  failed: 'failed',
};

/** The "Run the sitting" cell eyebrows (design 11.5px/700 .07em; #9CA3AF drawn as #6B7280 for AA). */
export const LIVE_EYEBROW_CLASS = 'text-[11.5px] font-bold tracking-[0.07em] text-[#6B7280] uppercase';

/** Previous sessions columns (design flex bases, `:1271–1275`). */
export const HISTORY_COLUMNS = [
  { key: 'test', className: 'min-w-[180px] flex-[2_1_210px]' },
  { key: 'code', className: 'min-w-[100px] flex-[1_1_110px]' },
  { key: 'date', className: 'min-w-[80px] flex-[1_1_90px]' },
  { key: 'completed', className: 'min-w-[90px] flex-[1_1_100px]' },
  { key: 'status', className: 'min-w-[90px] flex-[1_1_100px]' },
] as const;
