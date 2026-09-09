import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * The C-11 report list read (GET /api/my/students/results, no `class`) against
 * the REAL SERVED BYTES.
 *
 * `tests/fixtures/my-students-results-wire.json` is a VERBATIM two-row capture
 * of that endpoint's live response (throwaway Strapi on :5507 over the dev
 * database, teacher@schooltest.local) — one current-model reading row and one
 * `scoring_failed` row, exactly as the wire carried them. It is a wire capture,
 * not a hand-written payload: the whole point of this test is that the portal's
 * own schema parses what the server actually sends.
 *
 * THE DEFECT THIS GUARDS. The server validated this array against its v1
 * `ResultView` — whose per-attribute member is strict `{status, prob, prob_se,
 * items, delta}` — while every current-model row stores the v2 measures
 * (`domain_score`/`se`/`items_seen`). So the endpoint answered 400 for the whole
 * list and this hook could only ever render the error fallback. The server now
 * dispatches per row, and this fixture is both rows of that dispatch.
 */

vi.mock('@/lib/axios/strapi', () => ({
  strapi: { get: vi.fn() },
}));

import { strapi } from '@/lib/axios/strapi';

import { fetchMyStudentResults } from '@/modules/report/queries/use-my-student-results.query';
import { getDisplayLabelState } from '@/modules/report/lib/display-label';

const get = vi.mocked(strapi.get);

const wire = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/fixtures/my-students-results-wire.json'), 'utf8'),
) as Array<Record<string, unknown>>;

beforeEach(() => {
  get.mockReset();
});

describe('the teacher report list read (GET /api/my/students/results)', () => {
  test('parses the live served bytes — a current-model row and a scoring_failed row', async () => {
    get.mockResolvedValueOnce({ data: wire });

    const rows = await fetchMyStudentResults();

    expect(rows).toHaveLength(2);
    // The v2 arm: the shared contract view, with the v2 measures the v1 schema
    // used to reject.
    const scored = rows[0] as { document_id: string; status: string; attributes: Record<string, unknown> };
    expect(scored.status).toBe('complete');
    expect(Object.keys(scored.attributes).length).toBeGreaterThan(0);
    // The v1 arm: a failed sitting is a ROW, not a dropped one — it is how the
    // teacher learns the sitting produced no report.
    expect((rows[1] as { status: string }).status).toBe('scoring_failed');
  });

  test('`history` is absent on a list row — the payload is not the single-result read', async () => {
    get.mockResolvedValueOnce({ data: wire });

    const rows = await fetchMyStudentResults();

    expect(rows.every((row) => !('history' in row))).toBe(true);
  });

  test('every row renders: the list row reads only fields BOTH views carry', async () => {
    get.mockResolvedValueOnce({ data: wire });

    const rows = await fetchMyStudentResults();

    // The four fields the C-11 list row reads, plus the phase-state helper the
    // list screen calls — over both arms, so a v1 row cannot crash the list it
    // belongs on.
    for (const row of rows) {
      const view = row as { document_id: string; status: string; acara_phase: string | null; published_at: string | null };
      expect(typeof view.document_id).toBe('string');
      expect(typeof view.status).toBe('string');
      expect(['derived', 'pending', 'not_applicable']).toContain(getDisplayLabelState(row));
    }
  });

  test('the strict parse is load-bearing: a leaked key on any row rejects', async () => {
    get.mockResolvedValueOnce({ data: [{ ...wire[0], leaked_student_name: 'Amelia Ngo' }] });

    await expect(fetchMyStudentResults()).rejects.toThrowError(/leaked_student_name|Unrecognized|invalid/i);
  });
});
