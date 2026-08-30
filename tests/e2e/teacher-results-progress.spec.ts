import path from 'node:path';

import { expect, test, type Locator, type Page, type Route } from '@playwright/test';

import { acaraMovementCards, progressView } from '@/modules/teacher/lib/class-progress';
import { classProgressResponseSchema } from '@/modules/teacher/schemas/teacher-progress.schema';
import type { ClassProgressResponse } from '@/modules/teacher/types/teacher-progress.types';

import { cat, icu } from './helpers/i18n';
import { comparableClasses, dbCohort, testAOnlyClass } from './helpers/teacher-progress-state';
import { en, SCREENSHOTS, signInTeacher } from './helpers/teacher-rail';
import {
  openClassResults,
  readClassProgressLive,
  readLiveResults,
  signedInTeacherPage,
  type LiveResults,
} from './helpers/teacher-results-live';

// Task 045 — the Progress tab, both states, against the RUNNING app. Every
// expected value is read from C-TR-4 itself (parsed by the shipped Zod mirror), so
// there is no expected-value literal here: a tab that printed its own numbers, or
// a server whose body drifted, fails this spec instead of passing it.
//
// Task 063 — `available` is PER CLASS, and this spec used to assert `true` for
// every class the teacher owns. That was a claim about the dataset dressed up as a
// claim about the contract: C-TR-4 answers `false` for a class no student has
// finished Test B in, and the blanket assertion is what blocked seeding the
// Test-A-only class brief flow 22 needs. Each class's state is now DERIVED from
// its own Postgres completion counts (`dbCompletedCount`, the probe that mirrors
// `attemptOf`) and the tab is asserted against the state that implies — populated
// or placeholder. Nothing here counts classes or assumes an order.

test.describe.configure({ mode: 'serial' });

const PROGRESS = 'Teacher.results.progress';
const copy = (key: string) => cat(en, `${PROGRESS}.${key}`);
const num = (value: number, digits = 0) =>
  new Intl.NumberFormat('en', { maximumFractionDigits: digits }).format(value);

