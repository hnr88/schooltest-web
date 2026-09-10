/**
 * OPS-038 / C-OPS-PORTAL-028 — the ops school-detail Classes tab.
 *
 * Real end to end: a genuine ops sign-in through the app's own form, the Next
 * app on :3101, and the running Strapi behind it. Nothing is intercepted — the
 * point of the task is that the tab now reads the real list operation, so an
 * intercepted response would prove nothing.
 *
 * The fixture class is created and deleted through the REAL C-CLS-02/C-CLS-04
 * writes as the school's own admin, so the "an unassigned class is visible"
 * assertion is about a row that genuinely exists and genuinely has no teacher.
 *
 * Copy is asserted only where the catalog already carries the key: the tab's
 * new strings are additions to src/i18n/messages/en.json, which is a
 * merge-only file for this task, so rows/controls are located by test id and
 * by their REAL data values instead of by not-yet-merged labels.
 */
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { roleCredentials } from '../helpers/credentials';
import { loginCached } from '../helpers/http';
import { cat, loadMessages } from '../helpers/i18n';
import { loginAs } from '../helpers/roles';

const en = loadMessages('en');
const SCHOOL_A = 'a19wa9lrmloi95ab9m4gmxqk';

function apiBaseUrl(): string {
  return (
    process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500'
  );
}

async function authHeaders(
  request: APIRequestContext,
  role: 'opsApi' | 'schoolAdmin',
): Promise<Record<string, string>> {
  const jwt = await loginCached(request, apiBaseUrl(), roleCredentials(role));
  return { Authorization: `Bearer ${jwt}` };
}

interface ApiClassRow {
  documentId: string;
  name: string | null;
  student_count: number;
  primary_teacher: { documentId: string } | null;
}

/** The exact rows the operation serves, read directly, as the expected set. */
async function apiClasses(request: APIRequestContext, query = ''): Promise<ApiClassRow[]> {
  const res = await request.get(`${apiBaseUrl()}/api/ops/schools/${SCHOOL_A}/classes${query}`, {
    headers: await authHeaders(request, 'opsApi'),
  });
  expect(res.status(), await res.text()).toBe(200);
  return ((await res.json()) as { data: ApiClassRow[] }).data;
}

async function openClassesTab(page: Page): Promise<void> {
  await loginAs(page, 'ops');
  await page.goto(`/dashboard/ops/schools/${SCHOOL_A}`);
  await page
    .getByRole('tab', { name: cat(en, 'Ops.schoolTables.tab.classes'), exact: true })
    .click({ timeout: 15_000 });
  await expect(page.getByTestId('ops-classes-tab')).toBeVisible({ timeout: 15_000 });
}

test.describe.configure({ mode: 'serial' });

test('the Classes tab renders every class the operation serves, unassigned ones included', async ({
  page,
  request,
}) => {
  const headers = await authHeaders(request, 'schoolAdmin');
  const name = `OPS038 web ${Date.now().toString(36)}`;
  const created = await request.post(`${apiBaseUrl()}/api/schools/me/classes`, {
    headers,
    data: { name },
  });
  expect(created.status(), await created.text()).toBe(201);
  const documentId = ((await created.json()) as { data: { documentId: string } }).data.documentId;

  try {
    const expected = await apiClasses(request, '?pageSize=200');
    expect(expected.map((row) => row.documentId)).toContain(documentId);

    await openClassesTab(page);
    const rows = page.getByTestId('ops-classes-row');
    await expect(rows.first()).toBeVisible({ timeout: 20_000 });

    // The unassigned class — the row the staff-directory derivation could not
    // produce, because it only ever walked teachers.
    const unassigned = rows.filter({ hasText: name });
    await expect(unassigned).toHaveCount(1, { timeout: 15_000 });
    await expect(unassigned.getByTestId('ops-classes-students')).toHaveText('0');

    // Real counts: each visible row's number matches what the API serves.
    const firstPage = await apiClasses(request, '?page=1&pageSize=25');
    for (const row of firstPage) {
      if (row.name === null) continue;
      const rendered = rows.filter({ hasText: row.name }).first();
      await expect(rendered.getByTestId('ops-classes-students')).toHaveText(
        String(row.student_count),
        { timeout: 15_000 },
      );
    }
  } finally {
    await request.delete(`${apiBaseUrl()}/api/schools/me/classes/${documentId}`, { headers });
  }
});

test('the status chips and the pager drive the server, not a client-side slice', async ({
  page,
  request,
}) => {
  await openClassesTab(page);
  await expect(page.getByTestId('ops-classes-row').first()).toBeVisible({ timeout: 20_000 });

  const chips = page.getByRole('group').getByRole('button');
  await expect(chips).toHaveCount(4, { timeout: 15_000 }); // All + the three statuses

  // Chip 4 is `archived`; no class carries an archive timestamp yet, so the
  // empty state must appear rather than an unfiltered list.
  await chips.nth(3).click({ timeout: 10_000 });
  await expect(page.getByTestId('ops-classes-row')).toHaveCount(0, { timeout: 15_000 });
  expect(await apiClasses(request, '?status=archived&pageSize=200')).toEqual([]);

  await chips.nth(0).click({ timeout: 10_000 });
  await expect(page.getByTestId('ops-classes-row').first()).toBeVisible({ timeout: 15_000 });
  // task 17 (kit adoption) — `ops-classes-prev` was the bespoke pager's own
  // testid; the directory kit's pager renders a plain Button with no testid,
  // so the documented replacement is the accessible name from the tab's own
  // translated label, scoped to the tab so it cannot match another pager.
  await expect(
    page.getByTestId('ops-classes-tab').getByRole('button', { name: cat(en, 'Ops.classesTab.previousPage') }),
  ).toBeDisabled();
});

test('visual capture: the Classes tab at the desktop reference and at 375px', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openClassesTab(page);
  await expect(page.getByTestId('ops-classes-tab')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('ops-classes-tab').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('ops-classes-1440x1000.png'), fullPage: false });

  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByTestId('ops-classes-tab')).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: testInfo.outputPath('ops-classes-375.png'), fullPage: false });

  // The tab must not force the page to scroll sideways at 375px.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
