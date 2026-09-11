import { describe, expect, test } from 'vitest';

import fixture from '@/modules/teacher/lib/__fixtures__/start-session.t2.json';
import { busyStudents, sittingsNeedingMonitor } from '@/modules/teacher/lib/student-availability';
import {
  teacherTestSessionsResponseSchema,
  testSessionMonitorResponseSchema,
} from '@/modules/teacher/schemas/teacher-session.schema';
import type { TeacherTestSession } from '@/modules/teacher/types/teacher-session.types';

// Recorded from the live API as t2 (Reading 8B): two open WHOLE-CLASS sittings,
// each holding one student in an in-progress (stalled) session; the rest of the
// roster never joined either of them.
const open = teacherTestSessionsResponseSchema.parse(fixture.open).sessions;
const monitors = Object.fromEntries(
  Object.entries(fixture.monitors).map(([id, body]) => [id, testSessionMonitorResponseSchema.parse(body)]),
);
const rosterIds = fixture.roster.map((row) => row.student.document_id);
const inProgress = Object.values(monitors).flatMap((monitor) =>
  monitor.students.filter((student) => student.state === 'stalled').map((student) => student.student_document_id),
);

describe('sittingsNeedingMonitor', () => {
  test('every open whole-class sitting, and only those', () => {
    expect(sittingsNeedingMonitor(open)).toEqual(open.map((row) => row.sitting_document_id));
    const named: TeacherTestSession = { ...open[0], member_student_ids: [rosterIds[0]] };
    const booking: TeacherTestSession = { ...open[1], phase: 'scheduled' };
    expect(sittingsNeedingMonitor([named, booking])).toEqual([]);
  });
});

describe('busyStudents — the server rule (sitting/lib/members.ts)', () => {
  test('a whole-class sitting holds only its in-progress students', () => {
    const busy = busyStudents(open, monitors);
    expect([...busy.keys()].sort()).toEqual([...inProgress].sort());
    for (const sitting of open) {
      const held = monitors[sitting.sitting_document_id].students.find((student) => student.state === 'stalled');
      expect(busy.get(held!.student_document_id)).toEqual({ kind: 'sitting', formLabel: sitting.form?.label });
    }
  });

  test('a student who never joined a whole-class sitting is free', () => {
    const neverJoined = monitors[open[0].sitting_document_id].students.find((s) => s.state === 'not_joined');
    expect(busyStudents(open, monitors).has(neverJoined!.student_document_id)).toBe(false);
  });

  test('a sitting of named students holds every member, whatever their state', () => {
    const named: TeacherTestSession = { ...open[0], member_student_ids: [rosterIds[0], rosterIds[1]] };
    expect([...busyStudents([named], {}).keys()]).toEqual([rosterIds[0], rosterIds[1]]);
  });

  test('a booking or a closed sitting holds nobody; an unanswered monitor holds nobody yet', () => {
    const booking: TeacherTestSession = { ...open[0], phase: 'scheduled', member_student_ids: [rosterIds[0]] };
    const closed: TeacherTestSession = { ...open[1], status: 'closed', phase: 'closed', member_student_ids: [rosterIds[1]] };
    expect(busyStudents([booking, closed], monitors).size).toBe(0);
    expect(busyStudents(open, {}).size).toBe(0);
  });
});
