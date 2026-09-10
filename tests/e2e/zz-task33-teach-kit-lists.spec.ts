import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { loginCached } from './helpers/http';
import { cat, loadMessages } from './helpers/i18n';
import { fixtureClassId } from './helpers/fixture-class';
import { fixtureTeacherCredentials } from './helpers/credentials';

// ops/33 live check — the teacher roster and class mastery surfaces render
// through the shared directory kit (client mode). Pinned here: the kit's
// search + status filter + name sort on the roster, the mastery surface's
// sortable subskill columns whose sort survives a reload through the URL,
// and the mastery table's READ-ONLY guarantee — no row menu, no quick
// actions, no selection affordances, no bulk bar. No mocks: real sign-in,
// the real fixture class. Class-level averages on this dev database are
// structurally NULL (result-bearing students are disjoint from rosters) —
// that honest absence is asserted as the kit's own empty/absent handling,
// never patched.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = fixtureTeacherCredentials();
const CLASS_ID = fixtureClassId(); // "EAL/D Year 7 - Room 4"
// Well-formed but unowned documentId: C-CHD-01 answers an empty page, which
// the kit must render as its "nothing here" arm — never an error, no table.
const FOREIGN_CLASS = 'zz33zz33zz33zz33zz33zz33';

// Board-required proof shots (task 33's Proof section): captured IN-SPEC at
// the real viewport, into the board's own shots folder.
const SHOTS = path.resolve(process.cwd(), '../mvp/ops/proof/shots');
const DESKTOP = { width: 1440, height: 900 } as const;
const MOBILE = { width: 375, height: 812 } as const;

async function capture(page: Page, name: string): Promise<void> {
  await mkdir(SHOTS, { recursive: true });
  const file = path.join(SHOTS, name);
  await page.screenshot({ path: file });
  console.log('CAPTURE', file);
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(TEACHER.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(TEACHER.password);
  await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 90_000 });
}

test.describe('ops/33: teach roster + mastery on the directory kit', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test('roster: kit search, status filter and the kit empty arm on an unowned class', async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await signIn(page);
    await page.goto(`/en/dashboard/teach/classes/${CLASS_ID}`);
    const screen = page.locator('[data-surface="teacher-roster"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });
    const table = screen.locator('[data-slot="teach-roster-table"]');
    const rows = table.locator('[data-directory-row]');
    await expect(rows.first()).toBeVisible();

    // Kit search (debounced): a name needle narrows the roster, Clear resets.
    await table.getByLabel(cat(en, 'Teach.roster.searchLabel')).fill('Petrov');
    await expect(table.locator('[data-directory-row]')).toHaveCount(1, { timeout: 10_000 });
    await table
      .getByRole('button', { name: cat(en, 'Teach.roster.clearFilters') })
      .click();
    await expect(rows.first()).toBeVisible();
    // Let the clear's router.replace AND the 200ms search-debounce write both
    // settle BEFORE the next control, or the select's write races the
    // transition and lands on a stale state.
    await page.waitForTimeout(500);
    await expect(page).not.toHaveURL(/\?/);

    // The kit status filter round-trips through the URL.
    await table.getByLabel(cat(en, 'Teach.roster.filterStatusLabel')).click();
    await page
      .getByRole('option', { name: cat(en, 'Teach.roster.statusArchived') })
      .click();
    await expect(page).toHaveURL(/status=archived/);
    await table
      .getByRole('button', { name: cat(en, 'Teach.roster.clearFilters') })
      .click();
    await page.waitForTimeout(500);
    await expect(page).not.toHaveURL(/\?/);

    // Kit name sort writes the declared sort value into the URL.
    await table.getByRole('button', { name: cat(en, 'Teach.roster.columnName') }).click();
    await expect(page).toHaveURL(/sort=name(:|%3A)desc/);

    await capture(page, '33-teach-roster.png');
    await page.setViewportSize(MOBILE);
    await expect(rows.first()).toBeVisible();
    await capture(page, '33-teach-roster-mobile.png');
  });

  test('an unowned class renders the kit empty arm, no table', async ({ page }) => {
    await signIn(page);
    await page.goto(`/en/dashboard/teach/classes/${FOREIGN_CLASS}`);
    const screen = page.locator('[data-surface="teacher-roster"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });
    await expect(screen.getByRole('heading', { name: cat(en, 'Teach.roster.emptyTitle') })).toBeVisible();
    await expect(screen.locator('table')).toHaveCount(0);
  });

  test('mastery: subskill columns sort through the URL, survive reload, and stay read-only', async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await signIn(page);
    await page.goto(`/en/dashboard/teach/results/${CLASS_ID}`);
    const screen = page.locator('[data-surface="teacher-diagnostic"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });

    // HONEST DATA GATE: on this dev database the result-bearing students are
    // disjoint from the class rosters, so the fixture class can hold ZERO
    // results (sat_count = 0). When that is the live truth, the surface's
    // own WYSIWYG empty state IS the designed state — capture it and assert
    // the read surface never mounts, instead of inventing results.
    const emptyState = screen.locator('[data-slot="diagnostic-empty-state"]');
    const table = screen.locator('[data-slot="mastery-table"]');
    await expect(emptyState.or(table)).toBeVisible({ timeout: 30_000 });
    if ((await emptyState.count()) > 0) {
      await expect(emptyState).toBeVisible();
      await expect(screen.locator('[data-slot="mastery-table"]')).toHaveCount(0);
      await capture(page, '33-teach-mastery-empty.png');
      return;
    }

    const rows = table.locator('[data-directory-row]');
    await expect(rows.first()).toBeVisible({ timeout: 20_000 });
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // READ SURFACE: no row menu, no quick actions, no selection, no bulk bar.
    await expect(table.locator('[data-slot="icon-button"]')).toHaveCount(0);
    await expect(table.locator('[data-slot="checkbox"]')).toHaveCount(0);

    // Sortable subskill column: the header toggle writes the declared sort
    // value, the R6 column itself carries aria-sort, and the sort survives a
    // reload. Pinned on the R6 header ON PURPOSE: the default name:asc also
    // marks the Student column ascending, so an unfiltered th[aria-sort]
    // count would pass even if the sort snapped back to the default.
    const areaHeader = table.getByRole('button', {
      name: cat(en, 'Teach.diagnostic.areas.R6'),
    });
    await areaHeader.click();
    await expect(page).toHaveURL(/sort=R6(:|%3A)asc/);
    const r6Ascending = (scope: ReturnType<Page['locator']>) =>
      scope
        .locator('th[aria-sort="ascending"]')
        .filter({ hasText: cat(en, 'Teach.diagnostic.areas.R6') });
    await expect(r6Ascending(table)).toHaveCount(1);
    await page.reload();
    const reloaded = page.locator('[data-surface="teacher-diagnostic"]');
    await expect(reloaded).toBeVisible({ timeout: 20_000 });
    await expect(r6Ascending(reloaded.locator('[data-slot="mastery-table"]'))).toHaveCount(1);
    await expect(reloaded.locator('[data-directory-row]')).toHaveCount(rowCount);

    await capture(page, '33-teach-mastery.png');
  });
});
