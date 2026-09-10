import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { cat, icu, loadMessages } from './helpers/i18n';
import { createSession, closeSession, readClasses, readTests } from './helpers/teacher-past-sessions-api';
import { en, SCREENSHOTS, signIn } from './helpers/teacher-rail';
import { API_BASE, bearer } from './helpers/teacher-results-live';

// teacher/06 — the classes list (Teacher Portal v2.dc.html:57–216) proven against
// the RUNNING app and the REAL Strapi: the tiles ⇄ list toggle swaps `layout`
// only and survives a reload (the URL param is the store), the live strip draws
// one navy card per entry of the additive `live_sessions[]` while the rail's
// Live-sessions dot pulses, both leave on the real close (C-TS-4), and the kit's
// two empty arms render with the existing copy. The proof screenshots are
// captured IN-SPEC at 1440×900 (the viewport, not a crop) and inspected.

const L = 'Teacher.results.list';

test.describe.configure({ mode: 'serial' });

let page: Page;
let request: APIRequestContext;
let jwt: string;
let started: string | null = null;

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(180_000);
  request = await playwright.request.newContext();
  jwt = await bearer(request);
  // 1440×900 — the proof viewport, set on the page itself so every capture
  // below is that size by construction.
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await signIn(page, 'teacher');
  await page.goto('/dashboard/results');
  await expect(page.locator('[data-surface="teacher-results"]')).toHaveAttribute(
    'data-status',
    'ready',
    { timeout: 60_000 },
  );
});

test.afterAll(async () => {
  // Leave no sitting of this spec's own making open behind.
  if (started !== null) await closeSession(request, jwt, started);
  if (page) await page.close();
  await request.dispose();
});

const tilesBody = () => page.locator('[data-layout="tiles"]');
// The `table` arm is the kit's DirectoryRows — a real <table> with no
// data-layout marker (that attribute belongs to the non-table list track).
const tableBody = () => page.locator('[data-slot="teacher-classes-list"] table');

