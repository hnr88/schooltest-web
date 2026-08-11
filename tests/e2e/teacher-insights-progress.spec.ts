import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { cat, icu } from './helpers/i18n';
import {
  flow19,
  flow20,
  flow23,
  flow23AfterReload,
  flow24,
} from './helpers/teacher-insights-flows';
import {
  dbClasses,
  dbCompletedCount,
  dbMasteryCuts,
  FORM_CODES,
} from './helpers/teacher-insights-live';
import { comparableClasses, testAOnlyClass } from './helpers/teacher-progress-state';
import {
  num,
  openExitPredictions,
  openProgress,
  progressCopy,
} from './helpers/teacher-insights-view';
import { en, SCREENSHOTS } from './helpers/teacher-rail';
import {
  readClassProgressLive,
  readLiveResults,
  signedInTeacherPage,
  type LiveResults,
} from './helpers/teacher-results-live';

// Task 056 — brief flows 19, 20, 22, 23, 24 and 26 (.qa/E2E-FLOWS.md) against the
// RUNNING app (:3000), the RUNNING Strapi (:5500) and the REAL Postgres on :5540.
// Every expected number is either C-TR-3/C-TR-4's own or recomputed from the DINA
// posteriors Postgres stores — there is no expected-value literal in this slice,
// and no request is intercepted, stubbed or perturbed anywhere in it.
//
// FLOW 22 was the one flow whose DOM could not be reached honestly: both seeded
// classes held completed Test B sittings, so C-TR-4 never answered
// `available: false`, and task 056 refused to manufacture the state. TASK 063
// closed the DATA gap instead — `.qa/seed-diagnostics.mjs` now seeds a third,
// Test-A-only class through the live R G-DINA engine — so flow 22 below asserts
// the REAL placeholder rendered from the REAL response. Nothing is intercepted,
// stubbed or perturbed anywhere in this spec, and no class is named in it: the
// Test-A-only class is found by its Postgres Test B count (`testAOnlyClass`).

test.describe.configure({ mode: 'serial' });

let live: LiveResults;
let page: Page;

test.beforeAll(async ({ browser, playwright }) => {
  live = await readLiveResults(playwright);
  page = await signedInTeacherPage(browser);
});

test.afterAll(async () => {
  await page.close();
});

const shot = async (name: string) => {
  await page.screenshot({
    path: path.join(SCREENSHOTS, `task-056-${name}.png`),
    animations: 'disabled',
    fullPage: true,
  });
};

test('flow 19 — insights bars express MASTERY, not gaps', async ({ playwright }) => {
  for (const card of live.classes) {
    const { best, worst } = await flow19(page, playwright, card.class_document_id);
    expect(best.attribute, `${card.name} extremes`).not.toBe(worst.attribute);
    await shot(`insights-${card.class_document_id}`);
  }
});

test('flow 20 — suggested groups partition the class by its PRIMARY gap', async ({ playwright }) => {
  const cuts = dbMasteryCuts();
  for (const card of live.classes) {
    const insights = await flow20(page, playwright, card.class_document_id, cuts);
    expect(insights.groups.length, `${card.name} groups`).toBeGreaterThan(0);
  }
});

test('flow 23 — after Test B, Progress shows the mastery shift and ACARA movement', async ({
  playwright,
}) => {
  // Flow 23 IS the A->B comparison, so it runs on the classes that HAVE one —
  // derived from Postgres, never assumed of every class (task 063).
  const cuts = dbMasteryCuts();
  for (const card of comparableClasses(live.classes)) {
    const view = await flow23(page, playwright, card.class_document_id, cuts);
    await shot(`progress-${card.class_document_id}`);
    await flow23AfterReload(page, card.class_document_id, view);
  }
});

test('flow 24 — Progress counts ONLY students who completed both tests', async ({ playwright }) => {
  // Same derivation: the both-tests-only rule can only be shown on a class that
  // has a both-tests cohort to exclude a student FROM.
  const cuts = dbMasteryCuts();
  let moved = false;
  for (const card of comparableClasses(live.classes)) {
    moved = (await flow24(page, playwright, card.class_document_id, cuts)) || moved;
    await shot(`cohort-${card.class_document_id}`);
  }
  // Non-vacuity: at least one excluded student really WOULD have moved a number.
  expect(moved, 'no excluded student masters anything — the rule proves nothing').toBe(true);
});

