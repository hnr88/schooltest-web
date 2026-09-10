import path from 'node:path';
import { mkdirSync, readFileSync } from 'node:fs';

import { expect, test, type BrowserContext, type Page, type Route } from '@playwright/test';

import { cat, icu } from './helpers/i18n';
import { formSignInCount, signedInContext } from './helpers/auth-state';
import { en } from './helpers/teacher-rail';

// Task 33 — Screen A, the class roster, proven against a FIXTURE roster payload
// served by route interception on `/api/my/students/results?class=` (the task 23
// contract: one row per roster student, `result: null` where no official Result
// exists). Sign-in is real; the roster data is not — the api half of task 23
// lands separately, and these assertions depend on the CONTRACT, not on which
// worker has shipped it yet.
//
// Done-when covered here: ONE network call serves the whole surface; an
// unscored row reads "No result yet" (never 0); the sort puts result-less rows
// LAST; the confidence marker appears only on flagged rows.

const noResultYet = cat(en, 'Teacher.results.students.noResultYet');
const flaggedLabel = cat(en, 'Teacher.results.students.flaggedLabel');
const flaggedTooltip = cat(en, 'Teacher.results.students.flaggedTooltip');

/** The API's own origin — page-relative /api/... resolves against :3002 (Next) and returns HTML. */
const apiBase = (): string => process.env.E2E_API_URL ?? 'http://127.0.0.1:5500';

const FIXTURE = JSON.parse(
  readFileSync(path.resolve(process.cwd(), '../mvp/contracts/scoring/fixtures/result-view.json'), 'utf8'),
) as Record<string, unknown>;

function view(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    ...FIXTURE,
    // scoring/10: the roster's v2 rows CARRY history (the old "omitted on this
    // read" contract is superseded) — the recorded golden base already has it.
    ...overrides,
    overall: { ...(FIXTURE.overall as Record<string, unknown>), ...(overrides.overall as object) },
  };
}

const student = (id: string, name: string) => ({ document_id: id, name, initials: '??', eald_flag: false });

function rosterPayload() {
  return [
    // Lowest score first, then higher, then the result-less students LAST.
    // scoring/10: every row carries release_state beside result (the strict
    // mirror rejects the row without it — the server derives it per row).
    { student: student('stu-a', 'Ada Becker'), result: view({ overall: { domain_score: 55, delta: 5, delta_reliable: true, delta_display: '+5' }, effort_valid: true, low_confidence: null }), release_state: 'released' },
    { student: student('stu-b', 'Ben Carter'), result: view({ overall: { domain_score: 80, delta: 12, delta_reliable: true, delta_display: '+12' }, effort_valid: true, low_confidence: null }), release_state: 'released' },
    { student: student('stu-c', 'Cem Demir'), result: view({ overall: { domain_score: 90, delta: -4, delta_reliable: true, delta_display: '-4' }, effort_valid: false, low_confidence: null }), release_state: 'released' },
    { student: student('stu-d', 'Dana Ekwe'), result: null, release_state: 'nosit' },
  ];
}

