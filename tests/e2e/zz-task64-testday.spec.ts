import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, loadMessages } from './helpers/i18n';
import { fixtureClassId } from './helpers/fixture-class';
import { fixtureStudentId } from './helpers/fixture-ids';
import { fixtureTeacherCredentials } from './helpers/credentials';
import { roleCredentials } from './helpers/credentials';

// Task 64 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Teacher test-day screen (mvp-updates §4.5, C-SIT-01/02/03): start a sitting,
// reveal the access code (hidden by default), the live monitor flips Sofia
// not_joined -> joined when she joins through the public C-SIT-01 route, the
// confirmed re-sit returns her to a joinable state (fresh session on re-join),
// and close/reopen toggle the sitting (a closed sitting blocks join with 400).
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = fixtureTeacherCredentials();
const SCHOOL_ADMIN = roleCredentials('schoolAdmin');
const CLASS_ID = fixtureClassId(); // "EAL/D Year 7 - Room 4"
const SOFIA_ID = fixtureStudentId('Sofia', 'Petrov');
const SOFIA_EMAIL = 'sofia.petrov@schooltest.local';
const TEST_DAY_URL = `/en/dashboard/teach/classes/${CLASS_ID}/test-day`;

async function login(
  request: APIRequestContext,
  credentials: { email: string; password: string },
): Promise<string> {
  return loginCached(request, API, credentials);
}

async function signIn(page: Page, credentials: { email: string; password: string }): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(credentials.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(credentials.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  // late role redirect can never hijack the goto that follows. The axios
  // layer rides out any 429 on the auth POST, so allow for that here.
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 90_000 });
}

interface SittingRow {
  documentId: string;
  status: 'open' | 'closed';
}

async function listClassSittings(request: APIRequestContext, jwt: string): Promise<SittingRow[]> {
  const res = await fetchWithRetry(() =>
    request.get(
      `${API}/api/sittings?filters[class][documentId][$eq]=${CLASS_ID}&sort=createdAt:desc`,
      { headers: { Authorization: `Bearer ${jwt}` } },
    ),
  );
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { data: SittingRow[] }).data;
}

async function closeSitting(
  request: APIRequestContext,
  jwt: string,
  documentId: string,
): Promise<void> {
  const res = await fetchWithRetry(() =>
    request.post(`${API}/api/sittings/${documentId}/close`, {
      headers: { Authorization: `Bearer ${jwt}` },
    }),
  );
  expect(res.ok()).toBeTruthy();
}

function joinAsSofia(request: APIRequestContext, code: string) {
  // C-SIT-01 v2 public join: code + school email.
  return fetchWithRetry(() =>
    request.post(`${API}/api/sittings/join`, {
      data: { code, email: SOFIA_EMAIL },
    }),
  );
}

async function ensureSofiaEmail(request: APIRequestContext): Promise<void> {
  const jwt = await login(request, SCHOOL_ADMIN);
  const res = await fetchWithRetry(() =>
    request.patch(`${API}/api/schools/me/children/${SOFIA_ID}`, {
      headers: { Authorization: `Bearer ${jwt}` },
      data: { email: SOFIA_EMAIL },
    }),
  );
  expect(res.ok(), await res.text()).toBeTruthy();
}

