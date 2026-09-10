import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { beforeEach, describe, expect, test, vi } from 'vitest';

import { resultViewSchema } from '@schooltest/scoring-contracts';

import { DISPLAY_SKILL_ORDER, displaySkills } from '@/modules/results';
import { fetchClassExport } from '@/modules/results/queries/use-class-export.query';
import { fetchClassResults } from '@/modules/results/queries/use-class-results.query';
import { fetchResultExport } from '@/modules/results/queries/use-result-export.query';
import { fetchStudentResult } from '@/modules/results/queries/use-student-result.query';

/**
 * The results data layer, proven against the contract package's v2 fixture and
 * the captured mixed-population response. The mocked axios hands each fetcher
 * those wire shapes as `response.data`, so the same dispatching parse used by
 * the live hook is under test.
 */

vi.mock('@/lib/axios/strapi', () => ({
  strapi: { get: vi.fn() },
}));

import { strapi } from '@/lib/axios/strapi';

const get = vi.mocked(strapi.get);

const FIXTURES = resolve(process.cwd(), '../mvp/contracts/scoring/fixtures');
const resultViewFixture: Record<string, unknown> = JSON.parse(
  readFileSync(resolve(FIXTURES, 'result-view.json'), 'utf8'),
);
const diagnosticExportFixture: Record<string, unknown> = JSON.parse(
  readFileSync(resolve(FIXTURES, 'diagnostic-export.json'), 'utf8'),
);
const servedResultRows: Array<Record<string, unknown>> = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/fixtures/my-students-results-wire.json'), 'utf8'),
);
const scoringFailedFixture = servedResultRows.find((row) => row.status === 'scoring_failed');

if (scoringFailedFixture === undefined) {
  throw new Error('served result fixture must retain its scoring_failed population');
}

const legacyResultFixture = {
  ...scoringFailedFixture,
  document_id: 'res-legacy-0001',
  status: 'complete',
  model_version: 'legacy-r7',
  legacy_caveat: 'pilot_diagnostic_earlier_model',
  attributes: {
    Decoding: {
      status: 'developing',
      prob: 0.61,
      prob_se: 0.05,
      items: 6,
      delta: 0.08,
    },
  },
};
const listeningResultFixture = {
  ...legacyResultFixture,
  document_id: 'res-listening-0001',
  skill: 'listening',
  model_version: 'listening-r7/1',
  legacy_caveat: null,
};

beforeEach(() => {
  get.mockReset();
});

describe('the student-result read (GET /api/results/{id})', () => {
  test('parses the contract package’s own ResultView v2 fixture', async () => {
    get.mockResolvedValueOnce({ data: resultViewFixture });
    const payload = await fetchStudentResult('res-fixture-0001');
    expect(payload.kind).toBe('v2');
    if (payload.kind !== 'v2') throw new Error('fixture must dispatch to v2');
    const view = payload.view;
    expect(view.document_id).toBe('res-fixture-0001');
    expect(view.model_version).toBe('reading-3model/1');
    expect(view.overall.domain_score).toBe(74);
    expect(view.gate.passed).toBe(false);
    expect(view.history).toHaveLength(2);
  });

  test('rejects a payload with an extra key at the boundary (strict)', async () => {
    get.mockResolvedValueOnce({ data: { ...resultViewFixture, theta: 1.24 } });
    await expect(fetchStudentResult('res-fixture-0001')).rejects.toThrowError(/theta|Unrecognized|invalid/i);
  });

  test.each([
    ['legacy-r7', legacyResultFixture],
    ['listening', listeningResultFixture],
    ['scoring_failed', scoringFailedFixture],
  ])('dispatches the %s population through the legacy schema', async (_population, fixture) => {
    get.mockResolvedValueOnce({ data: fixture });

    const payload = await fetchStudentResult(String(fixture.document_id));

    expect(payload.kind).toBe('legacy');
    if (payload.kind !== 'legacy') throw new Error('fixture must dispatch to legacy');
    expect(payload.view.document_id).toBe(fixture.document_id);
  });

  test('accepts legacy audit posteriors and strips them at the boundary', async () => {
    get.mockResolvedValueOnce({ data: legacyResultFixture });

    const payload = await fetchStudentResult('res-legacy-0001');

    if (payload.kind !== 'legacy') throw new Error('fixture must dispatch to legacy');
    const entry = payload.view.attributes?.Decoding;
    expect(entry).toEqual({ status: 'developing', items: 6, delta: 0.08 });
    expect(entry).not.toHaveProperty('prob');
    expect(entry).not.toHaveProperty('prob_se');
  });

  // scoring/09 — the raised status (`manual_scoring`, the module's only enum
  // change) must parse through BOTH arms of this layer: the v1 legacy view it
  // is normally raised from, and a stamped v2 row. A parser that has not
  // widened throws on the unknown z.enum member.
  test('parses a RAISED (manual_scoring) row through the legacy arm', async () => {
    const raised = {
      ...scoringFailedFixture,
      document_id: 'res-raised-0001',
      status: 'manual_scoring',
    };
    get.mockResolvedValueOnce({ data: raised });

    const payload = await fetchStudentResult('res-raised-0001');

    expect(payload.kind).toBe('legacy');
    if (payload.kind !== 'legacy') throw new Error('raised fixture must dispatch to legacy');
    expect(payload.view.status).toBe('manual_scoring');
  });

  test('parses a RAISED status on a stamped v2 row through the v2 arm', async () => {
    const base = resultViewSchema.parse(resultViewFixture);
    const raised = { ...base, status: 'manual_scoring' as const };
    get.mockResolvedValueOnce({ data: raised });

    const payload = await fetchStudentResult(String(raised.document_id));

    expect(payload.kind).toBe('v2');
    if (payload.kind !== 'v2') throw new Error('raised v2 fixture must dispatch to v2');
    expect(payload.view.status).toBe('manual_scoring');
  });
});

