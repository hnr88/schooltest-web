import { format } from 'date-fns';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, icu, loadMessages } from './helpers/i18n';

// Task 134 (st-mvp-pivot) — C-SIT-07 sitting history. Permanent spec: the
// history table on the test-day page renders the class's real sittings, cell
// for cell against a live API read in the same spec (DOM equals API truth; no
// network mocks, no seeded mutations — the fixture teacher is read-only here).
// The empty state is asserted conditionally: the fixture teacher owns a single
// class, so which branch runs depends on whether that class has sittings.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = { email: process.env.E2E_TEACHER_EMAIL ?? 'teacher@schooltest.local', password: process.env.E2E_TEACHER_PASSWORD ?? 'Teacher1234!' };
const CLASS_ID = 'x1hat1dy90boz11n9zyphoan'; // "EAL/D Year 7 - Room 4"
const TEST_DAY_URL = `/en/dashboard/teach/classes/${CLASS_ID}/test-day`;

// Matches SittingHistoryTable's OPENED_AT_PATTERN.
const OPENED_AT_PATTERN = 'd MMM yyyy';

interface SittingHistoryRow {
  documentId: string;
  code: string | null;
  form_code: string | null;
  status: 'open' | 'closed';
  opened_at: string | null;
  closed_at: string | null;
  joined: number;
  submitted: number;
  total: number;
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(TEACHER.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(TEACHER.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  // late role redirect can never hijack the goto that follows.
  await page.waitForURL('**/dashboard/teach**', { timeout: 90_000 });
}

// C-SIT-07: per-class sitting history, newest first, owning teacher only.
async function fetchHistory(
  request: APIRequestContext,
  jwt: string,
): Promise<SittingHistoryRow[]> {
  const res = await fetchWithRetry(() =>
    request.get(`${API}/api/sittings?class=${CLASS_ID}&summary=true`, {
      headers: { Authorization: `Bearer ${jwt}` },
    }),
  );
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { data: SittingHistoryRow[] }).data;
}

// The exact cell strings SittingHistoryTable renders for one API row.
function expectedCells(row: SittingHistoryRow): string[] {
  const missing = cat(en, 'Teach.testDay.history.missingValue');
  const total = String(row.total);
  return [
    row.opened_at ? format(new Date(row.opened_at), OPENED_AT_PATTERN) : missing,
    row.code ?? missing,
    row.form_code ?? missing,
    cat(en, `Teach.testDay.history.status.${row.status}`),
    icu(cat(en, 'Teach.testDay.history.joinedCount'), { joined: String(row.joined), total }),
    icu(cat(en, 'Teach.testDay.history.submittedCount'), {
      submitted: String(row.submitted),
      total,
    }),
  ];
}

function historySection(page: Page) {
  return page.getByRole('region', { name: cat(en, 'Teach.testDay.history.title') });
}

test.describe('C-SIT-07: sitting history table vs live API', () => {
  // Serial + generous timeout: rate-limit ride-out budget (helpers/http.ts).
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  test('renders one row per API sitting, cell for cell', async ({ page, request }) => {
    const jwt = await loginCached(request, API, TEACHER);
    const rows = await fetchHistory(request, jwt);
    expect(rows.length, 'fixture class should have sitting history').toBeGreaterThan(0);

    await signIn(page);
    await page.goto(TEST_DAY_URL);
    const section = historySection(page);
    await expect(section).toBeVisible({ timeout: 30_000 });

    // Row count equals the API row count.
    const bodyRows = section.locator('tbody tr');
    await expect(bodyRows).toHaveCount(rows.length, { timeout: 30_000 });

    // Read the whole grid in one pass, then diff it in order against the API
    // truth (the server sends newest first and the table renders rows as-is).
    // textContent, not innerText: the StatusPill's CSS uppercase transform
    // would otherwise turn the catalog's "Closed" into "CLOSED".
    const domRows = await bodyRows.all();
    const grid = await Promise.all(
      domRows.map(async (row) =>
        (await row.locator('td').allTextContents()).map((cell) => cell.trim()),
      ),
    );
    expect(grid).toEqual(rows.map(expectedCells));

    // Every visible code comes from the API payload (implied by the grid diff,
    // asserted here against the payload's code set per the task wording).
    const apiCodes = new Set(rows.map((row) => row.code).filter((code) => code !== null));
    const missing = cat(en, 'Teach.testDay.history.missingValue');
    for (const cells of grid) {
      const visibleCode = cells[1];
      if (visibleCode !== missing) {
        expect(apiCodes.has(visibleCode), `visible code ${visibleCode}`).toBe(true);
      }
    }

    // The first row's joined/submitted cells read "n/total" off the API numbers.
    const first = rows[0];
    const total = String(first.total);
    await expect(bodyRows.first()).toContainText(
      icu(cat(en, 'Teach.testDay.history.joinedCount'), { joined: String(first.joined), total }),
    );
    await expect(bodyRows.first()).toContainText(
      icu(cat(en, 'Teach.testDay.history.submittedCount'), {
        submitted: String(first.submitted),
        total,
      }),
    );
  });

  test('empty state appears only when the class has no sittings', async ({ page, request }) => {
    const jwt = await loginCached(request, API, TEACHER);
    const rows = await fetchHistory(request, jwt);

    await signIn(page);
    await page.goto(TEST_DAY_URL);
    const section = historySection(page);
    await expect(section).toBeVisible({ timeout: 30_000 });

    // The fixture teacher owns only this class, so the branch follows the live
    // payload: no sittings -> the EmptyState renders; sittings -> it never leaks.
    const emptyState = section.locator('[data-slot="empty-state"]');
    if (rows.length === 0) {
      await expect(emptyState).toBeVisible({ timeout: 30_000 });
      await expect(emptyState).toContainText(cat(en, 'Teach.testDay.history.emptyTitle'));
      await expect(emptyState).toContainText(cat(en, 'Teach.testDay.history.emptyBody'));
      await expect(section.locator('tbody tr')).toHaveCount(0);
    } else {
      await expect(section.locator('tbody tr')).toHaveCount(rows.length, { timeout: 30_000 });
      await expect(emptyState).toHaveCount(0);
      await expect(
        section.getByText(cat(en, 'Teach.testDay.history.emptyTitle'), { exact: true }),
      ).toHaveCount(0);
    }
  });
});
