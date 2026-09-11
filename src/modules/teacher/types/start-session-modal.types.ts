import type { SittingSettings } from '@/modules/teacher/schemas/teacher-session.schema';
import type {
  StartSessionMode,
  StartSessionTab,
} from '@/modules/teacher/types/start-session.types';

/** "Whole class" (everyone free) or "Selected students". */
export type StudentScope = 'whole' | 'some';

export type SettingsSectionId = 'during' | 'access' | 'security' | 'timing';

/** The ten switches; `timeLimit` is the Timing section's select. */
export type SettingToggleKey = Exclude<keyof SittingSettings, 'timeLimit'>;

export type ScheduleErrorKey =
  | 'pickDate'
  | 'datePassed'
  | 'setBothTimes'
  | 'outsideHours'
  | 'closeBeforeOpen'
  | 'windowShort'
  | 'earlierToday';

export interface ScheduleError {
  key: ScheduleErrorKey;
  values?: { window: number; limit: number };
}

/** The schedule panel's inputs, with "today" and "now" read in the school's zone. */
export interface ScheduleInput {
  date: string;
  opens: string;
  closes: string;
  timeLimit: number;
  today: string;
  nowHm: string;
}

export interface ZonedParts {
  date: string;
  time: string;
}

export interface SessionWindowIso {
  opens_at: string;
  closes_at: string;
}

/** Why a roster student cannot be picked: in another open sitting, or booked in the window. */
export type BlockedReason =
  | { kind: 'sitting'; formLabel: string }
  | { kind: 'booked'; formLabel: string; opensAt: string };

export type BlockedMap = ReadonlyMap<string, BlockedReason>;

export interface RosterStudent {
  id: string;
  name: string;
}

export interface RosterEntry extends RosterStudent {
  blocked: BlockedReason | null;
  picked: boolean;
}

export interface StartSessionFormState {
  mode: StartSessionMode;
  tab: StartSessionTab;
  classId: string;
  formId: string;
  scope: StudentScope;
  picked: readonly string[];
  settings: SittingSettings;
  date: string;
  opens: string;
  closes: string;
  openSections: readonly SettingsSectionId[];
}

export type CtaLabelKey =
  | 'startDemo'
  | 'selectToStart'
  | 'selectToSchedule'
  | 'fixTiming'
  | 'start'
  | 'save'
  | 'schedule';

export interface CtaView {
  labelKey: CtaLabelKey;
  count: number;
  canGo: boolean;
}

/** A write the server refused, reduced to what the modal shows. */
export interface StartSessionFailure {
  message: string;
  scheduleMessages: string[];
  blocked: BlockedMap;
}

/** What a screen asked for when it opened the modal (the store's request fields). */
export interface StartSessionRequest {
  classId: string | null;
  mode: StartSessionMode | null;
  tab: StartSessionTab | null;
  studentIds: readonly string[];
}

/** What the modal is opened with, resolved against the teacher's real classes and tests. */
export interface StartSessionSeed {
  classId: string;
  formId: string;
  mode: StartSessionMode | null;
  tab: StartSessionTab | null;
  studentIds: readonly string[];
  tomorrow: string;
}

export interface StartSessionFormActions {
  setMode: (mode: StartSessionMode) => void;
  setTab: (tab: StartSessionTab) => void;
  setClass: (classId: string) => void;
  setTest: (formId: string) => void;
  setScope: (scope: StudentScope) => void;
  setDate: (date: string) => void;
  setOpens: (opens: string) => void;
  setCloses: (closes: string) => void;
  setTimeLimit: (timeLimit: number) => void;
  toggleSetting: (key: SettingToggleKey) => void;
  toggleStudent: (id: string) => void;
  toggleSection: (id: SettingsSectionId) => void;
}

export type StartSessionSourcesStatus = 'loading' | 'error' | 'noClasses' | 'noTests' | 'bookingGone' | 'ready';