/** Resolves a whole-message `{count, plural, ...}` key exactly as next-intl would. */
function plural(key: string, count: number): string {
  const body = copy(key)
    .replace(/^\{\w+,\s*plural,\s*/, '')
    .replace(/\}$/, '');
  const branches = new Map<string, string>();
  for (const match of body.matchAll(/(=?\w+)\s*\{([^{}]*)\}/g)) branches.set(match[1], match[2]);
  const branch =
    branches.get(`=${count}`) ??
    branches.get(new Intl.PluralRules('en').select(count)) ??
    branches.get('other') ??
    '';
  return branch.replace(/#/g, num(count));
}

const directionText = (value: number, digits = 0): string => {
  if (value > 0) return icu(copy('directionUp'), { change: num(Math.abs(value), digits) });
  if (value < 0) return icu(copy('directionDown'), { change: num(Math.abs(value), digits) });
  return copy('directionFlat');
};

let live: LiveResults;
let page: Page;

test.beforeAll(async ({ browser, playwright }) => {
  live = await readLiveResults(playwright);
  page = await signedInTeacherPage(browser);
});

test.afterAll(async () => {
  await page.close();
});

async function openProgress(
  classDocumentId: string,
  status: 'ready' | 'unavailable' | 'drift' = 'ready',
  target: Page = page,
): Promise<Locator> {
  await openClassResults(target, classDocumentId);
  await target.getByRole('tab', { name: cat(en, 'Teacher.results.tabs.progress') }).click();
  const panel = target.locator('[data-slot="class-progress"]');
  await expect(panel).toHaveAttribute('data-status', status, { timeout: 20_000 });
  return panel;
}

async function assertPopulated(panel: Locator, body: ClassProgressResponse): Promise<void> {
  const view = progressView(body);
  if (view.kind !== 'ready') throw new Error(`[e2e] C-TR-4 is not populated: ${view.kind}`);

  const summary = panel.locator('[data-slot="progress-summary"]');
  await expect(summary.getByRole('heading', { level: 2 })).toHaveText(copy('title'));
  await expect(summary).toContainText(plural('bothTests', body.cohort.both_tests));
  await expect(panel.locator('[data-slot="progress-caveat"]')).toHaveText(copy('caveat'));

  await expect(panel.locator('[data-stat="avg-change"]')).toContainText(
    icu(copy('avgScoreValue'), {
      from: num(view.summary.avg_a, 1),
      to: num(view.summary.avg_b, 1),
    }),
  );
  await expect(panel.locator('[data-stat="avg-change"]')).toContainText(
    directionText(view.summary.avg_delta, 1),
  );
  for (const [stat, value] of [
    ['improved', view.summary.improved],
    ['unchanged', view.summary.unchanged],
    ['regressed', view.summary.regressed],
  ] as const) {
    await expect(panel.locator(`[data-stat="${stat}"]`)).toContainText(
      icu(copy('ofCompared'), { count: num(value), compared: num(view.compared) }),
    );
  }

  const rows = panel.locator('[data-slot="progress-shift-row"]');
  await expect(rows).toHaveCount(view.shift.length);
  for (const entry of view.shift) {
    const row = panel.locator(
      `[data-slot="progress-shift-row"][data-attribute="${entry.attribute}"]`,
    );
    await expect(row.locator('th[scope="row"]')).toHaveText(entry.name);
    for (const mastered of [entry.a_mastered, entry.b_mastered]) {
      await expect(row).toContainText(
        icu(copy('masteredCount'), { mastered: num(mastered), compared: num(view.compared) }),
      );
    }
    await expect(row).toContainText(directionText(entry.change));
  }

  for (const card of acaraMovementCards(view.movement)) {
    const tile = panel.locator(`[data-slot="progress-acara-card"][data-movement="${card.key}"]`);
    await expect(tile).toContainText(num(card.count));
    await expect(tile).toContainText(
      copy(`acara${card.key === 'same' ? 'Same' : card.key === 'up' ? 'Up' : 'Down'}`),
    );
    await expect(tile.locator('[data-slot="progress-acara-step"]')).toHaveCount(card.detail.length);
    for (const step of card.detail) await expect(tile).toContainText(`${step.from} → ${step.to}`);
    if (card.improvedWithinPhase !== null) {
      await expect(tile).toContainText(
        icu(copy('acaraSameImproved'), { count: num(card.improvedWithinPhase) }),
      );
    }
  }

  for (const [variant, movers] of [
    ['most_improved', view.mostImproved],
    ['needs_attention', view.needsAttention],
  ] as const) {
    const column = panel.locator(`[data-slot="progress-watch-list"][data-variant="${variant}"]`);
    await expect(column.locator('[data-slot="progress-mover"]')).toHaveCount(movers.length);
    for (const mover of movers) {
      const row = column.locator(`[data-student-id="${mover.student_document_id}"]`);
      await expect(row).toContainText(mover.display_name);
      await expect(row).toContainText(
        icu(copy('moverScores'), { from: num(mover.score_a), to: num(mover.score_b) }),
      );
      await expect(row).toContainText(directionText(mover.delta));
    }
  }
}

/**
 * The placeholder state: the two REAL counts under it, and none of the populated
 * blocks zero-filled in their place.
 */
async function assertPlaceholder(panel: Locator, body: ClassProgressResponse): Promise<void> {
  const empty = panel.locator('[data-slot="progress-empty"]');
  await expect(empty).toContainText(copy('emptyTitle'));
  await expect(empty).toContainText(copy('emptyDescription'));
  await expect(panel.locator('[data-slot="progress-empty-counts"]')).toHaveText(
    icu(copy('emptyCounts'), {
      testA: icu(copy('completionValue'), {
        completed: num(body.cohort.test_a_completed),
        total: num(body.cohort.total),
      }),
      testB: icu(copy('completionValue'), {
        completed: num(body.cohort.test_b_completed),
        total: num(body.cohort.total),
      }),
    }),
  );
  await expect(panel.locator('[data-slot="progress-summary"]')).toHaveCount(0);
  await expect(panel.locator('[data-slot="progress-shift-table"]')).toHaveCount(0);
  await expect(panel.locator('[data-slot="progress-acara-card"]')).toHaveCount(0);
  await expect(panel.locator('[data-slot="progress-mover"]')).toHaveCount(0);
}

test.describe('Progress tab — populated state', () => {
  test('prints C-TR-4 verbatim for every class the teacher owns', async ({ playwright }) => {
    for (const classCard of live.classes) {
      const body = await readClassProgressLive(playwright, classCard.class_document_id);
      const db = dbCohort(classCard.class_document_id);

      // The cohort counts are the class's OWN Postgres counts, not the body echoed
      // back at itself — and `available` follows from them PER CLASS. A class with
      // no both-tests pair has nothing to compare and must answer `false`; the
      // equating gate (`RDG-DGNB-A-79.equating_status = 'equated'`, F-EQUATING-GATE)
      // is what makes every pair on this dataset comparable, so `both > 0` is
      // exactly the populated condition here.
      expect(body.cohort.test_a_completed, `${classCard.name} Test A completions`).toBe(db.testA);
      expect(body.cohort.test_b_completed, `${classCard.name} Test B completions`).toBe(db.testB);
      expect(body.cohort.both_tests, `${classCard.name} both-tests cohort`).toBe(db.both);
      expect(body.available, `${classCard.name} has ${db.both} comparable pair(s)`).toBe(
        db.both > 0,
      );

      const panel = await openProgress(
        classCard.class_document_id,
        body.available ? 'ready' : 'unavailable',
      );
      if (body.available) await assertPopulated(panel, body);
      else await assertPlaceholder(panel, body);

      await page.screenshot({
        path: path.join(SCREENSHOTS, `task-045-progress-${classCard.class_document_id}.png`),
        animations: 'disabled',
        fullPage: true,
      });
      // The shell scrolls internally, so the tab's lower blocks need their own
      // element shot to be visible in the evidence at all.
      await panel.screenshot({
        path: path.join(SCREENSHOTS, `task-045-progress-panel-${classCard.class_document_id}.png`),
        animations: 'disabled',
      });
    }
  });

  test('carries the three bands in TEXT and real table semantics', async () => {
    const panel = await openProgress(comparableClasses(live.classes)[0].class_document_id);

    // Every tinted pill prints a word: no band is conveyed by colour alone.
    const pills = panel.locator('[data-slot="status-pill"]');
    const count = await pills.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      expect((await pills.nth(index).innerText()).trim().length).toBeGreaterThan(0);
    }

    // Real headers: one <th scope="col"> per column, one <th scope="row"> per row.
    const table = panel.locator('[data-slot="progress-shift-table"]');
    await expect(table.locator('thead th[scope="col"]')).toHaveCount(4);
    const rows = await panel.locator('[data-slot="progress-shift-row"]').count();
    await expect(table.locator('tbody th[scope="row"]')).toHaveCount(rows);

    // Ordered headings: the five <h2> panels (summary, shift, ACARA, watch and the
    // task-046 AI export panel) sit under the page's own <h1>, and the two watch
    // columns are their <h3>s.
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(panel.locator('h2')).toHaveCount(5);
    await expect(panel.locator('h3')).toHaveCount(2);

    // The panel scrolls its table, never the document.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);

    await panel.locator('[data-slot="progress-watch"]').scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(SCREENSHOTS, 'task-045-progress-acara-and-watch.png'),
      animations: 'disabled',
    });
  });
});

