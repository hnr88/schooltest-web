import { SCHOOL_DAY } from '@/modules/teacher/constants/start-session.constants';
import type {
  ScheduleError,
  ScheduleInput,
  SessionWindowIso,
  ZonedParts,
} from '@/modules/teacher/types/start-session-modal.types';

const HOURS_MINUTES = /^(\d{2}):(\d{2})$/;
const MINUTE_MS = 60_000;

/** "HH:MM" → minutes after midnight; anything else is NaN, never 0. */
export function minutesOf(hm: string): number {
  const match = HOURS_MINUTES.exec(hm);
  if (!match) return Number.NaN;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** The design's `schedErrs`, rule for rule and in its order (`:3575–3581`). */
export function scheduleErrors({ date, opens, closes, timeLimit, today, nowHm }: ScheduleInput): ScheduleError[] {
  const errors: ScheduleError[] = [];
  if (!date) errors.push({ key: 'pickDate' });
  else if (date < today) errors.push({ key: 'datePassed' });

  const start = minutesOf(opens);
  const end = minutesOf(closes);
  const window = end - start;
  if (Number.isNaN(start) || Number.isNaN(end)) errors.push({ key: 'setBothTimes' });
  else if (start < SCHOOL_DAY.opensMinutes || end > SCHOOL_DAY.closesMinutes) errors.push({ key: 'outsideHours' });
  else if (window <= 0) errors.push({ key: 'closeBeforeOpen' });
  else if (window < timeLimit) errors.push({ key: 'windowShort', values: { window, limit: timeLimit } });

  if (date === today && start < minutesOf(nowHm)) errors.push({ key: 'earlierToday' });
  return errors;
}

function partsIn(instant: Date, timeZone: string): Record<string, string> {
  const format = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  return Object.fromEntries(format.formatToParts(instant).map((part) => [part.type, part.value]));
}

/** An instant as the school-zone calendar date and wall clock. */
export function zonedParts(instant: Date, timeZone: string): ZonedParts {
  const parts = partsIn(instant, timeZone);
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

function offsetMs(instant: number, timeZone: string): number {
  const parts = partsIn(new Date(instant), timeZone);
  const wall = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return wall - Math.floor(instant / MINUTE_MS) * MINUTE_MS;
}

/** A school-zone date + "HH:MM" → the UTC instant, correct across DST (two passes). */
export function zonedWallTimeToIso(date: string, time: string, timeZone: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const minutes = minutesOf(time);
  const wall = Date.UTC(year, month - 1, day, Math.floor(minutes / 60), minutes % 60);
  const first = wall - offsetMs(wall, timeZone);
  return new Date(wall - offsetMs(first, timeZone)).toISOString();
}

export function addDaysIso(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** The window the server is sent, or null while the inputs cannot form one. */
export function windowIso(
  date: string,
  opens: string,
  closes: string,
  timeZone: string,
): SessionWindowIso | null {
  if (!date || Number.isNaN(minutesOf(opens)) || Number.isNaN(minutesOf(closes))) return null;
  return {
    opens_at: zonedWallTimeToIso(date, opens, timeZone),
    closes_at: zonedWallTimeToIso(date, closes, timeZone),
  };
}

/** Half-open windows: one closing as the next opens does not overlap it. */
export function windowsOverlap(aOpens: string, aCloses: string, bOpens: string, bCloses: string): boolean {
  return Date.parse(aOpens) < Date.parse(bCloses) && Date.parse(bOpens) < Date.parse(aCloses);
}

/** The browser's zone — the school zone until a booking echoes the server's. */
export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
