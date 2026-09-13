import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, test } from 'vitest';

import {
  teacherActivitySchema,
  teacherReadingAverageSchema,
} from '@/modules/teachers/schemas/teachers.schema';

// SA-FAIL-5 — the teacher detail page omitted the Recent activity panel and
// the avg-reading-score tile even though both APIs were live and agreeing
// (C-TCH-06/07). The wiring is now in, so three things are pinned:
//
//  1. THE CONTRACT MIRRORS: both zod schemas accept the server's exact wire
//     shapes — including the NULL avg when nothing was scored yet (a real
//     state that must render "no value", never 0) and the pagination block
//     the activity feed serves — and REJECT a drifted shape.
//  2. THE SCREEN WIRES BOTH: TeacherDetailScreen mounts both queries and the
//     panel/slot the design names, so a future cleanup cannot silently drop
//     the panels again.
//  3. THE COPY EXISTS: every new t() key the screen reads is present in the
//     en catalogue (next-intl has no en fallback — a missing key renders the
//     raw key path).

const SCREEN = resolve(
  process.cwd(),
  'src/modules/teachers/components/TeacherDetailScreen.tsx',
);

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

describe('SA-FAIL-5 — the screen wires both unserved gaps', () => {
  const source = readFileSync(SCREEN, 'utf8');

  test('both queries are mounted', () => {
    expect(source).toContain('useTeacherReadingAverageQuery(');
    expect(source).toContain('useTeacherActivityQuery(');
  });

  test('the design-named panel and the avg tile render', () => {
    expect(source).toContain('data-slot="teacher-recent-activity"');
    expect(source).toContain("t('stats.avgReading')");
    expect(source).toContain('activityQuery.data?.events');
  });

  test('no stale "deliberately absent" comment survives', () => {
    expect(source).not.toContain('deliberately absent');
    expect(source).not.toContain('no endpoint serves it');
  });

  test('every new t() key exists in the en catalogue (no en fallback)', () => {
    const en = JSON.parse(
      readFileSync(resolve(process.cwd(), 'src/i18n/messages/en.json'), 'utf8'),
    ) as { Teachers: { detail: { stats: Record<string, string>; activity: Record<string, string> } } };
    for (const key of ['avgReading']) {
      expect(typeof en.Teachers.detail.stats[key]).toBe('string');
    }
    for (const key of [
      'title',
      'opened',
      'closed',
      'unnamedClass',
      'empty',
      'errorTitle',
      'errorDescription',
    ]) {
      expect(typeof en.Teachers.detail.activity[key]).toBe('string');
    }
  });
});
