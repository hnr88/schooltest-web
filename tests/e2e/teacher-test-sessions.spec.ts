import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import type { CreateTestSessionResponse } from '@/modules/teacher/types/teacher-session.types';

import { runSql } from './helpers/auth-db';
import { cat, icu, loadMessages } from './helpers/i18n';
import { apiLogin } from './helpers/teacher-auth-rail';
import { sittingRow } from './helpers/teacher-end-session';
import { readMonitor } from './helpers/teacher-live-monitor-api';
import {
  joinAsStudent,
  rosterEmails,
  type JoinedStudent,
} from './helpers/teacher-live-monitor-join';
import { closeSession, readClasses, readTests } from './helpers/teacher-past-sessions-api';
import { signIn } from './helpers/teacher-rail';
import { startSessionViaUi } from './helpers/teacher-start-session-ui';
import {
  optionLabels,
  panelInk,
  rosterSize,
  sessionRow,
} from './helpers/teacher-test-sessions-flow';

// Task 052 — brief flows 5, 6, 7, 8 against the RUNNING app on :3000, the REAL
// Strapi on :5500 and the REAL PostgreSQL on 5540. The session is opened by
// pressing the real "Generate join code" button (C-TS-1), the code is then read
// OFF THE SCREEN the way a teacher reads it to the room, and THAT string is what
// a student really posts to C-SJ-1. Every expectation is either a second
// Node-side read strict-parsed through the shipped Zod mirror or a row out of
// Postgres — no interception, no fixture, no literal expectation.

const en = loadMessages('en');
const JOIN = 'Teacher.testSessions.joinCode';
const SHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots');

test.describe.configure({ mode: 'serial' });

let page: Page;
let request: APIRequestContext;
let jwt: string;
let started: CreateTestSessionResponse;
let className = '';
let testLabel = '';
/** The code as PAINTED — never the create's 201 field, so the two must agree. */
let announced = '';
let joined: JoinedStudent | null = null;

const panel = () => page.locator('[data-slot="join-code-panel"]');

test.beforeAll(async ({ browser, playwright }) => {
  // Dev-mode Turbopack compiles each segment on first visit; a cold sign-in plus
  // two teacher segments outlives the 30s hook default on this machine.
  test.setTimeout(240_000);
  request = await playwright.request.newContext();
  jwt = await apiLogin(request, 'teacher');
  page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await signIn(page, 'teacher');
});

test.afterAll(async () => {
  // Leave no sitting of this spec's own making open behind.
  if (started !== undefined && sittingRow(started.sitting_document_id).status === 'open') {
    await closeSession(request, jwt, started.sitting_document_id);
  }
  await page.context().close();
  await request.dispose();
});

test.describe('flow 5 — pick a class and a test, then Generate join code', () => {
  test('the pickers offer the caller OWN classes and tests, and the press really mints', async () => {
    test.setTimeout(240_000);
    const classes = await readClasses(request, jwt);
    const tests = await readTests(request, jwt);
    expect(classes.length, 'the teacher owns no class').toBeGreaterThan(0);
    expect(tests.length, 'C-TD-2 offers no test').toBeGreaterThan(0);
    className = classes[0].name;
    testLabel = tests[0].label;

    await page.goto('/en/dashboard/test-sessions');
    await expect(page.locator('#test-session-class')).toBeVisible({ timeout: 120_000 });
    expect(await optionLabels(page, 'test-session-class')).toEqual(classes.map((c) => c.name));
    expect(await optionLabels(page, 'test-session-test')).toEqual(tests.map((t) => t.label));

    started = await startSessionViaUi(page, en, className, testLabel);
    expect(started.status).toBe('open');
    expect(started.variant).toBe(tests[0].variant);
    expect(started.class.document_id).toBe(classes[0].class_document_id);
    expect(started.code, 'C-TS-1 minted something other than READ-####').toMatch(/^READ-\d{4}$/);
    expect(Number.isNaN(Date.parse(started.opened_at))).toBe(false);

    // The row itself, and the uniqueness the code's index promises.
    const [status, code, openedAt] = runSql(
      `select status, code, coalesce(opened_at::text, '') from sittings
        where document_id = '${started.sitting_document_id}'`,
    ).split('|');
    expect({ status, code }).toEqual({ status: 'open', code: started.code });
    expect(openedAt).not.toBe('');
    expect(runSql(`select count(*) from sittings where code = '${started.code}'`)).toBe('1');
  });
});

