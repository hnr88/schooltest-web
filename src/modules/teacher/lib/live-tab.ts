import { isAxiosError } from 'axios';

import {
  CONTROL_CONFLICT_REASONS,
  HISTORY_SHOWN,
  PAUSABLE_STATES,
  SITTING_TOGGLE_KEYS,
  WORKING_STATES,
} from '@/modules/teacher/constants/live-tab.constants';
import { isLiveSitting } from '@/modules/teacher/lib/live-rollup';
import { DEFAULT_SITTING_SETTINGS, type SittingSettings } from '@/modules/teacher/schemas/teacher-session.schema';
import type {
  CloseConfirmFacts,
  ConnectionCounts,
  ControlConflictReason,
  ControlFailure,
  HistoryRow,
  RoomState,
} from '@/modules/teacher/types/live-tab.types';
import type {
  MonitorSitting,
  MonitorStudent,
  TeacherTestSession,
} from '@/modules/teacher/types/teacher-session.types';

/**
 * The class Live tab ("Test day", Teacher Portal v2.dc.html:1022–1291) derived from
 * C-TS-2 rows and the C-TS-3 monitor. Pure; every number is the server's.
 */

/** `?session=` when it names a live sitting, else the first live one; a booking or a closed row never. */
export function selectLiveSitting(
  rows: readonly TeacherTestSession[],
  sessionId: string | null,
): TeacherTestSession | null {
  const live = rows.filter(isLiveSitting);
  return live.find((row) => row.sitting_document_id === sessionId) ?? live[0] ?? null;
}

/** Joined, in progress, stalled or paused — who a close cuts off. */
export function workingStudents(students: readonly MonitorStudent[]): MonitorStudent[] {
  return students.filter((student) => WORKING_STATES.has(student.state));
}

/** Whether a room pause would stop anyone (design: nobody In progress, Joined or Stalled ⇒ "Nobody is working"). */
export function hasPausable(students: readonly MonitorStudent[]): boolean {
  return students.some((student) => PAUSABLE_STATES.has(student.state) && student.paused !== true);
}

export function connectionCounts(students: readonly MonitorStudent[]): ConnectionCounts {
  const working = workingStudents(students);
  const count = (connection: 'online' | 'weak' | 'offline') =>
    working.filter((student) => student.connection === connection).length;
  return { online: count('online'), weak: count('weak'), offline: count('offline'), working: working.length };
}

export function roomState(sitting: MonitorSitting): RoomState {
  const paused = sitting.paused === true;
  return {
    paused,
    pausedAt: paused ? (sitting.paused_at ?? null) : null,
    extraMinutes: Math.round((sitting.extra_seconds ?? 0) / 60),
    extensions: sitting.extensions ?? 0,
  };
}

/** A never-written column is the defaults the server merges onto (C-SIT-SETTINGS). */
export function effectiveSettings(settings: SittingSettings | null | undefined): SittingSettings {
  return settings ?? DEFAULT_SITTING_SETTINGS;
}

/** "n of 10 on" counts the ten toggles; the time limit is always set. */
export function settingsOnCount(settings: SittingSettings): number {
  return SITTING_TOGGLE_KEYS.filter((key) => settings[key]).length;
}

const firstName = (displayName: string): string => displayName.trim().split(/\s+/)[0] ?? displayName;

export function closeConfirmFacts(students: readonly MonitorStudent[]): CloseConfirmFacts {
  const working = workingStudents(students);
  return {
    working: working.length,
    firstNames: working.slice(0, 3).map((student) => firstName(student.display_name)),
    moreCount: Math.max(0, working.length - 3),
    offline: working.filter((student) => student.connection === 'offline').length,
    notJoined: students.filter((student) => student.state === 'not_joined').length,
  };
}

function conflictReason(data: unknown): ControlConflictReason | null {
  const details = (data as { error?: { details?: { reason?: unknown } } } | null)?.error?.details;
  return CONTROL_CONFLICT_REASONS.find((reason) => reason === details?.reason) ?? null;
}

/** A room control's refusal: the 409 `details.reason`, 404 unknown/foreign, 400 refused body. */
export function controlFailure(error: unknown): ControlFailure {
  if (!isAxiosError(error) || error.response === undefined) return 'failed';
  const { status, data } = error.response;
  if (status === 404) return 'not_found';
  if (status === 400) return 'invalid';
  if (status === 409) return conflictReason(data) ?? 'failed';
  return 'failed';
}

const ranSession = (row: TeacherTestSession): boolean =>
  row.phase !== 'cancelled' && row.phase !== 'scheduled' && row.opened_at !== null;

function toHistoryRow(row: TeacherTestSession): HistoryRow {
  return {
    documentId: row.sitting_document_id,
    test: row.form?.label ?? null,
    code: row.code,
    openedAt: row.opened_at,
    completed: row.completed,
    expected: row.stats?.expected ?? row.expected,
    isLive: isLiveSitting(row),
  };
}

/** Previous sessions: the live sittings first, then the newest sessions that ran (never a cancelled booking). */
export function historyRows(
  open: readonly TeacherTestSession[],
  closed: readonly TeacherTestSession[],
  limit: number = HISTORY_SHOWN,
): HistoryRow[] {
  const live = open.filter(isLiveSitting);
  const liveIds = new Set(live.map((row) => row.sitting_document_id));
  const ran = closed.filter((row) => ranSession(row) && !liveIds.has(row.sitting_document_id));
  return [...live, ...ran.slice(0, limit)].map(toHistoryRow);
}

/** More ran sessions exist than the table shows: beyond the limit on this page, or on later pages. */
export function historyIsTruncated(
  closed: readonly TeacherTestSession[],
  total: number,
  limit: number = HISTORY_SHOWN,
): boolean {
  return closed.filter(ranSession).length > limit || total > closed.length;
}

export function clockLabel(iso: string, locale: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    ...(timeZone ? { timeZone } : {}),
  }).format(new Date(iso));
}

/** "31 Aug" in English (the design's date, composed like the booking window's), the locale's own elsewhere. */
export function dayMonthLabel(iso: string, locale: string, timeZone?: string): string {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    ...(timeZone ? { timeZone } : {}),
  };
  const value = new Date(iso);
  if (locale !== 'en') return new Intl.DateTimeFormat(locale, options).format(value);
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value ?? '';
  return `${part('day')} ${part('month')}`;
}
