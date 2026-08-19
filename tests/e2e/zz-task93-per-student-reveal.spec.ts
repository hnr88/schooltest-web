import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, icu, loadMessages } from './helpers/i18n';

// Task 93 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Per-student reveal + staggered sitting (mvp-updates §4.5.3, C-SIT-05): the
// teacher reveals the class-wide code to one student from the monitor row, the
// dialog shows the same code as the class-wide card, the copy button toasts,
// and the row flips to code_shown (UI-only audit in localStorage). Sofia then
// joins through the public C-SIT-01 route and only her row advances; a reload
// proves the audit persists for a still-waiting student while joined state
// stays server truth. Fixture restored at the end (Sofia resit, sitting
// closed) in a finally so a red run never leaks an open sitting.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const APP_ORIGIN = process.env.E2E_BASE_URL ?? 'http://localhost:3101';
const TEACHER = { email: process.env.E2E_TEACHER_EMAIL ?? 'teacher@schooltest.local', password: process.env.E2E_TEACHER_PASSWORD ?? 'Teacher1234!' };
const CLASS_ID = 'x1hat1dy90boz11n9zyphoan'; // "EAL/D Year 7 - Room 4"
const SOFIA_ID = 'kxd4f1r27muoajv7ww18blvp';
const SOFIA_NAME = 'Sofia Petrov';
const SOFIA_EMAIL = 'sofia.petrov@schooltest.local';
// Import Beta is never revealed and never joins: the staggered control row.
// (The monitor's active roster skips email-less students such as Daniel Kim.)
const BETA_ID = 'zkko2okpnsolmt6m1zg7aqh0';
// Import Alpha is revealed second and stays waiting across the reload.
const ALPHA_ID = 'tqllrynirhpde967ej36s6k3';
const ALPHA_NAME = 'Import Alpha';
const REVEAL_AUDIT_KEY = 'schooltest-test-day-reveal-audit';
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
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(credentials.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  // late role redirect can never hijack the goto that follows. The axios
  // layer rides out any 429 on the auth POST, so allow for that here.
  await page.waitForURL('**/dashboard/teach**', { timeout: 90_000 });
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

// C-SIT-03 restore: end Sofia's in-flight session so she is joinable again.
// Safe when she has no session (the service ends nothing and returns 200).
async function resitSofia(
  request: APIRequestContext,
  jwt: string,
  sittingDocumentId: string,
): Promise<void> {
  const res = await fetchWithRetry(() =>
    request.post(`${API}/api/sittings/${sittingDocumentId}/resit`, {
      headers: { Authorization: `Bearer ${jwt}` },
      data: { student_documentId: SOFIA_ID },
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

function revealAction(page: Page, studentId: string, name: string) {
  return page
    .locator(`[data-student="${studentId}"]`)
    .getByRole('button', {
      name: icu(cat(en, 'TestDay.studentReveal.actionLabel'), { name }),
      exact: true,
    });
}

test.describe('task 93: per-student reveal vs live C-SIT-05', () => {
  // Serial: one sitting lifecycle driven end to end through the real UI. The
  // timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test('reveal -> copy -> code_shown -> staggered join -> reload persistence -> restore', async ({
    page,
    request,
  }) => {
    const jwt = await login(request, TEACHER);
    // Setup: close any open sittings so the screen starts in the empty state.
    for (const sitting of await listClassSittings(request, jwt)) {
      if (sitting.status === 'open') await closeSitting(request, jwt, sitting.documentId);
    }

    try {
      await signIn(page, TEACHER);
      // The copy flow needs the clipboard; grant before the app code runs.
      await page
        .context()
        .grantPermissions(['clipboard-read', 'clipboard-write'], { origin: APP_ORIGIN });
      await page.goto(TEST_DAY_URL);
      const screen = page.locator('[data-surface="teacher-test-day"]');
      await expect(screen).toBeVisible({ timeout: 20_000 });

      // Start the sitting and mint the code through the page's own controls.
      await expect(
        screen.getByText(cat(en, 'TestDay.status.closed'), { exact: true }),
      ).toBeVisible({ timeout: 15_000 });
      await screen
        .getByRole('button', { name: cat(en, 'TestDay.startCta'), exact: true })
        .click();
      const card = screen.locator('[data-slot="code-reveal-card"]');
      await expect(card).toBeVisible({ timeout: 15_000 });
      await card
        .getByRole('button', { name: cat(en, 'TestDay.code.revealCta'), exact: true })
        .click();
      const codeEl = card.locator('[data-slot="access-code"]');
      await expect(codeEl).toBeVisible({ timeout: 15_000 });
      const code = ((await codeEl.textContent()) ?? '').trim();
      expect(code).toMatch(/^[A-Z]+-\d+$/);

      const sofiaRow = screen.locator(`[data-student="${SOFIA_ID}"]`);
      const betaRow = screen.locator(`[data-student="${BETA_ID}"]`);
      const alphaRow = screen.locator(`[data-student="${ALPHA_ID}"]`);
      await expect(
        sofiaRow.getByText(cat(en, 'TestDay.monitor.state.not_joined'), { exact: true }),
      ).toBeVisible({ timeout: 15_000 });

      // Per-student reveal: the dialog shows the class-wide code, Sofia's
      // email and the "only this student" warning.
      await revealAction(page, SOFIA_ID, SOFIA_NAME).click();
      const dialog = page.locator('[data-slot="student-reveal-dialog"]');
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByText(icu(cat(en, 'TestDay.studentReveal.title'), { name: SOFIA_NAME }), {
          exact: true,
        }),
      ).toBeVisible();
      await expect(dialog.getByText(SOFIA_EMAIL, { exact: true })).toBeVisible();
      await expect(dialog.locator('[data-slot="reveal-code-value"]')).toHaveText(code);
      await expect(
        dialog.getByText(
          icu(cat(en, 'TestDay.studentReveal.onlyThisStudent'), { name: SOFIA_NAME }),
          { exact: true },
        ),
      ).toBeVisible();

      // Copy: the code lands on the clipboard and the success toast fires.
      await dialog.locator('[data-slot="reveal-copy-button"]').click();
      await expect(page.locator('[data-sonner-toast][data-type="success"]')).toContainText(
        cat(en, 'TestDay.studentReveal.copiedToast'),
      );
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code);
      await dialog
        .getByRole('button', { name: cat(en, 'TestDay.studentReveal.closeCta'), exact: true })
        .click();
      await expect(dialog).toHaveCount(0);

      // Staggered state: Sofia's row flips to code_shown, Import Beta stays not
      // joined, and the summary counts the one reveal. The audit entry is in
      // localStorage only.
      await expect(sofiaRow).toHaveAttribute('data-slot', 'monitor-row-code-shown');
      await expect(
        sofiaRow.getByText(cat(en, 'TestDay.monitor.state.code_shown'), { exact: true }),
      ).toBeVisible();
      await expect(
        betaRow.getByText(cat(en, 'TestDay.monitor.state.not_joined'), { exact: true }),
      ).toBeVisible();
      const summary = screen.locator('[data-slot="monitor-summary"]');
      await expect(summary).toContainText(
        icu(cat(en, 'TestDay.monitor.codeShownCount'), { count: '1' }),
      );
      const audit = await page.evaluate((key) => localStorage.getItem(key), REVEAL_AUDIT_KEY);
      expect(audit).not.toBeNull();
      expect(audit).toContain(SOFIA_ID);

      // Sofia joins through the public route (code lookup + join, C-SIT-01):
      // her row advances past code_shown while Import Beta stays not joined.
      const lookup = await fetchWithRetry(() => request.get(`${API}/api/sittings/code/${code}`));
      expect(lookup.ok()).toBeTruthy();
      const join = await joinAsSofia(request, code);
      expect(join.ok()).toBeTruthy();
      await expect(
        sofiaRow.getByText(cat(en, 'TestDay.monitor.state.joined'), { exact: true }),
      ).toBeVisible({ timeout: 20_000 });
      await expect(sofiaRow).not.toHaveAttribute('data-slot', 'monitor-row-code-shown');
      await expect(
        betaRow.getByText(cat(en, 'TestDay.monitor.state.not_joined'), { exact: true }),
      ).toBeVisible();

      // Second reveal (Import Alpha) stays waiting: after a reload her
      // code_shown row survives from the persisted audit, while Sofia's joined
      // state comes back from the server.
      await revealAction(page, ALPHA_ID, ALPHA_NAME).click();
      await expect(dialog).toBeVisible();
      await dialog
        .getByRole('button', { name: cat(en, 'TestDay.studentReveal.closeCta'), exact: true })
        .click();
      await expect(alphaRow).toHaveAttribute('data-slot', 'monitor-row-code-shown');
      await page.reload();
      await expect(screen).toBeVisible({ timeout: 20_000 });
      await expect(
        alphaRow.getByText(cat(en, 'TestDay.monitor.state.code_shown'), { exact: true }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(
        sofiaRow.getByText(cat(en, 'TestDay.monitor.state.joined'), { exact: true }),
      ).toBeVisible();
      await expect(
        betaRow.getByText(cat(en, 'TestDay.monitor.state.not_joined'), { exact: true }),
      ).toBeVisible();

      // Restore: resit Sofia (C-SIT-03) — the monitor leaves the joined state
      // (her lingering audit shows code_shown again; joined is what matters).
      const [started] = await listClassSittings(request, jwt);
      await resitSofia(request, jwt, started.documentId);
      await expect(
        sofiaRow.getByText(cat(en, 'TestDay.monitor.state.joined'), { exact: true }),
      ).toHaveCount(0, { timeout: 20_000 });
    } finally {
      // Tidy even on red: resit Sofia and close the sitting the spec opened.
      const [latest] = await listClassSittings(request, jwt);
      if (latest.status === 'open') {
        await resitSofia(request, jwt, latest.documentId);
        await closeSitting(request, jwt, latest.documentId);
      }
    }
  });
});
