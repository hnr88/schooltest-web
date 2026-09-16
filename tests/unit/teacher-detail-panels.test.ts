import { describe, expect, test } from 'vitest';

import {
  teacherActivitySchema,
  teacherReadingAverageSchema,
} from '@/modules/teachers/schemas/teachers.schema';

describe('SA-FAIL-5 — the reading-average contract mirror', () => {
  test('accepts the live wire shape, including measured numbers', () => {
    const parsed = teacherReadingAverageSchema.parse({
      teacher: {
        documentId: 't1',
        email: 't1@schooltest.local',
        first_name: 'Tara',
        last_name: 'Okonkwo',
      },
      classes_considered: 5,
      tests_completed: 12,
      scored_tests: 9,
      avg_reading_score: 39,
    });
    expect(parsed.avg_reading_score).toBe(39);
  });

  test('a NULL average is legal — nothing scored yet is a real state, not 0', () => {
    const parsed = teacherReadingAverageSchema.parse({
      teacher: { documentId: 't1', email: null, first_name: null, last_name: null },
      classes_considered: 0,
      tests_completed: 0,
      scored_tests: 0,
      avg_reading_score: null,
    });
    expect(parsed.avg_reading_score).toBeNull();
  });

  test('a drifted shape is rejected, not silently rendered', () => {
    expect(() =>
      teacherReadingAverageSchema.parse({ classes_considered: 5, avg_reading_score: 'high' }),
    ).toThrow();
  });
});

describe('SA-FAIL-5 — the recent-activity contract mirror', () => {
  test('accepts the live wire shape: opened + closed events, newest first', () => {
    const parsed = teacherActivitySchema.parse({
      events: [
        {
          type: 'sitting_opened',
          at: '2026-09-13T18:35:36.872Z',
          sitting: { documentId: 's1', code: 'snake34', status: 'open' },
          class: { documentId: 'c1', name: 'EAL/D 8A' },
        },
        {
          type: 'sitting_closed',
          at: '2026-09-12T09:00:00.000Z',
          sitting: { documentId: 's2', code: null, status: 'closed' },
          class: { documentId: null, name: null },
        },
      ],
      pagination: { page: 1, pageSize: 10, pageCount: 1, total: 2 },
    });
    expect(parsed.events).toHaveLength(2);
    expect(parsed.events.map((event) => event.type)).toEqual([
      'sitting_opened',
      'sitting_closed',
    ]);
  });

  test('an unknown event type is a contract breach, not a silent row', () => {
    expect(() =>
      teacherActivitySchema.parse({
        events: [
          {
            type: 'student_removed',
            at: '2026-09-13T18:35:36.872Z',
            sitting: { documentId: 's1', code: null, status: null },
            class: { documentId: null, name: null },
          },
        ],
        pagination: { page: 1, pageSize: 10, pageCount: 1, total: 1 },
      }),
    ).toThrow();
  });
});
