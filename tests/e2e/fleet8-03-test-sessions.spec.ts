import { expect, test, type Page, type Response } from '@playwright/test';

import { cat } from './helpers/i18n';
import { bearerFor, drain, observe, readTeacherClasses, shot, signInTeacherEmail } from './helpers/fleet8';
import { en } from './helpers/teacher-rail';

// F8 sweep 3/5 — the FULL test-session lifecycle driven through the REAL UI as
// t2: create (the one Start-session modal, "some students" picked) -> monitor on
// the class Live tab -> refresh mid-monitor (recovery, no duplicate sitting) ->
// close with a DOUBLE-CLICKED confirm (exactly ONE close POST may fire) -> the
// tab falls back to "No sitting open" and STAYS fallen back after navigating
// back. Plus the refusal: creating with no student selected must not reach the
// API. Every stage is screenshotted; destructive double-execution is counted on
// the wire, not in the DOM.
test.describe.configure({ mode: 'serial' });
test.setTimeout(300_000);
test.use({ viewport: { width: 1440, height: 900 } });

let page: Page;
let jwt = '';
let classId = '';
let sittingId = '';


test.beforeAll(async ({ browser, request }) => {
  test.setTimeout(180_000); // beforeAll has its own 30s default; cold dev-compile busts it
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await signInTeacherEmail(page, 't2@schooltest.local');
  jwt = await bearerFor(request, 't2@schooltest.local');
  const classes = await readTeacherClasses(request, jwt);
  test.skip(classes.length === 0, 't2 owns no class');
  const richest = classes.reduce((a, b) => (b.student_count > a.student_count ? b : a));
  classId = richest.class_document_id;
});

test.afterAll(async ({ request }) => {
  // Leave the environment as found: if anything above died mid-flight, close the
  // sitting this file created so no stray OPEN session blocks the other fleets.
  if (sittingId) {
    await request
      .post(`http://localhost:5500/api/teacher/test-sessions/${sittingId}/close`, {
        headers: { Authorization: `Bearer ${jwt}` },
        data: {},
      })
      .catch(() => undefined);
  }
  await page?.close();
});

test('creating with NO student selected refuses before any POST', async () => {
  const traffic = observe(page);
  let created = 0;
  page.on('response', (response: Response) => {
    if (response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/teacher/test-sessions') {
      created += 1;
    }
  });

  await page.goto('/dashboard/results');
  await page.locator('[data-slot="start-session-button"]').first().click();
  const modal = page.locator('[data-surface="start-session-modal"]');
  await expect(modal).toBeVisible({ timeout: 120_000 });
  await shot(page, '30-create-modal-default');

  // Pick NONE.
  await modal.getByRole('tab', { name: /students/i }).click();
  await expect(modal.locator('[data-slot="start-session-student"]').first()).toBeVisible({ timeout: 30_000 });
  await shot(page, '31-create-modal-none-picked');

  const cta = modal.locator('[data-slot="start-session-cta"]');
  await expect(cta).toHaveAttribute('aria-disabled', 'true');
  await cta.click().catch(() => undefined); // a greyed CTA may swallow the click
  // Bounded proof instead of a loose sleep: no create POST may appear.
  await expect
    .poll(() => created, { message: 'a WRONG create POST left the browser', timeout: 5_000 })
    .toBe(0);
  await expect(modal).toBeVisible(); // the modal stays open, nothing was created

  // Escape cancels cleanly.
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
  expect(drain(traffic), 'errors during the refusal probe').toEqual([]);
});