describe('the class-results read (GET /api/my/students/results?class=)', () => {
  // Task 23 contract + scoring/10: ONE row per roster student, `result: null`
  // where no official Result exists, `release_state` on the row, and a v2
  // `result` carrying `history[]` (the package's 8-point window).
  test('parses the roster wrapper — a scored row and a result-less row', async () => {
    get.mockResolvedValueOnce({
      data: [
        {
          student: { document_id: 'stu-0001', name: 'Amelia Ngo', initials: 'AN', eald_flag: true },
          result: resultViewFixture,
          release_state: 'released',
        },
        {
          student: { document_id: 'stu-0002', name: 'Ben Carter', initials: 'BC', eald_flag: false },
          result: null,
          release_state: 'nosit',
        },
      ],
    });
    const rows = await fetchClassResults('cls-0001');
    expect(rows).toHaveLength(2);
    expect(rows[0].student.document_id).toBe('stu-0001');
    expect(rows[0].result?.overall.domain_score).toBe(74);
    // scoring/10: history is PRESENT on a roster v2 row and survives the parse.
    expect(rows[0].result?.history).toHaveLength(2);
    // The row-level release_state parses in both grains: result-grain beside a
    // Result, session-grain beside a null.
    expect(rows[0].release_state).toBe('released');
    expect(rows[1].result).toBeNull();
    expect(rows[1].release_state).toBe('nosit');
  });

  test('rejects a roster row with an extra key (strict)', async () => {
    get.mockResolvedValueOnce({
      data: [
        {
          student: { document_id: 'stu-0001', name: 'Amelia Ngo', initials: 'AN', eald_flag: false },
          result: null,
          release_state: 'open',
          leaked: true,
        },
      ],
    });
    await expect(fetchClassResults('cls-0001')).rejects.toThrowError(/leaked|Unrecognized|invalid/i);
  });

  test('rejects an unknown release_state arm (strict enum — the seven derivation arms only)', async () => {
    get.mockResolvedValueOnce({
      data: [
        {
          student: { document_id: 'stu-0001', name: 'Amelia Ngo', initials: 'AN', eald_flag: false },
          result: null,
          release_state: 'vanished',
        },
      ],
    });
    await expect(fetchClassResults('cls-0001')).rejects.toThrowError(/vanished|Unrecognized|invalid/i);
  });

  test('rejects a roster row MISSING release_state (strict — the key is not optional)', async () => {
    get.mockResolvedValueOnce({
      data: [
        { student: { document_id: 'stu-0001', name: 'Amelia Ngo', initials: 'AN', eald_flag: false }, result: null },
      ],
    });
    await expect(fetchClassResults('cls-0001')).rejects.toThrowError(/release_state|Unrecognized|invalid/i);
  });

  test('rejects a student block missing a field (strict)', async () => {
    get.mockResolvedValueOnce({
      data: [
        {
          student: { document_id: 'stu-0001', name: 'Amelia Ngo' },
          result: resultViewFixture,
          release_state: 'released',
        },
      ],
    });
    await expect(fetchClassResults('cls-0001')).rejects.toThrowError(/initials|eald|Unrecognized|invalid/i);
  });
});

