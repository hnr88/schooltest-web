import type {
  TeacherTestSession,
  TestSessionBookedWindow,
} from '@/modules/teacher/types/teacher-session.types';

import { runSql } from './auth-db';

// S12 — the Live sessions specs' shared probes: who is free on a real roster
// (PostgreSQL), which C-TS-2 rows are live, and the school-zone clock the
// booking rules use (mirrors schooltest-api tests/e2e/teacher-v2-bookings.spec.ts).

/** Live = open and not a booking (a booking is `status: 'open'` too). */
export const liveOf = (rows: readonly TeacherTestSession[]): TeacherTestSession[] =>
  rows.filter((row) => row.status === 'open' && row.phase !== 'scheduled');

/** Active students of the class who sit nothing now: no open membership, no session in progress. */
export function freeStudents(classDocumentId: string): string[] {
  const out = runSql(`select s.document_id from students s
      join students_class_lnk l on l.student_id = s.id join classes c on c.id = l.class_id
     where c.document_id = '${classDocumentId}' and s.status = 'active'
       and not exists (select 1 from sessions se join sessions_student_lnk sl on sl.session_id = se.id
                        where sl.student_id = s.id and se.status = 'in_progress')
       and not exists (select 1 from sittings si join sittings_class_lnk scl on scl.sitting_id = si.id
                        where scl.class_id = c.id and si.status = 'open'
                          and jsonb_typeof(si.member_student_ids) = 'array'
                          and si.member_student_ids ? s.document_id)
     order by s.id`);
  return out ? out.split('\n').map((row) => row.trim()) : [];
}

/** The zone the server reads the class's school hours in (its window's zone, else the server's). */
export function schoolTimezone(classDocumentId: string): string {
  const zone = runSql(`select coalesce(max(aw.timezone), '') from classes c
      left join classes_test_window_lnk l on l.class_id = c.id
      left join assessment_windows aw on aw.id = l.assessment_window_id
     where c.document_id = '${classDocumentId}'`);
  return zone || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function wall(ms: number, timeZone: string): Record<string, string> {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(ms));
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

/** The school-zone calendar date (`YYYY-MM-DD`) of an instant. */
export function wallDate(ms: number, timeZone: string): string {
  const parts = wall(ms, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** The instant a school-zone date + `HH:MM` names (a second pass settles a DST edge). */
export function zonedIso(date: string, time: string, timeZone: string): string {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  const offsetAt = (ms: number): number => {
    const p = wall(ms, timeZone);
    return Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute)) - ms;
  };
  const first = target - offsetAt(target);
  return new Date(target - offsetAt(first)).toISOString();
}

/** The booking card's English window line, read in the booking's own zone ("Sat 12 Sep", "09:00"). */
export function whenLabel(booked: TestSessionBookedWindow): { date: string; start: string; end: string } {
  const zone = { timeZone: booked.timezone };
  const parts = new Intl.DateTimeFormat('en-US', {
    ...zone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).formatToParts(new Date(booked.opens_at));
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? '';
  const time = new Intl.DateTimeFormat('en-GB', { ...zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  return {
    date: `${part('weekday')} ${part('day')} ${part('month')}`,
    start: time.format(new Date(booked.opens_at)),
    end: time.format(new Date(booked.closes_at)),
  };
}