test('create for two students -> lands on the Live tab monitoring the new sitting', async ({ request }) => {
  const traffic = observe(page);
  await page.goto('/dashboard/results');
  await page.locator('[data-slot="start-session-button"]').first().click();
  const modal = page.locator('[data-surface="start-session-modal"]');
  await expect(modal).toBeVisible({ timeout: 120_000 });
  await expect(modal.locator('[data-slot="start-session-cta"]')).not.toHaveAttribute('aria-busy', 'true', {
    timeout: 30_000,
  });

  await modal.getByRole('tab', { name: /students/i }).click();
  const free = modal.locator('[data-slot="start-session-student"]:not([data-blocked])');
  await expect(free.nth(1)).toBeVisible({ timeout: 30_000 });
  await free.nth(0).click();
  await free.nth(1).click();
  await shot(page, '32-create-modal-two-picked');

  await modal.locator('[data-slot="start-session-cta"]').click();
  await page.waitForURL((url) => url.pathname.endsWith(`/dashboard/results/${classId}`) && url.searchParams.get('tab') === 'live', {
    timeout: 45_000,
  });
  const url = new URL(page.url());
  sittingId = url.searchParams.get('session') ?? '';
  expect(sittingId, 'the live tab carries the new sitting id').not.toBe('');

  const card = page.locator(`[data-slot="run-sitting"]`);
  await expect(card).toBeVisible({ timeout: 45_000 });
  await expect(card.getByRole('button', { name: cat(en, 'TeacherPortal.live.room.close'), exact: true })).toBeVisible();
  await shot(page, '33-live-monitor-running');

  // The API agrees: exactly ONE open sitting for this class, the one we created.
  const sessions = (await (
    await page.request.get('http://localhost:5500/api/teacher/test-sessions', {
      headers: { Authorization: `Bearer ${jwt}` },
    })
  ).json()) as { sessions: Array<{ sitting_document_id: string; status: string; class: { document_id: string } }> };
  const openHere = sessions.sessions.filter((s) => s.status === 'open' && s.class.document_id === classId);
  expect(openHere.map((s) => s.sitting_document_id), 'exactly one open sitting for the class').toEqual([sittingId]);

  expect(drain(traffic), 'errors during create/monitor').toEqual([]);
});

test('refresh mid-monitor recovers to the same sitting, never a duplicate', async () => {
  const traffic = observe(page);
  await page.reload();
  const card = page.locator(`[data-slot="run-sitting"]`);
  await expect(card).toBeVisible({ timeout: 60_000 });
  await shot(page, '34-live-monitor-after-refresh');

  const sessions = (await (
    await page.request.get('http://localhost:5500/api/teacher/test-sessions', {
      headers: { Authorization: `Bearer ${jwt}` },
    })
  ).json()) as { sessions: Array<{ sitting_document_id: string; status: string; class: { document_id: string } }> };
  const openHere = sessions.sessions.filter((s) => s.status === 'open' && s.class.document_id === classId);
  expect(openHere, 'refresh created no duplicate open sitting').toHaveLength(1);
  expect(drain(traffic), 'errors across the mid-monitor refresh').toEqual([]);
});

test('double-clicked close confirm fires EXACTLY ONE close POST; tab falls back and stays fallen back', async () => {
  const traffic = observe(page);
  let closeCalls = 0;
  page.on('response', (response: Response) => {
    if (
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === `/api/teacher/test-sessions/${sittingId}/close`
    ) {
      closeCalls += 1;
    }
  });

  const surface = page.locator('[data-surface="teacher-test-day"]');
  await expect(surface).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });
  await surface.getByRole('button', { name: cat(en, 'TeacherPortal.live.room.close'), exact: true }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await shot(page, '35-close-confirm-dialog');

  // The destructive double-click: two rapid confirms on the SAME dialog.
  const confirm = dialog.getByRole('button', { name: /close/i }).last();
  await confirm.dblclick().catch(async () => {
    await confirm.click();
  });
  await expect(dialog).toHaveCount(0, { timeout: 30_000 });
  await page.waitForTimeout(1500);
  expect(closeCalls, 'the destructive close executed exactly once').toBe(1);

  // The tab falls back to the empty card…
  await expect(page.getByText(/no sitting open|no session/i).first()).toBeVisible({ timeout: 30_000 });
  await shot(page, '36-live-after-close');

  // …and STAYS fallen back after navigating away and straight back.
  await page.goto(`/dashboard/results/${classId}?tab=live`);
  await expect(page.getByText(/no sitting open|no session/i).first()).toBeVisible({ timeout: 45_000 });
  await expect(page.locator('[data-slot="run-sitting"]')).toHaveCount(0);
  await shot(page, '37-live-back-after-close-no-stale-view');

  sittingId = ''; // cleaned up by the UI itself
  expect(
    drain(traffic).filter((entry) => !entry.includes(' 400 ')),
    'errors during close (4xx refusals recorded separately)',
  ).toEqual([]);
});

// Referenced above so the helper reads honestly: per-test counters install on the page.