test.describe('flow 6 — the code is displayed prominently for reading aloud', () => {
  test('the code is the largest thing on the panel, captioned, and survives F5', async () => {
    announced = (await panel().getAttribute('data-join-code')) ?? '';
    expect(announced, 'the panel painted no code').toBe(started.code);
    await expect(
      panel().getByRole('heading', {
        name: icu(cat(en, `${JOIN}.caption`), { className, testLabel }),
        exact: true,
      }),
    ).toBeVisible();
    await expect(panel().getByText(cat(en, `${JOIN}.helper`), { exact: true })).toBeVisible();

    const shown = panel().getByText(announced, { exact: true });
    await expect(shown).toBeInViewport();
    const ink = await panelInk(panel(), announced);
    // --text-display clamps to 36px at its floor; the read-aloud code must be it.
    expect(ink.code).toBeGreaterThanOrEqual(36);
    expect(ink.code).toBeGreaterThan(ink.largestOther * 1.5);
    expect(ink.family.toLowerCase()).toContain('mono');
    await page.screenshot({ path: path.join(SHOTS, '052-flow6-join-code.png'), fullPage: true });

    // Persistence: the panel is C-TD-1's live_session, so a reload re-reads the
    // same server answer rather than replaying client state.
    await page.reload();
    await expect(panel()).toHaveAttribute('data-sitting-id', started.sitting_document_id);
    await expect(panel()).toHaveAttribute('data-join-code', announced);
    await expect(panel().getByText(announced, { exact: true })).toBeVisible();
  });
});

test.describe('flow 7 — a student joins with email + the announced code', () => {
  test('C-SJ-1 admits the roster email and the session row PERSISTS on this sitting', async () => {
    const emails = rosterEmails(started.class.document_id);
    expect(emails.length, 'the class roster carries no email').toBe(
      rosterSize(started.class.document_id),
    );

    joined = await joinAsStudent(request, jwt, announced, emails[0]);
    expect(joined.studentJwt.length, 'C-SJ-1 200 without a student JWT').toBeGreaterThan(0);

    const row = sessionRow(started.sitting_document_id, joined.studentDocumentId);
    expect(row.documentId, 'no sessions row linked to THIS sitting').toBe(joined.sessionDocumentId);
    expect(row.status).toBe('in_progress');
    expect(row.started_at).not.toBe('');

    const monitor = await readMonitor(request, jwt, started.sitting_document_id);
    const tile = monitor.students.find(
      (student) => student.student_document_id === joined?.studentDocumentId,
    );
    expect(tile?.state, 'the joined student is not on the monitor as joined').toBe('joined');
    expect(monitor.summary.joined).toBe(1);
  });
});

test.describe('flow 8 — Go live shows the grid with every student tile', () => {
  test('the grid equals C-TS-3 tile for tile, including the student who really joined', async () => {
    await panel().getByRole('link', { name: cat(en, `${JOIN}.goLive`), exact: true }).click();
    await page.waitForURL(`**/dashboard/test-sessions/${started.sitting_document_id}`);
    const surface = page.locator('[data-surface="teacher-live-monitor"]');
    await expect(surface).toHaveAttribute('data-status', 'ready', { timeout: 120_000 });

    const monitor = await readMonitor(request, jwt, started.sitting_document_id);
    expect(monitor.students.length).toBe(rosterSize(started.class.document_id));
    expect(monitor.summary.expected).toBe(monitor.students.length);

    const grid = page.locator('[data-slot="live-monitor-grid"]');
    await expect(grid.locator('[data-slot="live-monitor-tile"]')).toHaveCount(
      monitor.students.length,
    );
    for (const student of monitor.students) {
      const tile = grid.locator(`[data-student-id="${student.student_document_id}"]`);
      await expect(tile).toHaveAttribute('data-state', student.state);
      await expect(tile).toContainText(student.display_name);
    }
    await expect(
      grid.locator(`[data-student-id="${joined?.studentDocumentId ?? ''}"]`),
    ).toHaveAttribute('data-state', 'joined');

    for (const [key, value] of Object.entries(monitor.summary)) {
      await expect(
        page.locator(`[data-slot="live-monitor-stat"][data-stat="${key}"]`),
      ).toContainText(String(value));
    }
    await expect(page.locator('[data-slot="live-monitor-code"]')).toContainText(announced);
    await page.screenshot({ path: path.join(SHOTS, '052-flow8-monitor-grid.png'), fullPage: true });
  });
});
