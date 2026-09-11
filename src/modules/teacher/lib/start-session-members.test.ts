import { describe, expect, test } from 'vitest';

import fixture from '@/modules/teacher/lib/__fixtures__/start-session.t2.json';
import {
  bookedInWindow,
  freeIds,
  pickedFreeIds,
  rosterEntries,
  toRosterStudents,
} from '@/modules/teacher/lib/start-session-members';
import { busyStudents } from '@/modules/teacher/lib/student-availability';
import {
  teacherTestSessionsResponseSchema,
  testSessionMonitorResponseSchema,
} from '@/modules/teacher/schemas/teacher-session.schema';
import type { TeacherTestSession } from '@/modules/teacher/types/teacher-session.types';

// Recorded from the live API as t2 (Reading 8B): two open WHOLE-CLASS sittings,
// each holding one student in an in-progress (stalled) session.
const open = teacherTestSessionsResponseSchema.parse(fixture.open).sessions;
const monitors = Object.fromEntries(
  Object.entries(fixture.monitors).map(([id, body]) => [id, testSessionMonitorResponseSchema.parse(body)]),
);
const roster = toRosterStudents(fixture.roster);
const rosterIds = roster.map((student) => student.id);
const busy = busyStudents(open, monitors);
const inProgress = [...busy.keys()];

describe('free students and the roster picker', () => {
  test('free = the roster minus the busy, in roster order', () => {
    expect(freeIds(roster, busy)).toEqual(rosterIds.filter((id) => !inProgress.includes(id)));
    expect(freeIds(roster, busy)).toHaveLength(roster.length - inProgress.length);
  });

  test('a busy student can never count as picked', () => {
    const picked = [inProgress[0], rosterIds.find((id) => !inProgress.includes(id))!];
    expect(pickedFreeIds(roster, busy, picked)).toEqual([picked[1]]);
    const entry = rosterEntries(roster, busy, picked).find((row) => row.id === inProgress[0]);
    expect(entry).toMatchObject({ picked: false, blocked: { kind: 'sitting' } });
  });
});

describe('bookedInWindow — the design clash rule (:3560–3566)', () => {
  const booking: TeacherTestSession = {
    ...open[0],
    sitting_document_id: 'bk0000000000000000000001',
    phase: 'scheduled',
    code: null,
    member_student_ids: [rosterIds[2]],
    window: { opens_at: '2026-09-14T06:00:00.000Z', closes_at: '2026-09-14T07:00:00.000Z', timezone: 'Europe/Bucharest' },
  };
  const at = (hm: string) => `2026-09-14T${hm}:00.000Z`;

  test('an overlapping booking blocks its members, labelled with its form and school-zone start', () => {
    const booked = bookedInWindow([booking], { opens_at: at('06:30'), closes_at: at('07:30') }, '2026-09-14', null, rosterIds);
    expect(booked.get(rosterIds[2])).toEqual({ kind: 'booked', formLabel: open[0].form?.label, opensAt: '09:00' });
    expect(booked.size).toBe(1);
  });

  test('a window that only touches it, or the booking being edited, blocks nobody', () => {
    expect(bookedInWindow([booking], { opens_at: at('07:00'), closes_at: at('08:00') }, '2026-09-14', null, rosterIds).size).toBe(0);
    expect(
      bookedInWindow([booking], { opens_at: at('06:30'), closes_at: at('07:30') }, '2026-09-14', booking.sitting_document_id, rosterIds).size,
    ).toBe(0);
  });

  test('a whole-class booking blocks the roster; unreadable times block by the same date', () => {
    const whole = { ...booking, member_student_ids: null };
    expect(bookedInWindow([whole], { opens_at: at('06:30'), closes_at: at('06:45') }, '2026-09-14', null, rosterIds).size).toBe(
      rosterIds.length,
    );
    expect(bookedInWindow([booking], null, '2026-09-14', null, rosterIds).size).toBe(1);
    expect(bookedInWindow([booking], null, '2026-09-15', null, rosterIds).size).toBe(0);
  });
});
