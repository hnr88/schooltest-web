import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { findTestLabel } from '@/modules/teacher/lib/join-code';
import type { TeacherTest } from '@/modules/teacher/types/teacher.types';

import { cat } from './helpers/i18n';
import { apiLogin } from './helpers/teacher-auth-rail';
import {
  closeSession,
  createSession,
  readClasses,
  readSessions,
  readTests,
} from './helpers/teacher-past-sessions-api';
import {
  expectRowsMatchWire,
  openTestSessions,
  PAST_SESSIONS_NS as NS,
  pastSessionRows,
  pastSessionsPanel,
  scrapeRows,
  statusWord,
  syncedRows,
  withSessionsWire,
} from './helpers/teacher-past-sessions';
import { en, SCREENSHOTS, signIn } from './helpers/teacher-rail';

// Task 036 — the "Past sessions" table (.qa/DESIGN.md §Test sessions view 1),
// proven against the RUNNING app on :3000 and the REAL Strapi/PostgreSQL. Every
// expected value is read live from C-TS-2 / C-TD-2 and parsed through the shipped
// Zod mirrors; there is no fixture, no seeded example row and no literal count.

test.describe.configure({ mode: 'serial' });

let page: Page;
let request: APIRequestContext;
let jwt: string;
let tests: readonly TeacherTest[];

test.beforeAll(async ({ browser, playwright }) => {
  // Dev-mode Turbopack compiles /sign-in and /dashboard/test-sessions on first
  // visit; the 30s hook default is not enough for a cold segment on this machine.
  test.setTimeout(180_000);
  request = await playwright.request.newContext();
  jwt = await apiLogin(request, 'teacher');
  tests = await readTests(request, jwt);
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await signIn(page, 'teacher');
  await openTestSessions(page);
});

test.afterAll(async () => {
  await page.close();
  await request.dispose();
});

test.describe('Past sessions table (C-TS-2)', () => {
  test('renders every sitting the server sent, in its order, with the real values', async () => {
    const { wire, rendered } = await syncedRows(page, request, jwt);

    expect(wire.length).toBeGreaterThan(0);
    expect(rendered).toHaveLength(wire.length);

    const branches = expectRowsMatchWire(rendered, wire, tests);

    // The real datastore carries both nullable cases; this asserts the branches
    // inside expectRowsMatchWire actually executed rather than being dead code.
    expect(branches.nullCodes, 'sittings with no minted code').toBe(
      wire.filter((sitting) => sitting.code === null).length,
    );
    expect(branches.nullCodes).toBeGreaterThan(0);
    expect(branches.nullVariants, 'sittings outside the A|B pair').toBe(
      wire.filter((sitting) => findTestLabel(tests, sitting.variant) === null).length,
    );
  });

  test('a session created through C-TS-1 is the first row after a reload, then closes', async () => {
    const classes = await readClasses(request, jwt);
    const owned = classes[0];
    const testA = tests.find((entry) => entry.variant === 'A');
    expect(testA, 'C-TD-2 offers no Test A on this server').toBeTruthy();

    const sittingId = await createSession(
      request,
      jwt,
      owned.class_document_id,
      testA?.form_document_id ?? '',
    );

    const opened = await syncedRows(page, request, jwt);
    expect(opened.wire[0].sitting_document_id, 'C-TS-2 orders opened_at desc').toBe(sittingId);
    const firstRow = opened.rendered[0];
    expect(firstRow.className).toBe(owned.name);
    expect(firstRow.status).toBe('open');
    expect(firstRow.statusWord).toBe(statusWord('open'));
    expect(firstRow.test).toBe(findTestLabel(tests, 'A'));
    expect(firstRow.code).toBe(opened.wire[0].code);
    // Truthful counts: nobody has joined this sitting, so it reads 0 of the roster.
    expect(firstRow.completed).toBe(`${opened.wire[0].completed} / ${opened.wire[0].expected}`);
    expect(opened.wire[0].completed).toBe(0);

    await closeSession(request, jwt, sittingId);

    const closed = await syncedRows(page, request, jwt);
    const closedWire = closed.wire.find((row) => row.sitting_document_id === sittingId);
    expect(closedWire?.status, 'C-TS-4 closed the sitting').toBe('closed');
    const closedIndex = closed.wire.findIndex((row) => row.sitting_document_id === sittingId);
    expect(closed.rendered[closedIndex].status).toBe('closed');
    expect(closed.rendered[closedIndex].statusWord).toBe(statusWord('closed'));
  });

  test('real table semantics, a status word on every row, and no sideways scroll', async () => {
    const table = page.locator('[data-slot="past-sessions-table"]');
    const heads = table.locator('thead th[scope="col"]');
    await expect(heads).toHaveCount(4);
    await expect(heads.nth(0)).toHaveText(cat(en, `${NS}.class`));
    await expect(heads.nth(1)).toHaveText(cat(en, `${NS}.test`));
    await expect(heads.nth(2)).toHaveText(cat(en, `${NS}.date`));
    await expect(heads.nth(3)).toHaveText(cat(en, `${NS}.completed`));

    const rowCount = await pastSessionRows(page).count();
    await expect(table.locator('tbody th[scope="row"]')).toHaveCount(rowCount);

    // WCAG 2.2 AA 1.4.1: the tinted pill is never the only carrier of the state.
    const words = new Set((await scrapeRows(page)).map((row) => row.statusWord));
    expect(words.has('')).toBe(false);
    for (const word of words) {
      expect([statusWord('open'), statusWord('closed')]).toContain(word);
    }

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, 'the page must not scroll horizontally').toBe(0);

    await page.screenshot({
      path: path.join(SCREENSHOTS, 'task-036-past-sessions.png'),
      fullPage: true,
    });
    // The shell owns the page scroll, so a full-page shot stops at the fold; the
    // panel itself is captured so the rendered rows are part of the evidence.
    await pastSessionsPanel(page).scrollIntoViewIfNeeded();
    await pastSessionsPanel(page).screenshot({
      path: path.join(SCREENSHOTS, 'task-036-past-sessions-table.png'),
    });

    // …and the history scrolled to a REAL sitting the core create left without a
    // code, so the nullable branch is visible evidence, not only an assertion.
    const marker = page.locator('[data-slot="session-missing-value"]').first();
    await marker.scrollIntoViewIfNeeded();
    await pastSessionsPanel(page).screenshot({
      path: path.join(SCREENSHOTS, 'task-036-past-sessions-nullable.png'),
    });
  });

  test('a NULL opened_at renders as an explicit absence, not a crash or a guess', async () => {
    const before = await readSessions(request, jwt);
    await withSessionsWire(page, (sessions) => {
      sessions[0].opened_at = null;
    });
    await openTestSessions(page);

    const rendered = await scrapeRows(page);
    expect(rendered).toHaveLength(before.length);
    expect(rendered[0].date).toBe('');
    expect(rendered[0].dateIso).toBe('');
    expect(rendered[0].missing).toContain(cat(en, `${NS}.noDate`));
    expect(rendered[0].className).toBe(before[0].class.name);
    await expect(pastSessionsPanel(page)).toHaveAttribute('data-status', 'ready');

    await page.unroute('**/api/teacher/test-sessions');
  });
});
