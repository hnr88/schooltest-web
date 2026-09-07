import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { beforeEach, describe, expect, test, vi } from 'vitest';

import { resultViewSchema } from '@schooltest/scoring-contracts';

import { DISPLAY_SKILL_ORDER, displaySkills } from '@/modules/results';
import { fetchClassResults } from '@/modules/results/queries/use-class-results.query';
import { fetchResultExport } from '@/modules/results/queries/use-result-export.query';
import { fetchStudentResult } from '@/modules/results/queries/use-student-result.query';

/**
 * Task 29 — the results data layer, proven against the REAL contract payloads
 * (mvp/contracts/scoring/fixtures). The mocked axios hands each fetcher the
 * fixture as `response.data`, so the fetcher's `schema.parse` — the same code
 * the live hook runs at the Axios boundary — is what is under test. No hand-
 * written payloads anywhere: only the contract package's own fixtures.
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

beforeEach(() => {
  get.mockReset();
});

describe('the student-result read (GET /api/results/{id})', () => {
  test('parses the contract package’s own ResultView v2 fixture', async () => {
    get.mockResolvedValueOnce({ data: resultViewFixture });
    const view = await fetchStudentResult('res-fixture-0001');
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
});

describe('the class-results read (GET /api/my/students/results?class=)', () => {
  test('parses a bare array of views, history omitted', async () => {
    const { history: _history, ...rosterRow } = resultViewFixture as Record<string, unknown>;
    get.mockResolvedValueOnce({ data: [rosterRow] });
    const rows = await fetchClassResults('cls-0001');
    expect(rows).toHaveLength(1);
    expect(rows[0].document_id).toBe('res-fixture-0001');
    expect('history' in rows[0]).toBe(false);
  });

  test('rejects a roster row with an extra key (strict)', async () => {
    get.mockResolvedValueOnce({ data: [{ ...(resultViewFixture as object), leaked: true }] });
    await expect(fetchClassResults('cls-0001')).rejects.toThrowError(/leaked|Unrecognized|invalid/i);
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

describe('display-skills — the seven-tile mapping every screen uses', () => {
  test('the canonical order is exactly the seven display skills', () => {
    expect(DISPLAY_SKILL_ORDER).toEqual([
      'Decoding', 'Vocabulary', 'Grammar', 'Gist', 'Detail', 'Inference', 'Critical',
    ]);
  });

  test('Vocabulary reads the blend, Critical reads the gate, attributes map one-to-one', async () => {
    get.mockResolvedValueOnce({ data: resultViewFixture });
    const view = await fetchStudentResult('res-fixture-0001');
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
    const view = await fetchStudentResult('res-fixture-0001');
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
    const parsed = await fetchStudentResult('res-fixture-0001');
    const bySkill = new Map(displaySkills(parsed).map((t) => [t.skill, t]));
    expect(bySkill.get('Vocabulary')?.domain_score).toBeNull();
    expect(bySkill.get('Critical')?.domain_score).toBeNull();
  });
});