test.describe('task 64: teacher test-day screen vs live C-SIT-01/02/03', () => {
  // Serial: one sitting lifecycle driven end to end through the real UI. The
  // timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test('start -> reveal -> live join -> re-sit -> close/reopen', async ({ page, request }) => {
    const jwt = await login(request, TEACHER);
    await ensureSofiaEmail(request);
    // Setup: close any open sittings so the screen starts in the empty state.
    for (const sitting of await listClassSittings(request, jwt)) {
      if (sitting.status === 'open') await closeSitting(request, jwt, sitting.documentId);
    }

    try {
      await signIn(page, TEACHER);
      await page.goto(TEST_DAY_URL);
      const screen = page.locator('[data-surface="teacher-test-day"]');
      await expect(screen).toBeVisible({ timeout: 20_000 });

      // Every sitting closed -> the latest closed board shows with the start of
      // the next sitting on top.
      const start = screen.getByRole('button', { name: cat(en, 'TestDay.startCta'), exact: true });
      await expect(start).toBeVisible({ timeout: 15_000 });
      await start.click();

      // The code card appears with the code hidden by default; Sofia is listed
      // as not joined.
      const card = screen.locator('[data-slot="code-reveal-card"]');
      await expect(card).toBeVisible({ timeout: 15_000 });
      await expect(card.locator('[data-slot="access-code-hidden"]')).toBeVisible();
      const sofiaRow = screen.locator(`[data-student="${SOFIA_ID}"]`);
      await expect(
        sofiaRow.getByText(cat(en, 'TestDay.monitor.state.not_joined'), { exact: true }),
      ).toBeVisible({ timeout: 15_000 });

      // Reveal mints the code and shows it large for the board.
      await card
        .getByRole('button', { name: cat(en, 'TestDay.code.revealCta'), exact: true })
        .click();
      const codeEl = card.locator('[data-slot="access-code"]');
      await expect(codeEl).toBeVisible({ timeout: 15_000 });
      const code = ((await codeEl.textContent()) ?? '').trim();
      expect(code).toMatch(/^[A-Z]+-\d+$/);

      // A real student join through the public route flips the monitor row live
      // (5 s poll, no reload).
      const join = await joinAsSofia(request, code);
      expect(join.ok()).toBeTruthy();
      await expect(
        sofiaRow.getByText(cat(en, 'TestDay.monitor.state.joined'), { exact: true }),
      ).toBeVisible({ timeout: 20_000 });

      // Re-sit with the confirm dialog: the attempt ends and the row leaves the
      // joined state...
      await sofiaRow
        .getByRole('button', { name: cat(en, 'TestDay.resit.cta'), exact: true })
        .click();
      await page
        .getByRole('button', { name: cat(en, 'TestDay.resit.confirm'), exact: true })
        .click();
      await expect(
        sofiaRow.getByText(cat(en, 'TestDay.monitor.state.joined'), { exact: true }),
      ).toHaveCount(0, { timeout: 20_000 });
      // ...and Sofia can join again fresh (C-SIT-03 promise: resumed === false).
      const rejoin = await joinAsSofia(request, code);
      expect(rejoin.ok()).toBeTruthy();
      const rejoinBody = (await rejoin.json()) as { session: { resumed: boolean } };
      expect(rejoinBody.session.resumed).toBe(false);

      // Close: the pill flips, reveal is disabled, and join is blocked (400).
      await card
        .getByRole('button', { name: cat(en, 'TestDay.code.hideCta'), exact: true })
        .click();
      await screen
        .getByRole('button', { name: cat(en, 'TestDay.monitor.closeCta'), exact: true })
        .click();
      await expect(
        screen.locator('h1').locator('xpath=following-sibling::*[@data-slot="status-pill"]'),
      ).toHaveText(cat(en, 'TestDay.status.closed'), { timeout: 15_000 });
      await expect(
        card.getByRole('button', { name: cat(en, 'TestDay.code.revealCta'), exact: true }),
      ).toBeDisabled();
      const blocked = await joinAsSofia(request, code);
      expect(blocked.status()).toBe(400);

      // Reopen: the pill flips back and reveal is enabled again.
      await screen
        .getByRole('button', { name: cat(en, 'TestDay.monitor.reopenCta'), exact: true })
        .click();
      await expect(
        screen.locator('h1').locator('xpath=following-sibling::*[@data-slot="status-pill"]'),
      ).toHaveText(cat(en, 'TestDay.status.open'), { timeout: 15_000 });
      await expect(
        card.getByRole('button', { name: cat(en, 'TestDay.code.revealCta'), exact: true }),
      ).toBeEnabled();

      // Tidy: leave the sitting closed so the next run starts clean.
    } finally {
      const [latest] = await listClassSittings(request, jwt);
      if (latest?.status === 'open') await closeSitting(request, jwt, latest.documentId);
    }
  });

  test('a class with no sittings renders the empty state', async ({ page }) => {
    await signIn(page, TEACHER);
    // Well-formed but never-used class documentId: the teacher-scoped list is
    // empty for it, so the screen offers "Start a sitting".
    await page.goto('/en/dashboard/teach/classes/zz64zz64zz64zz64zz64zz64/test-day');
    const screen = page.locator('[data-surface="teacher-test-day"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });
    await expect(screen.getByText(cat(en, 'TestDay.emptyTitle'), { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      screen.getByRole('button', { name: cat(en, 'TestDay.startCta'), exact: true }),
    ).toBeVisible();
    await expect(screen.locator('[data-slot="code-reveal-card"]')).toHaveCount(0);
  });
});


// teacher/08 — the folded console states, captured IN-SPEC at 1440x900. Every
// state is driven through the real product (real C-SIT-01 create, real join,
// real close control) — nothing is seeded or mocked into a screenshot.
test.describe('teacher/08: folded console captures', () => {
  test.describe.configure({ mode: 'serial', timeout: 240_000 });
  const SHOTS = path.resolve(process.cwd(), '..', 'mvp', 'teacher', 'proof', 'shots');
  const shot = (page: Page, name: string) => page.screenshot({ path: path.join(SHOTS, name), fullPage: true });

  test('console route + the working close-confirm', async ({ page, request }) => {
    const jwt = await login(request, TEACHER);
    await ensureSofiaEmail(request);
    for (const sitting of await listClassSittings(request, jwt)) {
      if (sitting.status === 'open') await closeSitting(request, jwt, sitting.documentId);
    }
    await signIn(page, TEACHER);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(TEST_DAY_URL);
    const screen = page.locator('[data-surface="teacher-test-day"]');
    await expect(screen).toBeVisible({ timeout: 30_000 });
    await shot(page, '08-console-route.png');

    const start = screen.getByRole('button', { name: cat(en, 'TestDay.startCta'), exact: true });
    await expect(start).toBeVisible({ timeout: 30_000 });
    await start.click();
    const card = screen.locator('[data-slot="code-reveal-card"]');
    await expect(card).toBeVisible({ timeout: 30_000 });
    await card.getByRole('button', { name: cat(en, 'TestDay.code.revealCta'), exact: true }).click();
    const codeEl = card.locator('[data-slot="access-code"]');
    await expect(codeEl).toBeVisible({ timeout: 30_000 });
    const code = ((await codeEl.textContent()) ?? '').trim();
    const join = await joinAsSofia(request, code);
    expect(join.ok()).toBeTruthy();

    await screen
      .getByRole('button', { name: cat(en, 'TestDay.monitor.closeCta'), exact: true })
      .click();
    const dialog = page.locator('[role="alertdialog"]');
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await shot(page, '08-close-confirm-working.png');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await closeSitting(request, jwt, code === '' ? '' : (await listClassSittings(request, jwt))[0].documentId);
  });

  test('console tab with an open sitting, then the navy no-sitting panel', async ({ page, request }) => {
    const jwt = await login(request, TEACHER);
    await signIn(page, TEACHER);
    await page.setViewportSize({ width: 1440, height: 900 });

    // Open one real sitting through the test-day console's own start control.
    await page.goto(TEST_DAY_URL);
    const screen = page.locator('[data-surface="teacher-test-day"]');
    await expect(screen).toBeVisible({ timeout: 30_000 });
    const start = screen.getByRole('button', { name: cat(en, 'TestDay.startCta'), exact: true });
    await expect(start).toBeVisible({ timeout: 30_000 });
    await start.click();
    await expect(screen.locator('[data-slot="code-reveal-card"]')).toBeVisible({ timeout: 30_000 });

    // The class shell's Live sessions tab IS the embedded console.
    await page.goto(`/en/dashboard/results/${CLASS_ID}`);
    await page.getByRole('tab', { name: cat(en, 'Teacher.results.tabs.live') }).click();
    await expect(
      page.locator('[data-slot="test-day"][data-surface="teacher-test-day"]'),
    ).toBeVisible({ timeout: 30_000 });
    await shot(page, '08-console-tab.png');
  });

  test('nothing open: the navy no-sitting panel + previous sessions + the quiet close-confirm', async ({ page, request }) => {
    const jwt = await login(request, TEACHER);
    await signIn(page, TEACHER);
    await page.setViewportSize({ width: 1440, height: 900 });

    // Close EVERY open sitting for the class (real C-SIT close) so the
    // no-sitting state is genuinely reached on the class shell's live tab.
    for (const sitting of await listClassSittings(request, jwt)) {
      if (sitting.status === 'open') await closeSitting(request, jwt, sitting.documentId);
    }
    await page.goto(`/en/dashboard/results/${CLASS_ID}`);
    await page.getByRole('tab', { name: cat(en, 'Teacher.results.tabs.live') }).click();
    await expect(
      page.locator('[data-slot="test-day"][data-surface="teacher-test-day"]'),
    ).toBeVisible({ timeout: 30_000 });
    await shot(page, '08-no-sitting.png');

    // Previous-sessions history on the test-day route.
    await page.goto(TEST_DAY_URL);
    await expect(page.locator('[data-slot="test-day"]')).toBeVisible({ timeout: 30_000 });
    await shot(page, '08-previous-sessions.png');

    // Quiet close-confirm: a fresh sitting nobody has joined.
    await page.goto(TEST_DAY_URL);
    const screen = page.locator('[data-surface="teacher-test-day"]');
    await expect(screen).toBeVisible({ timeout: 30_000 });
    const start = screen.getByRole('button', { name: cat(en, 'TestDay.startCta'), exact: true });
    await expect(start).toBeVisible({ timeout: 30_000 });
    await start.click();
    await expect(screen.locator('[data-slot="code-reveal-card"]')).toBeVisible({ timeout: 30_000 });
    await screen
      .getByRole('button', { name: cat(en, 'TestDay.monitor.closeCta'), exact: true })
      .click();
    const dialog = page.locator('[role="alertdialog"]');
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await shot(page, '08-close-confirm-quiet.png');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    // Leave nothing open behind: close through the real endpoint.
    for (const sitting of await listClassSittings(request, jwt)) {
      if (sitting.status === 'open') await closeSitting(request, jwt, sitting.documentId);
    }
  });
});