test('flow 22 — Progress before any Test B completion shows the empty-state placeholder', async ({
  playwright,
}) => {
  // Task 063 seeded the class this flow needs (EAL/D 9A: three students, Test A
  // through the live R engine, no Test B), so flow 22 is now asserted against the
  // REAL server response. It is found by its DATA — no class is named here — and
  // the negative half runs on every OTHER class in the same pass, which is what
  // makes the placeholder's presence a consequence of the Test B count rather
  // than of the page.
  const classes = dbClasses();
  expect(classes.length, `Postgres holds: ${classes.join(', ')}`).toBe(live.classes.length);

  const emptyCard = testAOnlyClass(live.classes);
  for (const card of live.classes) {
    const body = await readClassProgressLive(playwright, card.class_document_id);
    const dbTestB = dbCompletedCount(card.class_document_id, [FORM_CODES.B]);
    const dbTestA = dbCompletedCount(card.class_document_id, [FORM_CODES.A]);
    expect(body.cohort.test_b_completed, `${card.name} Test B completions`).toBe(dbTestB);
    expect(body.cohort.test_a_completed, `${card.name} Test A completions`).toBe(dbTestA);

    const panel = await openProgress(page, card.class_document_id);
    if (card.class_document_id === emptyCard.class_document_id) {
      expect(dbTestB, `${card.name} must hold NO Test B result`).toBe(0);
      expect(body.available, `${card.name} has nothing to compare`).toBe(false);
      await expect(panel).toHaveAttribute('data-status', 'unavailable');

      // The placeholder, with the class's REAL counts under it — `available: false`
      // is not an empty payload (C-TR-4), so `Test A: 3 / 3 · Test B: 0 / 3` is
      // measured evidence, and Test A being NON-zero is what makes it meaningful.
      const empty = panel.locator('[data-slot="progress-empty"]');
      await expect(empty).toHaveCount(1);
      await expect(empty).toContainText(progressCopy('emptyTitle'));
      await expect(empty).toContainText(progressCopy('emptyDescription'));
      await expect(panel.locator('[data-slot="progress-empty-counts"]')).toHaveText(
        icu(progressCopy('emptyCounts'), {
          testA: icu(progressCopy('completionValue'), {
            completed: num(body.cohort.test_a_completed),
            total: num(body.cohort.total),
          }),
          testB: icu(progressCopy('completionValue'), {
            completed: num(body.cohort.test_b_completed),
            total: num(body.cohort.total),
          }),
        }),
      );
      expect(body.cohort.test_a_completed, 'a placeholder over zero Test A proves nothing').toBeGreaterThan(0);

      // Nothing is zero-filled in the populated blocks' place.
      for (const slot of [
        'progress-summary',
        'progress-shift-table',
        'progress-acara-card',
        'progress-mover',
      ]) {
        await expect(panel.locator(`[data-slot="${slot}"]`)).toHaveCount(0);
      }
      await shot(`flow22-empty-${card.class_document_id}`);
    } else {
      // The converse on the same run: a class WITH Test B never shows it.
      expect(dbTestB, `${card.name} holds Test B results`).toBeGreaterThan(0);
      expect(body.available).toBe(true);
      await expect(panel).toHaveAttribute('data-status', 'ready');
      await expect(panel.locator('[data-slot="progress-empty"]')).toHaveCount(0);
    }
  }
});

test('flow 26 — Exit predictions carries a coming-soon badge and nothing actionable', async () => {
  const trigger = page.getByRole('tab', { name: cat(en, 'Teacher.results.tabs.exit') });
  const panel = await openExitPredictions(page, live.classes[0].class_document_id);

  await expect(trigger).toContainText(cat(en, 'Teacher.results.tabs.comingSoon'));
  await expect(trigger).toHaveAttribute('aria-selected', 'true');
  await expect(panel.getByRole('heading', { level: 2 })).toHaveText(
    cat(en, 'Teacher.results.exitPredictions.title'),
  );
  await expect(panel).toContainText(cat(en, 'Teacher.results.exitPredictions.badge'));
  await expect(panel).toContainText(cat(en, 'Teacher.results.exitPredictions.description'));

  // No actionable content: nothing to click, nothing to type into, and above all no
  // predicted figure — a number here would be data this platform has not measured.
  for (const role of ['button', 'link', 'textbox', 'progressbar', 'table'] as const) {
    await expect(panel.getByRole(role)).toHaveCount(0);
  }
  expect((await panel.innerText()).match(/\d/), 'a digit on an unbuilt prediction tab').toBeNull();

  // It IS the selected tab's panel — the badge is not decoration over a live tab.
  await expect(page.getByRole('tabpanel')).toHaveCount(1);
  await expect(page.getByRole('tabpanel')).toContainText(
    cat(en, 'Teacher.results.exitPredictions.description'),
  );
  await shot('exit-predictions');
});