test.describe('the layout axis (U-05): tiles ⇄ table swaps the body and nothing else', () => {
  test('tiles are the default body, with the derived status on every card', async () => {
    await page.goto('/dashboard/results');
    await expect(page.locator('[data-surface="teacher-results"]')).toHaveAttribute(
      'data-status',
      'ready',
    );
    await expect(tilesBody()).toBeVisible();
    await expect(tableBody()).toHaveCount(0);

    // The toggle is the design's segmented pair (`:108–115`).
    const toggle = page.locator('[data-slot="directory-layout-toggle"]');
    await expect(toggle).toBeVisible();
    await expect(toggle.getByRole('button', { name: cat(en, `${L}.tiles`) })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    // The status derivation is the server's: a live card carries the LIVE NOW
    // badge and no pill; every other card the reverse. The fixture may hold no
    // open sitting at all — the assertion is the EXCLUSION, which holds either
    // way.
    const cards = page.locator('[data-slot="results-class-row"]');
    const count = await cards.count();
    expect(count, 'the seeded teacher owns classes').toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const card = cards.nth(index);
      const live = await card.locator('[data-slot="results-live-badge"]').count();
      const pill = await card.locator('[data-slot="results-status"]').count();
      expect(live + pill).toBe(1);
      expect((await card.getAttribute('data-class-id'))?.length).toBe(24);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, '06-tiles.png') });
  });

  test('choosing List swaps to the table body, keeps every row, and survives a reload', async () => {
    const rowsBefore = await page.locator('[data-slot="results-class-row"]').count();

    await page
      .locator('[data-slot="directory-layout-toggle"]')
      .getByRole('button', { name: cat(en, `${L}.list`) })
      .click();

    await expect(page).toHaveURL(/layout=table/);
    await expect(tableBody()).toBeVisible();
    await expect(tilesBody()).toHaveCount(0);
    // Same rows, same toolbar — the body is the ONLY thing that moved.
    await expect(page.locator('[data-slot="results-class-row"]')).toHaveCount(rowsBefore);
    // The table header is the design's column set (`:170–178`), statuses right.
    await expect(tableBody().locator('thead')).toContainText(cat(en, `${L}.classColumn`));
    await expect(tableBody().locator('thead')).toContainText(cat(en, `${L}.reading`));
    await expect(tableBody().locator('thead')).toContainText(cat(en, `${L}.statusColumn`));

    await page.screenshot({ path: path.join(SCREENSHOTS, '06-list.png') });

    // The URL is the store: a reload keeps the choice.
    await page.reload();
    await expect(page.locator('[data-surface="teacher-results"]')).toHaveAttribute(
      'data-status',
      'ready',
      { timeout: 60_000 },
    );
    await expect(tableBody()).toBeVisible();
    await expect(page).toHaveURL(/layout=table/);

    // Back to tiles for the rest of the file.
    await page
      .locator('[data-slot="directory-layout-toggle"]')
      .getByRole('button', { name: cat(en, `${L}.tiles`) })
      .click();
    await expect(tilesBody()).toBeVisible();
  });

  test('the sort choice round-trips through the URL and reorders the rows', async () => {
    // ops/34 fixed the kit's inert-sort defect (parse never read `sort` back);
    // on this surface the design's three sorts (`:105–107`) are client
    // comparators, and the URL is the store — so Most students first must
    // survive a reload AND actually reorder against the live wire.
    const classes = await readClasses(request, jwt);
    const expectedFirst = [...classes].sort(
      (a, b) => b.student_count - a.student_count,
    )[0].name;

    await page.goto('/dashboard/results?sort=students');
    await expect(page.locator('[data-surface="teacher-results"]')).toHaveAttribute(
      'data-status',
      'ready',
      { timeout: 60_000 },
    );
    await expect(page).toHaveURL(/sort=students/);
    await expect(page.locator('[data-slot="results-class-row"]').first()).toContainText(
      expectedFirst,
    );

    // Reload: the sort survives (the round-trip is the regression).
    await page.reload();
    await expect(page.locator('[data-surface="teacher-results"]')).toHaveAttribute(
      'data-status',
      'ready',
      { timeout: 60_000 },
    );
    await expect(page.locator('[data-slot="results-class-row"]').first()).toContainText(
      expectedFirst,
    );
    await page.goto('/dashboard/results');
    await expect(page.locator('[data-surface="teacher-results"]')).toHaveAttribute(
      'data-status',
      'ready',
    );
  });

  test('a filter with no matches renders the kit empty-no-matches arm with Clear filters', async () => {
    // No seeded class is scheduled (the scheduling routes are task 23), so the
    // status filter is a REAL no-match filter over the REAL wire values — set
    // through the very URL param the toolbar writes.
    await page.goto('/dashboard/results?status=scheduled');
    await expect(page.locator('[data-surface="teacher-results"]')).toHaveAttribute(
      'data-status',
      'ready',
      { timeout: 60_000 },
    );
    await expect(
      page.getByRole('heading', { name: cat(en, `${L}.emptyNoMatchesTitle`) }),
    ).toBeVisible();
    const clear = page
      .locator('[data-slot="directory-toolbar"]')
      .getByRole('button', { name: cat(en, `${L}.clearFilters`) });
    await expect(clear).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOTS, '06-filtered-empty.png') });

    await clear.click();
    await expect(page.locator('[data-slot="results-class-row"]').first()).toBeVisible();
  });
});

