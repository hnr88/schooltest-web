import { describe, expect, test } from 'vitest';

import { reportCrumbLabel } from '@/modules/report/lib/report-crumb';
import { drillDownCrumb } from '@/modules/teacher/lib/student-drill-down-view';

// A breadcrumb NAMES a record. Two J06 trails broke that: the report crumb read
// "Not derived yet" (its pending display label), and the drill-down's class
// crumb read the raw class documentId. These pin the naming rule at its source.

const skillLabel = (skill: string | null): string => (skill === 'reading' ? 'Reading' : 'Placement');
const formatDate = (iso: string): string => `on ${iso.slice(0, 10)}`;

describe('the report crumb names the report, never its finding', () => {
  test("skill and publish date — the list row's own identity", () => {
    expect(
      reportCrumbLabel(
        { skill: 'reading', published_at: '2026-09-11T03:20:00.000Z' },
        skillLabel,
        formatDate,
      ),
    ).toBe('Reading · on 2026-09-11');
  });

  test('an unpublished result names its skill alone', () => {
    expect(reportCrumbLabel({ skill: 'reading', published_at: null }, skillLabel, formatDate)).toBe(
      'Reading',
    );
  });
});

describe('the drill-down trail names the class, never its id', () => {
  const classId = 'qves8wrtl7r9ctw49jivm8gl';

  test('both names known: the class crumb carries the class NAME', () => {
    expect(drillDownCrumb('Amara Baptiste', 'Reading 8B — Alvarez', classId)).toEqual({
      label: 'Amara Baptiste',
      ancestors: { [`/dashboard/results/${classId}`]: 'Reading 8B — Alvarez' },
    });
  });

  test('an unknown class name publishes nothing — no id, no repeated student', () => {
    expect(drillDownCrumb('Amara Baptiste', null, classId)).toBeNull();
  });

  test('an unknown student publishes nothing', () => {
    expect(drillDownCrumb(null, 'Reading 8B — Alvarez', classId)).toBeNull();
  });
});