describe('the diagnostic export read (GET /api/results/{id}/export?format=diagnostic_json)', () => {
  test('parses the contract package’s own export fixture', async () => {
    get.mockResolvedValueOnce({ data: diagnosticExportFixture });
    const bundle = await fetchResultExport('res-fixture-0001');
    expect(bundle.overall.domain_score).toBe(74);
    expect(Object.keys(bundle.skills)).toHaveLength(7);
    expect(bundle.caveats.length).toBeGreaterThanOrEqual(1);
  });

  test('rejects an export that leaks a posterior (strict)', async () => {
    get.mockResolvedValueOnce({
      data: { ...diagnosticExportFixture, overall: { domain_score: 74, prob: 0.74 } },
    });
    await expect(fetchResultExport('res-fixture-0001')).rejects.toThrowError(/prob|Unrecognized|invalid/i);
  });
});

// scoring/05 — the CLASS variant, covered the same way: one accepted payload
// and one that leaks a posterior and must reject. The nested bundle is the
// package fixture itself, so the class parse is exercised over the real wire
// shape rather than a hand-written stub of it.
describe('the class export read (GET /api/classes/{id}/export?format=diagnostic_json)', () => {
  const classPayload = (students: unknown[]) => ({
    class: { name: '5B', year_band: 'Year 5', student_count: 3, exported_count: 1 },
    students,
    caveats: ['Nothing here is aggregated across students or skills.'],
  });

  test('parses a class payload carrying all three per-student states', async () => {
    get.mockResolvedValueOnce({
      data: classPayload([
        { student_key: 'sk-001', state: 'exported', bundle: diagnosticExportFixture },
        { student_key: 'sk-002', state: 'awaiting_publication' },
        { student_key: 'sk-003', state: 'no_official_result' },
      ]),
    });
    const bundle = await fetchClassExport('cls-0001');
    // COUNTED, not merely present: a containment check cannot tell one correct
    // roster from a duplicated one.
    expect(bundle.students).toHaveLength(3);
    expect(bundle.students.map((s) => s.state)).toEqual([
      'exported',
      'awaiting_publication',
      'no_official_result',
    ]);
    const first = bundle.students[0]!;
    if (first.state !== 'exported') throw new Error('first row must be the exported arm');
    expect(first.bundle.overall.domain_score).toBe(74);
    expect(bundle.class.exported_count).toBe(1);
    expect(bundle.caveats.length).toBeGreaterThanOrEqual(1);
  });

  test('rejects a class payload whose NESTED bundle leaks a posterior (strict)', async () => {
    get.mockResolvedValueOnce({
      data: classPayload([
        {
          student_key: 'sk-001',
          state: 'exported',
          bundle: { ...diagnosticExportFixture, overall: { domain_score: 74, prob: 0.74 } },
        },
      ]),
    });
    await expect(fetchClassExport('cls-0001')).rejects.toThrowError(/prob|Unrecognized|invalid/i);
  });

  test('rejects a student row carrying a NAME — student_key is the only identifier', async () => {
    get.mockResolvedValueOnce({
      data: classPayload([
        { student_key: 'sk-001', state: 'no_official_result', name: 'Amelia Chen' },
      ]),
    });
    await expect(fetchClassExport('cls-0001')).rejects.toThrowError(/name|Unrecognized|invalid/i);
  });

  test('rejects an empty caveats array — the hedging travels with the data (.min(1))', async () => {
    get.mockResolvedValueOnce({
      data: { ...classPayload([]), caveats: [] },
    });
    await expect(fetchClassExport('cls-0001')).rejects.toThrowError(/caveat|at least|invalid/i);
  });

  test('rejects an unknown per-student state (neither union arm admits it)', async () => {
    get.mockResolvedValueOnce({
      data: classPayload([{ student_key: 'sk-001', state: 'pending_review' }]),
    });
    await expect(fetchClassExport('cls-0001')).rejects.toThrowError(/state|invalid|Unrecognized/i);
  });
});