test.describe('task 33 — the class roster (Screen A)', () => {
  let rosterRequests: number;
  let page: Page;
  let context: BrowserContext;

  test.beforeEach(async ({ browser }) => {
    // ONE form sign-in for the whole file, reused as storage state. This used to
    // drive the real /sign-in form per TEST — six logins for six tests, against
    // an API that allows 20 per minute per IP shared with the api suite. The
    // pacing constant in teacher-rail is module state, so it cannot coordinate
    // across concurrent runs; the fixture removes the logins instead of pacing
    // them.
    ({ context, page } = await signedInContext(browser, 'teacher', {
      viewport: { width: 1280, height: 900 },
    }));
    rosterRequests = 0;
    await page.route('**/api/my/students/results*', async (route: Route) => {
      rosterRequests += 1;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rosterPayload()) });
    });
    await page.goto('/dashboard/results/cls-fixture-33');
    await expect(page.locator('[data-surface="teacher-class-results"]')).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
  });

  test.afterEach(async () => {
    await context.close();
  });

  // THE SAVING, ASSERTED RATHER THAN TRUSTED. The value of the fixture is a
  // number, and a number nothing checks decays the first time someone
  // reintroduces a per-test login. Six tests in this file; exactly ONE form
  // sign-in for all of them.
  test.afterAll(() => {
    expect(formSignInCount(), 'one form sign-in for the whole file').toBe(1);
  });

  test('ONE roster call serves the surface; the table renders the whole roster', async () => {
    expect(rosterRequests, 'exactly one roster read').toBe(1);
    await expect(page.locator('[data-slot="students-tab-panel"] [data-slot="table"]')).toBeVisible();
    await expect(page.locator('[data-slot="student-results-row"]')).toHaveCount(4);
    // The summary tiles describe the whole roster (4 students), from the same payload.
    await expect(page.locator('[data-slot="class-results-header"]')).toContainText(
      icu(cat(en, 'Teacher.results.detail.tileScoredValue'), { scored: '3', total: '4' }),
    );
  });

  test('an unscored student renders "No result yet" — never a 0', async () => {
    await expect(page.locator('[data-student-id="stu-d"]')).toBeVisible();
    await expect(page.locator('[data-student-id="stu-d"] [data-slot="roster-no-result"]')).toHaveText(noResultYet);
    const scoreCell = page.locator('[data-student-id="stu-d"] [data-slot="roster-score"]');
    await expect(scoreCell).not.toContainText('0');
  });

  test('sort puts the lowest score first and the result-less rows LAST', async () => {
    const rows = page.locator('[data-slot="student-results-row"]');
    await expect(rows.first()).toHaveAttribute('data-student-id', 'stu-a'); // 55
    await expect(rows.nth(1)).toHaveAttribute('data-student-id', 'stu-b'); // 80
    await expect(rows.nth(2)).toHaveAttribute('data-student-id', 'stu-c'); // 90
    await expect(rows.last()).toHaveAttribute('data-student-id', 'stu-d'); // no result: last
    await expect(rows.last()).toHaveAttribute('data-scored', 'false');
  });

  test('the confidence marker appears only on the flagged row', async () => {
    await expect(page.locator('[data-student-id="stu-c"] [data-slot="roster-confidence"]')).toHaveAttribute('data-flagged', 'true');
    // The cell's two texts do two jobs (ops/34): aria-label names the WARNING
    // ("Confidence warning"), the title tooltip explains it — assert each
    // against its own key.
    const flaggedCell = page.locator('[data-student-id="stu-c"] [data-slot="roster-confidence"]');
    await expect(flaggedCell).toHaveAttribute('aria-label', flaggedLabel);
    await expect(flaggedCell).toHaveAttribute('title', flaggedTooltip);
    for (const id of ['stu-a', 'stu-b']) {
      await expect(page.locator(`[data-student-id="${id}"] [data-slot="roster-confidence"]`)).toHaveAttribute('data-flagged', 'false');
    }
    // The result-less row is not flagged either: null is not false, and no
    // result is nothing to warn about.
    await expect(page.locator('[data-student-id="stu-d"] [data-slot="roster-confidence"]')).toHaveAttribute('data-flagged', 'false');
  });

  // SCORING/10 proof capture: the roster at the proof's mandated 1440×900.
  // Fixture-served, so the capture shows the real rendered rows regardless of
  // what the dev database holds.
  test('capture: the class results tab at 1440×900', async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const shots = path.resolve(process.cwd(), '../mvp/scoring/proof/shots');
    mkdirSync(shots, { recursive: true });
    await expect(page.locator('[data-slot="students-tab-panel"] [data-slot="table"]')).toBeVisible();
    await page.screenshot({ path: path.join(shots, '10-class-results-tab.png'), fullPage: false });
  });

  // SCORING/10 LIVE-WIRE half — the ONE unstubbed test of this leg. Drops the
  // interception and asks the REAL endpoint through the signed-in page, so the
  // run cannot stay green if the route 500s or vanishes. Rows may legitimately
  // be empty (scored students are disjoint from rosters in this dev DB) — the
  // assertion is status + wire KEY SET, never row counts. The fetch targets
  // the API base ABSOLUTELY: a page-relative /api/... hits the Next server and
  // returns HTML, which is a test bug, not a wire fact.
  test('live wire: the unstubbed endpoint serves the roster contract', async ({ }) => {
    await page.unroute('**/api/my/students/results*');
    const base = apiBase();
    const wire = await page.evaluate(async ({ base }: { base: string }): Promise<{
      status: number;
      contentType?: string;
      body?: unknown;
      error?: string;
    }> => {
      const token = window.localStorage.getItem('app.auth.token');
      const auth = { Authorization: `Bearer ${token ?? ''}` };
      // Content-type is asserted at the call site: 200 + text/html from the
      // wrong server is exactly the trap a bare status check falls for.
      const classesRes = await fetch(`${base}/api/classes?pagination[pageSize]=100`, { headers: auth });
      const classesCt = classesRes.headers.get('content-type') ?? '';
      const classesText = await classesRes.text();
      if (!classesCt.includes('application/json')) {
        return { status: classesRes.status, error: `non-JSON content-type from /api/classes (${classesCt}): ${classesText.slice(0, 120)}` };
      }
      const classesJson = JSON.parse(classesText);
      const classes = ((classesJson as { data?: Array<{ documentId: string }> }).data ?? []);
      let last: { status: number; contentType: string; body: unknown } | null = null;
      for (const cls of classes.slice(0, 3)) {
        const res = await fetch(`${base}/api/my/students/results?class=${cls.documentId}`, { headers: auth });
        const ct = res.headers.get('content-type') ?? '';
        const text = await res.text();
        if (!ct.includes('application/json')) {
          return { status: res.status, contentType: ct, error: `non-JSON content-type from roster read (${ct}): ${text.slice(0, 120)}` };
        }
        last = { status: res.status, contentType: ct, body: JSON.parse(text) };
        if (res.status === 200 && Array.isArray(last.body) && (last.body as unknown[]).length > 0) break;
      }
      return last ?? { status: 0, error: 'no roster fetch attempted — the teacher owns no classes' };
    }, { base });
    expect(wire).not.toBeNull();
    expect(wire!.status, 'the real endpoint must answer 200 unstubbed').toBe(200);
    expect(wire!.contentType, 'the wire must speak JSON, not the Next server’s HTML').toContain('application/json');
    expect(wire!.error, wire!.error ?? 'no transport error').toBeUndefined();
    expect(Array.isArray(wire!.body), 'the roster envelope is a bare array').toBe(true);
    const rows = (wire!.body ?? []) as Array<Record<string, unknown>>;
    for (const row of rows) {
      expect(Object.keys(row).sort(), 'the three-key wrapper').toEqual(['release_state', 'result', 'student']);
      expect(['held', 'released', 'recalled', 'manual', 'absent', 'open', 'nosit']).toContain(row.release_state);
      if (row.result !== null) {
        expect(Array.isArray((row.result as Record<string, unknown>).history), 'history[] on a v2 row').toBe(true);
      }
    }
    // Empty is honest (disjoint-rosters dev DB) — but SAY so rather than pass
    // silently: the attachment line is visible in the report either way.
    test.info().annotations.push({ type: 'roster-rows', description: String(rows.length) });
  });
});