test.describe('Progress tab — empty state', () => {
  // Task 063: this branch used to be reached by perturbing Strapi's own response in
  // flight, because no seeded class could answer `available: false`. One now can —
  // EAL/D 9A was seeded Test-A-only through .qa/seed-diagnostics.mjs and the live R
  // engine — so the perturbation is GONE and the placeholder is asserted against
  // the server's real body. Which class it is, is derived, never named.
  test('renders the placeholder with the real Test A / Test B counts', async ({
    browser,
    playwright,
  }) => {
    const teacherEmail = 't1@schooltest.local';
    const emptyLive = await readLiveResults(playwright, teacherEmail);
    const { class_document_id: id, name } = testAOnlyClass(emptyLive.classes);
    const body = await readClassProgressLive(playwright, id, teacherEmail);
    const db = dbCohort(id);

    expect(body.available, `${name} has no Test B completion`).toBe(false);
    expect(body.cohort.test_a_completed, `${name} Test A completions`).toBe(db.testA);
    expect(body.cohort.test_b_completed, `${name} Test B completions`).toBe(0);
    // Not an empty payload: an unavailable tab still carries the REAL counts.
    expect(body.cohort.test_a_completed).toBeGreaterThan(0);

    const emptyPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await signInTeacher(emptyPage, teacherEmail);
      const panel = await openProgress(id, 'unavailable', emptyPage);
      await assertPlaceholder(panel, body);
      await emptyPage.screenshot({
        path: path.join(SCREENSHOTS, 'task-045-progress-empty-state.png'),
        animations: 'disabled',
        fullPage: true,
      });
    } finally {
      await emptyPage.close();
    }
  });

  // Same in-flight perturbation, used on the other half of the invariant: a body
  // that claims a comparison but carries no summary must FAIL LOUD, because zeros
  // in a stat row would read as "the class did not move".
  test('a summary-less available:true body is reported, never drawn as zeros', async () => {
    const classDocumentId = comparableClasses(live.classes)[0].class_document_id;

    await page.route('**/api/teacher/classes/*/progress', async (route: Route) => {
      const response = await route.fetch();
      const wire = classProgressResponseSchema.parse(await response.json());
      await route.fulfill({ response, json: { ...wire, summary: null } });
    });

    try {
      await openClassResults(page, classDocumentId);
      await page.getByRole('tab', { name: cat(en, 'Teacher.results.tabs.progress') }).click();
      const panel = page.locator('[data-slot="class-progress"]');
      await expect(panel).toHaveAttribute('data-status', 'drift', { timeout: 20_000 });
      await expect(panel).toContainText(copy('driftTitle'));
      await expect(panel.locator('[data-slot="progress-stat"]')).toHaveCount(0);
    } finally {
      await page.unroute('**/api/teacher/classes/*/progress');
    }
  });

  test('the view function branches on the flag, not on empty arrays', async ({ playwright }) => {
    const body = await readClassProgressLive(
      playwright,
      comparableClasses(live.classes)[0].class_document_id,
    );
    expect(progressView(body).kind).toBe('ready');

    const unavailable = classProgressResponseSchema.parse({
      ...body,
      available: false,
      summary: null,
      acara_movement: null,
      subskill_shift: [],
      most_improved: [],
      needs_attention: [],
    });
    const view = progressView(unavailable);
    expect(view.kind).toBe('unavailable');
    expect(view.cohort).toEqual(body.cohort);

    // available: true with a missing summary is contract drift, never zeros.
    expect(progressView({ ...body, summary: null }).kind).toBe('drift');
  });
});