describe('display-skills — the seven-tile mapping every screen uses', () => {
  test('the canonical order is exactly the seven display skills', () => {
    expect(DISPLAY_SKILL_ORDER).toEqual([
      'Decoding', 'Vocabulary', 'Grammar', 'Gist', 'Detail', 'Inference', 'Critical',
    ]);
  });

  test('Vocabulary reads the blend, Critical reads the gate, attributes map one-to-one', async () => {
    get.mockResolvedValueOnce({ data: resultViewFixture });
    const payload = await fetchStudentResult('res-fixture-0001');
    if (payload.kind !== 'v2') throw new Error('fixture must dispatch to v2');
    const view = payload.view;
    const tiles = displaySkills(view);

    expect(tiles.map((t) => t.skill)).toEqual([...DISPLAY_SKILL_ORDER]);
    const bySkill = new Map(tiles.map((t) => [t.skill, t]));
    expect(bySkill.get('Decoding')).toMatchObject({ domain_score: 92, status: 'secure', source: 'attribute' });
    expect(bySkill.get('Vocabulary')).toMatchObject({ domain_score: 76, status: 'secure', source: 'vocab' });
    expect(bySkill.get('Grammar')).toMatchObject({ domain_score: 72, status: 'secure' });
    expect(bySkill.get('Detail')).toMatchObject({ domain_score: 74, status: 'developing' });
    expect(bySkill.get('Inference')).toMatchObject({ domain_score: 80, status: 'secure' });
    expect(bySkill.get('Critical')).toMatchObject({ domain_score: 70, status: null, source: 'gate' });
  });

  test('not-assessed maps to null — never to 0 — and preserves band movement data', async () => {
    get.mockResolvedValueOnce({ data: resultViewFixture });
    const payload = await fetchStudentResult('res-fixture-0001');
    if (payload.kind !== 'v2') throw new Error('fixture must dispatch to v2');
    const view = payload.view;
    const bySkill = new Map(displaySkills(view).map((t) => [t.skill, t]));

    // The fixture's Gist is the literal not-assessed branch.
    expect(bySkill.get('Gist')).toEqual({ skill: 'Gist', domain_score: null, status: null, source: 'attribute' });

    // An attribute missing from the partial record maps to null too.
    const missing = { ...view, attributes: { ...view.attributes } };
    delete (missing.attributes as Record<string, unknown>).Inference;
    const tile = displaySkills(missing).find((t) => t.skill === 'Inference');
    expect(tile).toEqual({ skill: 'Inference', domain_score: null, status: null, source: 'attribute' });

    // Band-movement growth survives untouched for the tiles that carry it.
    expect(bySkill.get('Decoding')).toMatchObject({ status: 'secure' });
    const scored = view.attributes.Decoding;
    if (scored === undefined || scored.status === 'not_assessed') throw new Error('fixture drifted');
    expect(scored.band_before).toBe('developing');
    expect(scored.band_after).toBe('secure');
  });

  test('a null vocab blend or gate score maps to null, not 0', async () => {
    // Build the mutated payload from the SCHEMA-parsed fixture so the spread
    // is typed, then re-run it through the boundary parse under test.
    const base = resultViewSchema.parse(resultViewFixture);
    const view = {
      ...base,
      // The schema's biconditional: blended null exactly when status not_assessed.
      vocab: { ...base.vocab, blended: null, status: 'not_assessed' as const },
      gate: { ...base.gate, domain_score: null, passed: null },
    };
    get.mockResolvedValueOnce({ data: view });
    const payload = await fetchStudentResult('res-fixture-0001');
    if (payload.kind !== 'v2') throw new Error('fixture must dispatch to v2');
    const bySkill = new Map(displaySkills(payload.view).map((t) => [t.skill, t]));
    expect(bySkill.get('Vocabulary')?.domain_score).toBeNull();
    expect(bySkill.get('Critical')?.domain_score).toBeNull();
  });
});
