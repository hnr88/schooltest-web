import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { API_BASE } from './helpers/teacher-auth-rail';
import { apiLoginRetried } from './helpers/ops34-api-retry';
import { closeSession, createSession, readClasses, readTests } from './helpers/teacher-past-sessions-api';
import { cat, loadMessages } from './helpers/i18n';
import { signIn } from './helpers/teacher-rail';

// teacher task 13 — the session activity panel on the live monitor
// (/dashboard/test-sessions/<sittingDocumentId>), proven against the RUNNING
// app and the REAL audit-backed read (C-SIT-ACTIVITY) and write
// (C-SIT-ACTIVITY-ADD). The panel is asserted against the payload the server
// really answers for this spec's own sitting: the round-trip composer appends
// a REAL incident row and the refetch must paint it with the caller's name.
// The spec closes the sitting it opened; appended audit rows are the trail
// the sitting legitimately carries.

test.describe.configure({ mode: 'serial' });

const en = loadMessages('en');
const NS = 'TestDay.activity';
const PANEL = '[data-surface="sitting-activity"]';
const ROW = '[data-slot="dot-activity-row"]';
const NOTE = 'QA13 web e2e — device swapped mid-test';

let page: Page;
let request: APIRequestContext;
let jwt: string;
let sittingId = '';

test.beforeAll(async ({ browser, playwright }) => {
  // Dev-mode Turbopack compiles the monitor segment on first visit; the 30s
  // hook default is not enough for a cold segment on this machine.
  test.setTimeout(180_000);
  request = await playwright.request.newContext();
  jwt = await apiLoginRetried(request, 'teacher');

  // A sitting this spec owns — the teacher's first class with the variant-A
  // form, exactly the teacher-past-sessions harness.
  const classes = await readClasses(request, jwt);
  const tests = await readTests(request, jwt);
  const testA = tests.find((entry) => entry.variant === 'A');
  expect(testA, 'C-TD-2 offers no Test A on this server').toBeTruthy();
  sittingId = await createSession(request, jwt, classes[0].class_document_id, testA?.form_document_id ?? '');

  page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await signIn(page, 'teacher');
  await page.goto(`/en/dashboard/test-sessions/${sittingId}`);

  // The shared per-IP rate limit can 429 the monitor read (all machine
  // processes share one budget), and the screen renders its error branch
  // rather than guessing. Retry through it: Try again re-runs the read, and
  // only a persisted failure fails the spec.
  const ready = page.locator('[data-surface="teacher-live-monitor"][data-status="ready"]');
  const errored = page.locator('[data-surface="teacher-live-monitor"] >> text=Try again');
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if ((await ready.count()) > 0) break;
    if ((await errored.count()) > 0) {
      await errored.first().click();
      await page.waitForTimeout(15_000);
    } else {
      await page.waitForTimeout(8_000);
    }
  }
  await expect(ready).toBeVisible({ timeout: 60_000 });
});

test.afterAll(async () => {
  if (sittingId && request) await closeSession(request, jwt, sittingId);
});

test('the panel mounts on the live monitor with the design title and sub-line', async () => {
  const panel = page.locator(PANEL);
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { name: cat(en, `${NS}.title`) })).toBeVisible();
  expect(await panel.textContent()).toContain(cat(en, `${NS}.subtitle`));
});

test('a fresh sitting renders the empty body — no rows, no notes', async () => {
  const panel = page.locator(PANEL);
  await expect(panel).toContainText(cat(en, `${NS}.empty`));
  expect(await panel.locator(ROW).count()).toBe(0);
});

test('Log an incident appends a REAL entry that the refetch paints with the caller as the actor', async () => {
  const panel = page.locator(PANEL);
  await panel.getByRole('button', { name: cat(en, `${NS}.logIncident`) }).click();
  await panel.getByLabel(cat(en, `${NS}.noteLabel`)).fill(NOTE);
  await panel
    .locator('section, div')
    .filter({ has: page.getByLabel(cat(en, `${NS}.noteLabel`)) })
    .last()
    .getByRole('button', { name: cat(en, `${NS}.logIncident`) })
    .click();

  const row = panel.locator(ROW).filter({ hasText: NOTE });
  await expect(row).toBeVisible({ timeout: 30_000 });
  // The who column carries the teacher's own name — never 'System' for a
  // typed incident, and never an echoed 'actor' from the body.
  expect((await row.textContent())).not.toContain('System');

  // The painted rows match the wire the server really answered for this sitting.
  const wire = await request.get(`${API_BASE}/api/sittings/${sittingId}/activity`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(wire.status()).toBe(200);
  const body = (await wire.json()) as { data: { entries: { action: string }[]; total: number } };
  expect(body.data.total).toBeGreaterThanOrEqual(1);
  expect(body.data.entries[0].action).toBe(NOTE);
  expect(await panel.locator(ROW).count()).toBe(body.data.entries.length);
});
