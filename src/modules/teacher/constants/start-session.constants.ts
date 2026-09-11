import type {
  SettingToggleKey,
  SettingsSectionId,
} from '@/modules/teacher/types/start-session-modal.types';
import type { StartSessionMode, StartSessionTab } from '@/modules/teacher/types/start-session.types';

/** The "When" cards, in the design's order (`mWhenOptions`). */
export const START_SESSION_MODES: readonly StartSessionMode[] = ['now', 'later', 'demo'];

export const START_SESSION_TABS: readonly StartSessionTab[] = ['test', 'students', 'settings'];

/** Reading is the only live skill; the others render disabled (`mSkillOptions`). */
export const START_SESSION_SKILLS = [
  { key: 'reading', live: true },
  { key: 'listening', live: false },
  { key: 'speaking', live: false },
  { key: 'writing', live: false },
] as const;

/** The four accordions and their switches (`mSettingsDuring` … `mSettingsTiming`). */
export const SETTINGS_SECTIONS: readonly { id: SettingsSectionId; keys: readonly SettingToggleKey[] }[] = [
  { id: 'during', keys: ['skip', 'review', 'flag'] },
  { id: 'access', keys: ['bigText', 'lowBw'] },
  { id: 'security', keys: ['lockdown', 'focusFlag'] },
  { id: 'timing', keys: ['warn5', 'autoSubmit', 'showScore'] },
];

/** Only "During the test" is open when the modal opens. */
export const DEFAULT_OPEN_SECTIONS: readonly SettingsSectionId[] = ['during'];

export const TIME_LIMIT_OPTIONS = [30, 40, 50, 60] as const;

/** School hours 07:00–19:00, in minutes after midnight. */
export const SCHOOL_DAY = { opensMinutes: 420, closesMinutes: 1140 } as const;

/** The design's default window: tomorrow, 09:00–10:00. */
export const DEFAULT_WINDOW = { opens: '09:00', closes: '10:00' } as const;

export const TIME_INPUT_BOUNDS = { min: '07:00', max: '19:00', step: 300 } as const;

/**
 * Monitor states that hold an in-progress session — the only way a whole-class
 * sitting keeps a student busy (`sitting/lib/members.ts#busyStudentIds`).
 */
export const BUSY_MONITOR_STATES = ['joined', 'in_progress', 'stalled', 'paused'] as const;

/** The newest closed sittings read for "Last session" (cancelled bookings are skipped). */
export const LAST_SESSION_PAGE_SIZE = 20;

export const LIVE_TAB_HREF = (classId: string, sittingId: string) =>
  `/dashboard/results/${classId}?tab=live&session=${sittingId}`;

export const LIVE_SESSIONS_HREF = '/dashboard/test-sessions';
