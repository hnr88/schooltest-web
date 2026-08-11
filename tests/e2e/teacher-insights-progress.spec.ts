import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { cat } from './helpers/i18n';
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
import { openExitPredictions, openProgress } from './helpers/teacher-insights-view';
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
// FLOW 22 is the one flow whose DOM cannot be reached honestly on this dataset:
// both seeded classes hold completed Test B sittings, so C-TR-4 never answers
// `available: false`. This spec asserts the CENSUS that proves that (and the
// placeholder's absence exactly while Test B exists) instead of manufacturing the
// state; .qa/tasks/056-*.md → "FLOW 22" records it as the data-state blocker.

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
  const cuts = dbMasteryCuts();
  for (const card of live.classes) {
    const view = await flow23(page, playwright, card.class_document_id, cuts);
    await shot(`progress-${card.class_document_id}`);
    await flow23AfterReload(page, card.class_document_id, view);
  }
});

test('flow 24 — Progress counts ONLY students who completed both tests', async ({ playwright }) => {
  const cuts = dbMasteryCuts();
  let moved = false;
  for (const card of live.classes) {
    moved = (await flow24(page, playwright, card.class_document_id, cuts)) || moved;
    await shot(`cohort-${card.class_document_id}`);
  }
  // Non-vacuity: at least one excluded student really WOULD have moved a number.
  expect(moved, 'no excluded student masters anything — the rule proves nothing').toBe(true);
});

test('flow 22 — the empty state is server-driven, and no owned class can answer it', async ({
  playwright,
}) => {
  const classes = dbClasses();
  expect(classes.length, `Postgres holds: ${classes.join(', ')}`).toBe(live.classes.length);

  for (const card of live.classes) {
    const body = await readClassProgressLive(playwright, card.class_document_id);
    const dbTestB = dbCompletedCount(card.class_document_id, [FORM_CODES.B]);
    expect(body.cohort.test_b_completed).toBe(dbTestB);
    expect(dbTestB, `${card.name} holds Test B results, so available must be true`).toBeGreaterThan(
      0,
    );
    expect(body.available).toBe(true);

    // …and the placeholder is absent for exactly that reason.
    const panel = await openProgress(page, card.class_document_id);
    await expect(panel).toHaveAttribute('data-status', 'ready');
    await expect(panel.locator('[data-slot="progress-empty"]')).toHaveCount(0);
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
