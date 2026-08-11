import path from 'node:path';

import { expect, test, type Locator, type Page, type Route } from '@playwright/test';

import { acaraMovementCards, progressView } from '@/modules/teacher/lib/class-progress';
import { classProgressResponseSchema } from '@/modules/teacher/schemas/teacher-progress.schema';
import type { ClassProgressResponse } from '@/modules/teacher/types/teacher-progress.types';

import { cat, icu } from './helpers/i18n';
import { en, SCREENSHOTS } from './helpers/teacher-rail';
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

async function openProgress(classDocumentId: string): Promise<Locator> {
  await openClassResults(page, classDocumentId);
  await page.getByRole('tab', { name: cat(en, 'Teacher.results.tabs.progress') }).click();
  const panel = page.locator('[data-slot="class-progress"]');
  await expect(panel).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
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
    icu(copy('avgScoreValue'), { from: num(view.summary.avg_a, 1), to: num(view.summary.avg_b, 1) }),
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
    const row = panel.locator(`[data-slot="progress-shift-row"][data-attribute="${entry.attribute}"]`);
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
    await expect(tile).toContainText(copy(`acara${card.key === 'same' ? 'Same' : card.key === 'up' ? 'Up' : 'Down'}`));
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

test.describe('Progress tab — populated state', () => {
  test('prints C-TR-4 verbatim for every class the teacher owns', async ({ playwright }) => {
    for (const classCard of live.classes) {
      const body = await readClassProgressLive(playwright, classCard.class_document_id);
      expect(body.available, `${classCard.name} must have a comparison to show`).toBe(true);

      const panel = await openProgress(classCard.class_document_id);
      await assertPopulated(panel, body);

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
    const panel = await openProgress(live.classes[0].class_document_id);

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

    // Ordered headings: the four <h2> panels (summary, shift, ACARA, watch) sit
    // under the page's own <h1>, and the two watch columns are their <h3>s.
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(panel.locator('h2')).toHaveCount(4);
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
  // No seeded class can answer `available: false` (both carry Test-B results), so
  // the branch is exercised by perturbing STRAPI'S OWN response in flight — the
  // same technique helpers/teacher-dashboard-live.ts documents: the real request
  // goes out, the real body comes back, and only the fields C-TR-4 itself pairs
  // with `available: false` are set. `cohort` is left EXACTLY as the server sent
  // it, which is what makes the assertion meaningful: the counts under the
  // placeholder are real, and the panel branched on the flag rather than on an
  // array it found empty.
  test('renders the placeholder with the real Test A / Test B counts', async ({ playwright }) => {
    const classDocumentId = live.classes[0].class_document_id;
    const body = await readClassProgressLive(playwright, classDocumentId);

    await page.route('**/api/teacher/classes/*/progress', async (route: Route) => {
      const response = await route.fetch();
      const wire = classProgressResponseSchema.parse(await response.json());
      await route.fulfill({
        response,
        json: {
          ...wire,
          available: false,
          summary: null,
          acara_movement: null,
          subskill_shift: [],
          most_improved: [],
          needs_attention: [],
        },
      });
    });

    try {
      await openClassResults(page, classDocumentId);
      await page.getByRole('tab', { name: cat(en, 'Teacher.results.tabs.progress') }).click();
      const panel = page.locator('[data-slot="class-progress"]');
      await expect(panel).toHaveAttribute('data-status', 'unavailable', { timeout: 20_000 });

      await expect(panel.locator('[data-slot="progress-empty"]')).toContainText(copy('emptyTitle'));
      await expect(panel.locator('[data-slot="progress-empty"]')).toContainText(
        copy('emptyDescription'),
      );
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

      // The populated blocks are absent — nothing is zero-filled in their place.
      await expect(panel.locator('[data-slot="progress-summary"]')).toHaveCount(0);
      await expect(panel.locator('[data-slot="progress-shift-table"]')).toHaveCount(0);
      await expect(panel.locator('[data-slot="progress-acara-card"]')).toHaveCount(0);

      await page.screenshot({
        path: path.join(SCREENSHOTS, 'task-045-progress-empty-state.png'),
        animations: 'disabled',
        fullPage: true,
      });
    } finally {
      await page.unroute('**/api/teacher/classes/*/progress');
    }
  });

  // Same in-flight perturbation, used on the other half of the invariant: a body
  // that claims a comparison but carries no summary must FAIL LOUD, because zeros
  // in a stat row would read as "the class did not move".
  test('a summary-less available:true body is reported, never drawn as zeros', async () => {
    const classDocumentId = live.classes[0].class_document_id;

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
    const body = await readClassProgressLive(playwright, live.classes[0].class_document_id);
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
