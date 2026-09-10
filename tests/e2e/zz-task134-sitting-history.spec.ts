import path from 'node:path';

import { format } from 'date-fns';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, icu, loadMessages } from './helpers/i18n';
import { fixtureClassId } from './helpers/fixture-class';
import { fixtureTeacherCredentials } from './helpers/credentials';

// Task 134 (st-mvp-pivot) — C-SIT-07 sitting history. Permanent spec: the
// history table on the test-day page renders the class's real sittings, cell
// for cell against a live API read in the same spec (DOM equals API truth; no
// network mocks, no seeded mutations — the fixture teacher is read-only here).
// The empty state is asserted conditionally: the fixture teacher owns a single
// class, so which branch runs depends on whether that class has sittings.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = fixtureTeacherCredentials();
const CLASS_ID = fixtureClassId(); // "EAL/D Year 7 - Room 4"
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
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(TEACHER.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(TEACHER.password);
  await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
  // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  // late role redirect can never hijack the goto that follows.
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 90_000 });
}

// C-SIT-07: per-class sitting history, newest first, owning teacher only.
async function fetchHistory(request: APIRequestContext, jwt: string): Promise<SittingHistoryRow[]> {
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

    // Row count equals the API row count. (The kit pages at 100; the fixture
    // class's history sits well under that, so one page carries all rows.)
    const bodyRows = section.locator('tbody tr');
    await expect(bodyRows).toHaveCount(rows.length, { timeout: 30_000 });

    // Read the whole grid in one pass, then diff it in order against the API
    // truth (the server sends newest first and the table renders rows as-is).
    // textContent, not innerText: the StatusPill's CSS uppercase transform
    // would otherwise turn the catalog's "Closed" into "CLOSED".
    // ops/35: the table renders through the directory kit, whose row carries
    // a trailing actions cell after the six content cells — the diff covers
    // the six CONTENT cells in order, and the actions cell is asserted
    // separately below.
    const domRows = await bodyRows.all();
    const grid = await Promise.all(
      domRows.map(async (row) =>
        (await row.locator('td').allTextContents()).map((cell) => cell.trim()),
      ),
    );
    expect(grid.map((cells) => cells.slice(0, 6))).toEqual(rows.map(expectedCells));

    // ops/35 kit contracts on every row: the kit's row marker, and the
    // per-sitting quick action (write-free navigation) plus the row menu.
    const firstRow = section.locator('[data-directory-row]').first();
    await expect(firstRow).toBeVisible();
    await expect(
      firstRow.getByRole('button', {
        name: cat(en, 'Teach.testDay.history.openAction'),
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      firstRow.getByRole('button', {
        name: cat(en, 'Teach.testDay.history.rowMenuLabel'),
        exact: true,
      }),
    ).toBeVisible();

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
    // payload: no sittings -> the kit's empty arm renders; sittings -> it
    // never leaks. (ops/35: the kit's arm owns the copy — the title is the
    // arm's REAL heading, the empty-state slot carries the body line.)
    const emptyState = section.locator('[data-slot="empty-state"]');
    if (rows.length === 0) {
      await expect(
        section.getByRole('heading', { name: cat(en, 'Teach.testDay.history.emptyTitle') }),
      ).toBeVisible({ timeout: 30_000 });
      await expect(emptyState).toBeVisible({ timeout: 30_000 });
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

  // ops/35 — the history renders through the shared directory kit: search,
  // the outcome filter, the date sort and the pager all come from the kit and
  // round-trip through the URL (the `history-` param prefix — the test-day
  // screen hosts the monitor list beside this one).
  test('ops/35: kit search, outcome filter and date sort round-trip through the URL', async ({
    page,
    request,
  }) => {
    const jwt = await loginCached(request, API, TEACHER);
    const rows = await fetchHistory(request, jwt);
    expect(rows.length, 'fixture class should have sitting history').toBeGreaterThan(0);

    await signIn(page);
    await page.goto(TEST_DAY_URL);
    const section = historySection(page);
    await expect(section).toBeVisible({ timeout: 30_000 });
    const tableRows = section.locator('[data-directory-row]');
    await expect(tableRows).toHaveCount(rows.length, { timeout: 30_000 });

    // The kit pager is present (the history pages at 100; one page here).
    await expect(
      section.getByRole('navigation', { name: cat(en, 'Teach.testDay.history.paginationLabel') }),
    ).toBeVisible();

    // Search over the row's real text (form + sitting code — C-SIT-07 serves
    // no student names): the needle narrows to the payload's own matches.
    const needleRow = rows.find((row) => row.form_code) ?? rows[0];
    const needle = needleRow.form_code ?? needleRow.code;
    if (needle) {
      await section.getByLabel(cat(en, 'Teach.testDay.history.searchLabel')).fill(needle);
      const matching = rows.filter(
        (row) =>
          (row.form_code ?? '').toLowerCase().includes(needle.toLowerCase()) ||
          (row.code ?? '').toLowerCase().includes(needle.toLowerCase()),
      );
      await expect(tableRows).toHaveCount(matching.length, { timeout: 10_000 });
      await expect(page).toHaveURL(/history-q=/);
      await section
        .getByRole('button', { name: cat(en, 'Teach.testDay.history.clearFilters') })
        .click();
      await expect(tableRows).toHaveCount(rows.length, { timeout: 10_000 });
      await page.waitForTimeout(500);
    }

    // The outcome filter round-trips and survives a reload.
    await section.getByLabel(cat(en, 'Teach.testDay.history.filterOutcomeLabel')).click();
    await page
      .getByRole('option', { name: cat(en, 'Teach.testDay.history.status.closed') })
      .click();
    await expect(page).toHaveURL(/history-status=closed/);
    const closedCount = rows.filter((row) => row.status === 'closed').length;
    await expect(tableRows).toHaveCount(closedCount, { timeout: 10_000 });
    await page.reload();
    const reloaded = historySection(page);
    await expect(reloaded).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/history-status=closed/);
    await expect(reloaded.locator('[data-directory-row]')).toHaveCount(closedCount, {
      timeout: 30_000,
    });

    // The date sort toggles through the Opened header and round-trips too.
    await reloaded.getByRole('button', { name: cat(en, 'Teach.testDay.history.columns.opened') }).click();
    await expect(page).toHaveURL(/history-sort=opened(:|%3A)asc/);
    await expect(
      reloaded.getByRole('columnheader', { name: cat(en, 'Teach.testDay.history.columns.opened') }),
    ).toHaveAttribute('aria-sort', 'ascending', { timeout: 10_000 });
    await page.reload();
    const sortCheck = historySection(page);
    await expect(sortCheck).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/history-sort=opened(:|%3A)asc/);
    await expect(
      sortCheck.getByRole('columnheader', { name: cat(en, 'Teach.testDay.history.columns.opened') }),
    ).toHaveAttribute('aria-sort', 'ascending', { timeout: 30_000 });

    // Leave a clean URL for the capture test.
    await page.goto(TEST_DAY_URL);
  });

  // ops/35 — the 1440x900 proof capture of the history's kit surface.
  test('ops/35 capture: the sitting history kit surface at 1440x900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await signIn(page);
    await page.goto(TEST_DAY_URL);
    const section = historySection(page);
    await expect(section).toBeVisible({ timeout: 30_000 });
    await expect(section.locator('[data-directory-row]').first()).toBeVisible({
      timeout: 30_000,
    });
    await section.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    const shotPath = path.resolve(
      process.cwd(),
      '..',
      'mvp',
      'ops',
      'proof',
      'shots',
      '35-sitting-history.png',
    );
    await page.screenshot({ path: shotPath });
    console.log('CAPTURE', shotPath);
  });
});
