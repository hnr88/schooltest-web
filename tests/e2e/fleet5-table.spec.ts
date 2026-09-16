import { expect, test, type Page } from '@playwright/test';

import {
  apiArchive,
  apiChildren,
  apiCreateStudent,
  apiLogin,
  realErrors,
  shot,
  signIn,
  STAMP,
} from './helpers/fleet5-live';
import { watchErrors } from './helpers/ui';

/**
 * Fleet 5 — the school-admin STUDENTS TABLE (C-CHD-01 roster): load, status
 * pill per row (today's `status` -> `student_status` rename), search hit/miss,
 * status/class/level filters, pagination, ordering, empty states. Live UI
 * against the running dev stack; every step leaves a screenshot in
 * tests/e2e/captures/fleet5/.
 *
 * NOTE on sort: the roster ships NO sort control by design
 * (src/modules/school-students/hooks/use-students-filters.ts — the endpoint's
 * ordering is a hard-coded createdAt:desc with no sort param). The de-facto
 * ordering is what this spec pins instead: the newest-created student is the
 * first row of the default roster.
 */

const ROSTER = '/en/dashboard/school/students';

async function openRoster(page: Page): Promise<ReturnType<Page['locator']>> {
  await page.goto(ROSTER);
  const screen = page.locator('[data-slot="school-students"]');
  await expect(screen).toBeVisible({ timeout: 30_000 });
  const table = screen.locator('[data-slot="school-students-table"]');
  // Fleet load on the shared dev stack makes the first serve slow — 60s.
  await expect(table.getByRole('row').first()).toBeVisible({ timeout: 60_000 });
  return screen;
}

