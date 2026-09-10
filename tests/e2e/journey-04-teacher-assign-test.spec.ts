import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import type { CreateTestSessionResponse } from '@/modules/teacher/types/teacher-session.types';

import { runSql } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';
import { apiLoginRetried } from './helpers/ops34-api-retry';
import { readMonitor } from './helpers/teacher-live-monitor-api';
import {
  closeSession,
  readClasses,
  readSessions,
  readTests,
} from './helpers/teacher-past-sessions-api';
import { signIn } from './helpers/teacher-rail';
import { startSessionViaUi } from './helpers/teacher-start-session-ui';
import { rosterSize } from './helpers/teacher-test-sessions-flow';

// Journey 04 — the teacher assigns a test to a class and opens the sitting.
// ONE chained drive against the REAL stack (web :3002, Strapi :5500, Postgres):
// sign in as the seeded journey teacher (t2), assign a test through the
// /dashboard/test-sessions setup form (C-TS-1's real POST mints the open
// sitting), open the sitting room ("Go live") and assert the assigned roster
// is listed on it, then reload and assert the assignment AND its session are
// still there — on the page, in the C-TS-2 list and in Postgres. Every value
// is either the server's own answer or a database read; nothing is fixtured.
// The standard page/request fixtures are used directly so the SAME spec runs
// under the CLI and inside the managed Codephant Browser tab.
const en = loadMessages('en');
const JOIN = 'Teacher.testSessions.joinCode';
const SHOTS = path.resolve(
  process.cwd(),
  '..',
  '.qa',
  'journeys',
  '04-teacher-assign-test',
  'shots',
);

test.describe.configure({ mode: 'serial' });

let jwt = '';
let assigned: CreateTestSessionResponse | undefined;

/** 1440x900 capture into the journey's evidence folder, attached for Tests. */
async function shot(page: Page, name: string): Promise<void> {
  const file = path.join(SHOTS, name);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: file, fullPage: true });
  test.info().attach(name, { path: file });
}

test.afterAll(async ({ request }) => {
  // Leave no sitting of this journey's own making open behind (C-TS-4). The
  // close rides shared-budget 429s out via fetchWithRetry, so the hook needs
  // its own budget beyond the 30s default.
  test.setTimeout(120_000);
  if (assigned !== undefined && jwt !== '') {
    await closeSession(request, jwt, assigned.sitting_document_id);
  }
});

test('assign a test to a class, open the sitting, and it all persists on reload', async ({
  page,
  request,
}) => {
  // Cold dev-mode compiles of the teacher segments outlive the default budget.
  test.setTimeout(240_000);
  jwt = await apiLoginRetried(request, 'teacher');
  await page.setViewportSize({ width: 1440, height: 900 });
  // The managed runner reuses the visible Browser tab, which can carry a
  // stale session from another surface's run — and /sign-in bounces
  // authenticated users client-side, so clear the persisted state first.
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await signIn(page, 'teacher');

  const classes = await readClasses(request, jwt);
  const tests = await readTests(request, jwt);
  const target = classes[0];
  expect(target, 'the journey teacher owns no class').toBeTruthy();
  const chosen = tests[0];
  expect(chosen, 'C-TD-2 offers no test').toBeTruthy();

  // ASSIGN + START through the REAL form: class + test pickers, then the
  // submit press that really POSTs /api/teacher/test-sessions. The helper
  // strict-parses C-TS-1's own 201 and waits until the join-code panel is
  // bound to the sitting the server minted (status open, code painted).
  assigned = await startSessionViaUi(page, en, target.name, chosen.label);
  const sitting = assigned;
  expect(sitting.status).toBe('open');
  expect(sitting.class.document_id).toBe(target.class_document_id);
  await shot(page, '04-1-assignment-open.png');

  // The sitting row itself, straight out of Postgres.
  const [status, code] = runSql(
    `select status, code from sittings where document_id = '${sitting.sitting_document_id}'`,
  ).split('|');
  expect({ status, code }).toEqual({ status: 'open', code: sitting.code });

  // OPEN THE SITTING: "Go live" walks the teacher into the sitting room.
  await page
    .locator('[data-slot="join-code-panel"]')
    .getByRole('link', { name: cat(en, `${JOIN}.goLive`), exact: true })
    .click();
  await page.waitForURL(`**/dashboard/test-sessions/${sitting.sitting_document_id}`);
  const surface = page.locator('[data-surface="teacher-live-monitor"]');
  await expect(surface).toHaveAttribute('data-status', 'ready', { timeout: 120_000 });

  // The ASSIGNED STUDENTS are listed: the grid equals the class's active
  // roster (Postgres truth) tile for tile with the C-TS-3 payload.
  const monitor = await readMonitor(request, jwt, sitting.sitting_document_id);
  const roster = rosterSize(target.class_document_id);
  expect(monitor.students.length, 'monitor roster vs Postgres roster').toBe(roster);
  expect(monitor.summary.expected).toBe(roster);
  const grid = page.locator('[data-slot="live-monitor-grid"]');
  await expect(grid.locator('[data-slot="live-monitor-tile"]')).toHaveCount(roster);
  for (const student of monitor.students) {
    const tile = grid.locator(`[data-student-id="${student.student_document_id}"]`);
    await expect(tile).toHaveAttribute('data-state', student.state);
    await expect(tile).toContainText(student.display_name);
  }
  await shot(page, '04-2-sitting-roster.png');

  // FULL BROWSER RELOAD: the sitting room re-serves the same assignment.
  await page.reload();
  await expect(surface).toHaveAttribute('data-status', 'ready', { timeout: 120_000 });
  const reloaded = await readMonitor(request, jwt, sitting.sitting_document_id);
  expect(reloaded.students.map((s) => s.student_document_id)).toEqual(
    monitor.students.map((s) => s.student_document_id),
  );
  await expect(grid.locator('[data-slot="live-monitor-tile"]')).toHaveCount(
    reloaded.students.length,
  );
  await shot(page, '04-3-after-reload-sitting.png');

  // The ASSIGNMENT persists too: back on test sessions the join-code panel is
  // still bound to this sitting, the C-TS-2 list still carries it open, and
  // Postgres still holds the open row with the same code.
  await page.goto('/en/dashboard/test-sessions');
  const panel = page.locator('[data-slot="join-code-panel"]');
  await expect(panel).toHaveAttribute('data-sitting-id', sitting.sitting_document_id, {
    timeout: 60_000,
  });
  await expect(panel).toHaveAttribute('data-join-code', sitting.code);
  await expect(panel.getByText(sitting.code, { exact: true })).toBeVisible();
  const listed = (await readSessions(request, jwt)).find(
    (session) => session.sitting_document_id === sitting.sitting_document_id,
  );
  expect(listed, 'C-TS-2 lost the sitting').toBeTruthy();
  expect(listed?.status).toBe('open');
  const [statusAfter] = runSql(
    `select status from sittings where document_id = '${sitting.sitting_document_id}'`,
  ).split('|');
  expect(statusAfter).toBe('open');
  await shot(page, '04-4-after-reload-assignment.png');

  // Mobile width: the assignment panel stays the honest record of the open
  // sitting (resize remounts and refetches, so re-read before capturing).
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.locator('[data-slot="test-session-setup"]')).toBeVisible({ timeout: 60_000 });
  await expect(panel).toHaveAttribute('data-join-code', sitting.code);
  const mobileFile = path.join(SHOTS, '04-5-mobile-375.png');
  await page.screenshot({ path: mobileFile, fullPage: true });
  test.info().attach('04-5-mobile-375.png', { path: mobileFile });
  await page.setViewportSize({ width: 1440, height: 900 });
});