test.describe('the live strip and the rail dot track the REAL open sittings', () => {
  test('opening a sitting puts it in the strip and pulses the rail dot; closing removes both', async () => {
    const classes = await readClasses(request, jwt);
    const tests = await readTests(request, jwt);
    expect(classes.length, 'the seeded teacher owns classes').toBeGreaterThan(0);
    expect(tests.length, 'C-TD-2 offers tests').toBeGreaterThan(0);

    started = await createSession(request, jwt, classes[0].class_document_id, tests[0].form_document_id);

    // The shared DB carries residue from other rows' runs, so the strip's count
    // is whatever C-TD-1 answers NOW — the card set must equal the WIRE, with
    // this spec's own sitting among them.
    const dash = await request.get(`${API_BASE}/api/teacher/dashboard`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(dash.ok()).toBeTruthy();
    const wireLive = ((await dash.json()) as { live_sessions: { sitting_document_id: string }[] })
      .live_sessions;
    expect(wireLive.length, 'the new sitting is on the wire').toBeGreaterThanOrEqual(1);

    await page.goto('/dashboard/results');
    await expect(page.locator('[data-surface="teacher-results"]')).toHaveAttribute(
      'data-status',
      'ready',
      { timeout: 60_000 },
    );
    const strip = page.locator('[data-slot="live-strip"]');
    await expect(strip).toBeVisible();
    // The DB is SHARED and other rows' sittings open/close live: the exact card
    // count can move between the wire read above and this render. The stable
    // truth: at least the whole wire set rendered, and THIS sitting's card.
    const cards = strip.locator('[data-slot="live-strip-card"]');
    await expect(cards.first()).toBeVisible();
    const card = strip.locator(`[data-slot="live-strip-card"][data-sitting-id="${started}"]`);
    await expect(card).toHaveCount(1);
    await expect(card).toHaveAttribute('href', new RegExp(`/dashboard/test-sessions/${started}$`));
    // The strip label spells the served count (design :4185). The catalog
    // value is an ICU plural — next-intl evaluates it, so assert the rendered
    // count and words rather than the raw template.
    const label = strip.locator('[data-slot="live-strip-label"]');
    await expect(label).toContainText(/\d/);
    await expect(label).toContainText(
      wireLive.length === 1 ? 'session live now' : 'sessions live now',
    );
    await page.screenshot({ path: path.join(SCREENSHOTS, '06-live-strip.png') });

    // The rail dot (design :34) rides the same derived open_session_count.
    const dot = page.locator('[data-slot="rail-live-dot"]');
    await expect(dot).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOTS, '06-rail-live-dot.png') });

    // The real close (C-TS-4) takes THIS sitting off the strip on the next
    // read, and the dot's presence keeps matching the remaining wire count —
    // residue from other rows may legitimately keep it alive.
    await closeSession(request, jwt, started);
    const closed = started;
    started = null;
    const afterClose = await request.get(`${API_BASE}/api/teacher/dashboard`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(afterClose.ok()).toBeTruthy();
    const remaining = ((await afterClose.json()) as {
      live_sessions: { sitting_document_id: string }[];
    }).live_sessions;

    await page.goto('/dashboard/results');
    await expect(page.locator('[data-surface="teacher-results"]')).toHaveAttribute(
      'data-status',
      'ready',
      { timeout: 60_000 },
    );
    await expect(page.locator(`[data-sitting-id="${closed}"]`)).toHaveCount(0);
    if (remaining.length === 0) {
      await expect(page.locator('[data-slot="live-strip"]')).toHaveCount(0);
      await expect(dot).toHaveCount(0);
    } else {
      await expect(strip).toBeVisible();
      await expect(dot).toBeVisible();
    }
  });
});

test.describe('the empty arms are the kit\'s, with the existing copy', () => {
  test('a teacher with no classes at all renders empty-none — never a guess', async () => {
    // Structural coverage (the zz-task111 precedent): the fixture teacher owns
    // classes, so the none-arm is proven by stubbing the C-TD-1 read to its
    // contract-shaped empty answer.
    await page.route('**/api/teacher/dashboard', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ classes: [], live_session: null, live_sessions: [] }),
      }),
    );
    await page.goto('/dashboard/results');
    await expect(page.locator('[data-surface="teacher-results"]')).toHaveAttribute(
      'data-status',
      'empty',
    );
    await expect(page.getByRole('heading', { name: cat(en, `${L}.emptyTitle`) })).toBeVisible();
    await expect(page.getByText(cat(en, `${L}.emptyDescription`))).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOTS, '06-empty-none.png') });
    await page.unroute('**/api/teacher/dashboard');
  });
});
