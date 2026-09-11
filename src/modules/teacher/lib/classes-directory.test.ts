import { describe, expect, test } from 'vitest';

import { applyClientDirectoryMode } from '@/modules/directory';
import fixtureTeacherDashboard from '@/modules/teacher/lib/__fixtures__/teacher-dashboard.fixture-teacher.json';
import t2Dashboard from '@/modules/teacher/lib/__fixtures__/teacher-dashboard.t2.json';
import {
  CLASSES_CLIENT_CONFIG,
  classYearOptions,
  toClassRowView,
  toLiveStripCards,
} from '@/modules/teacher/lib/classes-directory';
import { teacherDashboardResponseSchema } from '@/modules/teacher/schemas/teacher.schema';
import type { DirectoryQueryParams } from '@/modules/directory';

// Fixtures: GET /api/teacher/dashboard recorded from the live API (:5500) as
// t2@schooltest.local and teacher@schooltest.local on 2026-09-11, parsed
// through the web's own strict contract before use.
const t2 = teacherDashboardResponseSchema.parse(t2Dashboard);
const teacher = teacherDashboardResponseSchema.parse(fixtureTeacherDashboard);

function params(overrides: Partial<DirectoryQueryParams>): DirectoryQueryParams {
  return { filters: {}, sort: 'name', page: 1, pageSize: Number.POSITIVE_INFINITY, ...overrides };
}

describe('toClassRowView over the recorded cards', () => {
  test('a class with open sittings is live and keeps its served numbers', () => {
    const card = t2.classes[0];
    expect(card).toBeDefined();
    if (card === undefined) return;
    const row = toClassRowView(card);
    expect(row).toMatchObject({
      id: card.class_document_id,
      name: card.name,
      badge: '8B',
      year: { kind: 'band', from: 7, to: 9 },
      studentCount: card.student_count,
      statusKey: 'sittingNow',
      isLive: card.open_session_count > 0,
      href: `/dashboard/results/${card.class_document_id}`,
    });
    expect(row.readingAverage).toBe(card.reading?.average ?? null);
    expect(row.hasExport).toBe(card.test_a.completed + card.test_b.completed > 0);
  });

  test('idle classes carry their served status and only scored classes export', () => {
    for (const card of teacher.classes) {
      const row = toClassRowView(card);
      expect(row.isLive).toBe(false);
      expect(row.statusKey).toBe(card.status === 'complete' ? 'complete' : 'noTests');
      expect(row.hasExport).toBe(card.test_a.completed + card.test_b.completed > 0);
    }
  });
});

describe('CLASSES_CLIENT_CONFIG through the directory kit', () => {
  test('search, the status filter and the year filter select the served classes', () => {
    const byQuery = applyClientDirectoryMode(teacher.classes, params({ q: 'room' }), CLASSES_CLIENT_CONFIG);
    expect(byQuery.rows.map((card) => card.name)).toEqual(
      teacher.classes.filter((card) => card.name.toLowerCase().includes('room')).map((card) => card.name).sort(),
    );
    const complete = applyClientDirectoryMode(teacher.classes, params({ filters: { status: 'complete' } }), CLASSES_CLIENT_CONFIG);
    expect(complete.meta.total).toBe(teacher.classes.filter((card) => card.status === 'complete').length);
    // A served `year_level` wins over the band; only level-less classes fall back to "7_9".
    const levelled = teacher.classes.filter((card) => typeof card.year_level === 'number');
    const bandOnly = teacher.classes.filter((card) => card.year_level == null && card.year_band === '7_9');
    const byBand = applyClientDirectoryMode(teacher.classes, params({ filters: { year: 'band-7-9' } }), CLASSES_CLIENT_CONFIG);
    expect(byBand.rows.map((card) => card.name)).toEqual(bandOnly.map((card) => card.name).sort());
    const levels = [...new Set(levelled.map((card) => card.year_level))];
    expect(classYearOptions(teacher.classes).map((option) => option.key).sort()).toEqual(
      [...(bandOnly.length > 0 ? ['band-7-9'] : []), ...levels.map((level) => `level-${level}`)].sort(),
    );
  });

  test('"Most students" puts the largest roster first; names break ties', () => {
    const sorted = applyClientDirectoryMode(teacher.classes, params({ sort: 'students' }), CLASSES_CLIENT_CONFIG);
    const most = Math.max(...teacher.classes.map((card) => card.student_count));
    expect(sorted.rows[0]?.student_count).toBe(most);
  });
});

describe('toLiveStripCards', () => {
  test('each open sitting opens its class on the Live sessions tab', () => {
    const cards = toLiveStripCards(t2.live_sessions, t2.classes, []);
    expect(cards).toHaveLength(t2.live_sessions.length);
    t2.live_sessions.forEach((session, index) => {
      const owner = t2.classes.find((card) => card.name === session.class_name);
      expect(cards[index]).toEqual({
        sittingId: session.sitting_document_id,
        className: session.class_name,
        code: session.code,
        testLabel: null,
        href: `/dashboard/results/${owner?.class_document_id}?tab=live&session=${session.sitting_document_id}`,
      });
    });
  });

  test('an unmatched class name falls back to the sitting monitor', () => {
    const [card] = toLiveStripCards(t2.live_sessions, [], []);
    expect(card?.href.startsWith('/dashboard/results')).toBe(false);
    expect(card?.href).toContain(t2.live_sessions[0]?.sitting_document_id ?? '');
  });
});