test.describe('fleet5: students table', () => {
  test.setTimeout(90_000);

  test('01 loads Demo School A roster, status attr on every row, subtitle counts', async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const jwt = await apiLogin(request);
    const { total } = await apiChildren(request, jwt, 'page=1&pageSize=1');
    test.skip(total < 25, `Demo School A roster is under one page (total=${total})`);

    await signIn(page);
    const screen = await openRoster(page);
    const table = screen.locator('[data-slot="school-students-table"]');

    // Status pill integrity after today's rename: EVERY row must carry a
    // non-blank data-student-status (a blank value per row = the rename bug).
    const statuses = await table.locator('[data-slot="school-students-row"]').evaluateAll((rows) =>
      rows.map((row) => row.getAttribute('data-student-status')),
    );
    expect(statuses.length, 'roster page holds 25 rows').toBe(25);
    const blank = statuses.filter((status) => status === '' || status === null);
    expect(blank, `blank data-student-status rows: ${JSON.stringify(statuses)}`).toEqual([]);
    const known = statuses.every((status) =>
      ['active', 'archived', 'enrolled'].includes(status as string),
    );
    expect(known, `unknown status values: ${JSON.stringify([...new Set(statuses)])}`).toBe(true);

    // The header subtitle counts from its own read; the kit's Showing count is
    // the filter scope. Other fleet agents mutate this school concurrently, so
    // the two totals are asserted near-equal, not exactly equal.
    await expect(screen.getByText(/\d+ students? across \d+ classes?/)).toBeVisible();
    const showingText = await screen
      .getByText(/Showing \d+ of \d+/)
      .textContent();
    expect(showingText).toBeTruthy();
    const uiTotal = Number(showingText!.match(/of (\d+)/)![1]);
    expect(
      Math.abs(uiTotal - total),
      `UI total ${uiTotal} vs API total ${total} — concurrently mutated DB tolerates drift`,
    ).toBeLessThanOrEqual(10);

    await shot(page, '01-table-default-roster');
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });

  test('02 search hit surfaces the newest student at the top (createdAt desc), search miss shows no-matches state', async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const jwt = await apiLogin(request);
    const family = `${STAMP}Search`;
    const created = await apiCreateStudent(request, jwt, {
      given_name: 'Fleet',
      family_name: family,
      email: `f5.search.${STAMP.toLowerCase()}@schooltest.local`,
      year_level: 8,
    });
    expect(created.status, JSON.stringify(created.error)).toBe(201);

    await signIn(page);
    const screen = await openRoster(page);
    const table = screen.locator('[data-slot="school-students-table"]');

    // De-facto ordering: the newest student leads the default page-1 roster.
    await expect(
      table.locator('[data-slot="school-students-row"]').first(),
    ).toContainText(family, { timeout: 30_000 });
    await shot(page, '02a-newest-student-first-row');

    // Search HIT — server q= on the unique family name.
    await screen.getByLabel('Search by name').fill(family);
    const row = table.locator('[data-slot="school-students-row"]');
    await expect(row).toHaveCount(1, { timeout: 60_000 });
    await expect(row.first()).toContainText(family);
    await expect(row.first()).toContainText('Fleet');
    await shot(page, '02b-search-hit');

    // Search MISS — the kit's no-matches state, not an error, not a crash.
    await screen.getByLabel('Search by name').fill('ZZZNoSuchStudentF5');
    await expect(screen.getByText('No students match these filters.')).toBeVisible({
      timeout: 30_000,
    });
    await shot(page, '02c-search-miss-empty-state');

    // Clearing the search restores the roster (the kit's Clear pill only
    // renders in its pill variant; emptying the query is the same reset).
    await screen.getByLabel('Search by name').fill('');
    await expect(table.getByRole('row').first()).toBeVisible({ timeout: 60_000 });
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });

  test('03 status filter: Active narrows to active, Archived surfaces the archived pill', async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const jwt = await apiLogin(request);
    const family = `${STAMP}Arch`;
    const created = await apiCreateStudent(request, jwt, {
      given_name: 'Archie',
      family_name: family,
      email: `f5.arch.${STAMP.toLowerCase()}@schooltest.local`,
      year_level: 7,
    });
    expect(created.status, JSON.stringify(created.error)).toBe(201);
    const documentId = created.data!.documentId;
    expect(await apiArchive(request, jwt, documentId, 'archive'), 'archive via API').toBe(200);

    await signIn(page);
    const screen = await openRoster(page);
    const table = screen.locator('[data-slot="school-students-table"]');

    // Active filter: every row active (poll — the commit renders before the
    // refetch lands, so a plain row-visible wait reads stale rows).
    await screen.getByLabel('Status', { exact: true }).click();
    await page.getByRole('option', { name: 'Active', exact: true }).click();
    await expect
      .poll(
        async () => {
          const statuses = await table.locator('[data-slot="school-students-row"]').evaluateAll(
            (rows) => rows.map((row) => row.getAttribute('data-student-status')),
          );
          return statuses.length > 0 && statuses.every((status) => status === 'active')
            ? 'filtered'
            : 'stale';
        },
        { timeout: 60_000, intervals: [1_000] },
      )
      .toBe('filtered');
    await shot(page, '03a-filter-active');

    // Archived filter: the archived student is reachable, WITH its pill.
    await screen.getByLabel('Status', { exact: true }).click();
    await page.getByRole('option', { name: 'Archived', exact: true }).click();
    const archivedRow = table.locator('[data-slot="school-students-row"]', {
      hasText: family,
    });
    await expect(archivedRow).toBeVisible({ timeout: 30_000 });
    await expect(archivedRow).toHaveAttribute('data-student-status', 'archived');
    await expect(archivedRow).toContainText('Archived');
    await shot(page, '03b-filter-archived-with-pill');

    // Back to all — the param is OMITTED, not sent as a literal (task 31 wire rule).
    await screen.getByLabel('Status', { exact: true }).click();
    await page.getByRole('option', { name: 'All statuses', exact: true }).click();
    await expect
      .poll(
        async () => new URL(page.url()).searchParams.get('status'),
        { timeout: 30_000, intervals: [500] },
      )
      .toBeNull();
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });

  test('04 class + level filters compose server-side', async ({ page }) => {
    test.setTimeout(90_000);
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await signIn(page);
    const screen = await openRoster(page);
    const table = screen.locator('[data-slot="school-students-table"]');

    await screen.getByLabel('Class', { exact: true }).click();
    await page.getByRole('option', { name: 'Reading 8B — Alvarez', exact: true }).click();
    await page.waitForURL(/class=/, { timeout: 30_000 });
    // The commit renders BEFORE the refetch lands — poll for the CONTENT to
    // reflect the filter (stale rows keep the old list visible meanwhile).
    await expect
      .poll(
        async () => {
          const cells = await table.locator('[data-slot="school-students-row"]').evaluateAll(
            (rows) => rows.map((row) => row.textContent ?? ''),
          );
          if (cells.length === 0) {
            const empty = await screen
              .getByText('No students match these filters.')
              .isVisible()
              .catch(() => false);
            return empty ? 'empty' : 'loading';
          }
          return cells.every((text) => text.includes('Reading 8B — Alvarez'))
            ? 'filtered'
            : 'stale';
        },
        { timeout: 60_000, intervals: [1_000] },
      )
      .toBe('filtered');

    const classCells = await table.locator('[data-slot="school-students-row"]').evaluateAll(
      (rows) => rows.map((row) => row.textContent ?? ''),
    );
    expect(classCells.length, 'class filter still serves rows').toBeGreaterThan(0);
    for (const text of classCells) {
      expect(text).toContain('Reading 8B — Alvarez');
    }
    await shot(page, '04a-filter-class');

    // Level composes additively. The composed filter may legitimately empty
    // this class (no Beginning-phase student) — either arm is a pass; a crash
    // is not.
    await screen.getByLabel('Level', { exact: true }).click();
    await page.getByRole('option', { name: 'Beginning', exact: true }).click();
    await expect
      .poll(
        async () => {
          const rows = await table.locator('[data-slot="school-students-row"]').count();
          const empty = await screen
            .getByText('No students match these filters.')
            .isVisible()
            .catch(() => false);
          return rows > 0 || empty ? 'settled' : 'loading';
        },
        { timeout: 60_000, intervals: [1_000] },
      )
      .toBe('settled');
    await shot(page, '04b-filter-class-plus-level');
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });

  test('05 pagination: 25 per page, page 2 serves rows page 1 does not', async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const jwt = await apiLogin(request);
    const { rows: page2Api, total } = await apiChildren(request, jwt, 'page=2&pageSize=25');
    test.skip(
      total <= 25 || page2Api.length === 0,
      `roster is a single server page (total=${total}) — pagination not exercisable`,
    );

    await signIn(page);
    const screen = await openRoster(page);
    const table = screen.locator('[data-slot="school-students-table"]');
    const pager = screen.locator('[data-slot="directory-pagination"]');
    await expect(pager).toBeVisible();
    await expect(pager.getByText('Page 1 of')).toBeVisible();

    const page1Names = await table.locator('[data-slot="school-students-row"]').evaluateAll(
      (rows) => rows.map((row) => row.textContent ?? ''),
    );
    await shot(page, '05a-page-1');

    await pager.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page).toHaveURL(/[?&]page=2/, { timeout: 15_000 });
    await expect(table.getByRole('row').first()).toBeVisible({ timeout: 30_000 });

    const firstPage2 = page2Api[0]!;
    const expectedName = [firstPage2.given_name, firstPage2.family_name]
      .filter(Boolean)
      .join(' ');
    await expect(
      table.locator('[data-slot="school-students-row"]').first(),
    ).toContainText(firstPage2.family_name ?? firstPage2.given_name ?? '', { timeout: 30_000 });
    const page2Names = await table.locator('[data-slot="school-students-row"]').evaluateAll(
      (rows) => rows.map((row) => row.textContent ?? ''),
    );
    for (const name of page1Names.slice(0, 3)) {
      expect(page2Names.join('\n'), 'page 2 must not repeat page 1 rows').not.toContain(
        name.split('\n')[0]!,
      );
    }
    expect(page2Names.join('\n')).toContain(expectedName);
    await shot(page, '05b-page-2');
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });
});
