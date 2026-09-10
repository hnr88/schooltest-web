import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { roleCredentials } from './helpers/credentials';

// Task 30 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Drives the C-CHD-02 v2 add form (email, first-language picklist, optional
// ACARA phase), the edit dialog and the archive confirm through the real UI
// as the seeded school_admin, and cross-checks the roster (C-CHD-01) plus the
// seat counter (C-ENT-01) against the live API at every step.
//
// Task 31 extends this spec: the roster now renders through the shared
// directory kit in SERVER mode, so the second test pins the wire contract
// (status/class/level/q reach the endpoint unchanged, 'all' omitted), the
// old-URL round-trip, the server pagination boundary, and the two 1440x900
// proof captures at mvp/ops/proof/shots/.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const SCHOOL_ADMIN = roleCredentials('schoolAdmin');

// THREE levels up: __dirname is tests/e2e, so ../../.. is the repo root.
const SHOTS_31 = path.resolve(__dirname, '../../../mvp/ops/proof/shots');

const CLASS_ALL_LABEL = cat(en, 'SchoolStudents.filters.classAll');
const CLASS_LABEL = cat(en, 'SchoolStudents.filters.classLabel');
const LEVEL_LABEL = cat(en, 'SchoolStudents.filters.levelLabel');
const LEVEL_BEGINNING_LABEL = cat(en, 'SchoolStudents.form.acaraPhaseOption.beginning');

interface ChildRow {
  documentId: string;
  given_name: string;
  family_name: string;
  status: string;
}

async function login(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API}/api/auth/local`, {
    data: { identifier: SCHOOL_ADMIN.email, password: SCHOOL_ADMIN.password },
  });
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { jwt: string }).jwt;
}

async function apiChildren(
  request: APIRequestContext,
  jwt: string,
  params: string,
): Promise<ChildRow[]> {
  const res = await request.get(`${API}/api/schools/me/children?${params}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { data: ChildRow[] }).data;
}

async function apiSeatsUsed(request: APIRequestContext, jwt: string): Promise<number> {
  const res = await request.get(`${API}/api/schools/me/entitlement`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { data: { seats_used: number } }).data.seats_used;
}

interface ChildRowMeta extends ChildRow {
  acara_phase: string | null;
}

async function apiChildrenMeta(
  request: APIRequestContext,
  jwt: string,
  params: string,
): Promise<{ rows: ChildRowMeta[]; total: number }> {
  const res = await request.get(`${API}/api/schools/me/children?${params}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as {
    data: ChildRowMeta[];
    meta: { pagination: { total: number } };
  };
  return { rows: body.data, total: body.meta.pagination.total };
}

/** The roster's own read, distinguishable from the subtitle-count read (pageSize 1). */
function rosterRequests(urls: readonly URL[]): URL[] {
  return urls.filter((url) => url.searchParams.get('pageSize') === '25');
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(SCHOOL_ADMIN.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(SCHOOL_ADMIN.password);
  await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
  await page.waitForURL('**/dashboard/school', { timeout: 30_000 });
}

test.describe('task 30: children v2 round-trip vs live C-CHD-01..04', () => {
  test('add with email/L1/ACARA -> roster -> edit -> archive frees the seat', async ({
    page,
    request,
  }) => {
    const jwt = await login(request);
    const seatsBefore = await apiSeatsUsed(request, jwt);
    const givenName = 'PW30';
    const familyName = `Probe${Date.now()}`;
    const fullName = `${givenName} ${familyName}`;
    const email = `pw30.${Date.now()}@example.com`;

    await signIn(page);
    await page.goto('/en/dashboard/school/children');
    const screen = page.locator('[data-slot="school-students"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });

    // ADD (C-CHD-02 v2): name, email, year level, Korean, emerging ACARA phase.
    await screen.getByRole('button', { name: cat(en, 'SchoolStudents.addButton'), exact: true }).click();
    await page.waitForURL('**/dashboard/school/students/new');
    const form = page.locator('[data-slot="school-student-new"]');
    await form.getByLabel(/Given name/).fill(givenName);
    await form.getByLabel(cat(en, 'SchoolStudents.form.familyName'), { exact: true }).fill(familyName);
    await form.getByLabel(cat(en, 'SchoolStudents.form.email'), { exact: true }).fill(email);
    await form.getByLabel(cat(en, 'SchoolStudents.form.yearLevel'), { exact: true }).selectOption('8');
    await form.getByLabel(cat(en, 'SchoolStudents.form.firstLanguage'), { exact: true }).selectOption('korean');
    // The ACARA control renders for the school_admin role only.
    const acaraSelect = form.getByLabel(cat(en, 'SchoolStudents.form.acaraPhase'), { exact: true });
    await expect(acaraSelect).toBeVisible();
    await acaraSelect.selectOption('emerging');
    await form
      .getByRole('button', { name: cat(en, 'SchoolStudents.form.submitCreate'), exact: true })
      .click();
    await page.waitForURL('**/dashboard/school/students', { timeout: 20_000 });

    // ROSTER (C-CHD-01): the name search surfaces the new child. Search by the
    // unique family name — the server matches q against each name field, not
    // the combined "given family" string.
    await screen.getByLabel(cat(en, 'SchoolStudents.filters.searchLabel')).fill(familyName);
    const row = screen.getByRole('row', { name: new RegExp(familyName) });
    await expect(row).toBeVisible({ timeout: 10_000 });
    // Redesign spec section 4 replaced the Status column with Level and
    // Diagnostic, so active/archived state is asserted through the API below
    // and through the row disappearing from the default roster once archived.

    // API cross-check: listed, seat consumed.
    let matches = await apiChildren(request, jwt, `q=${familyName}`);
    expect(matches.some((entry) => entry.given_name === givenName)).toBeTruthy();
    expect(await apiSeatsUsed(request, jwt)).toBe(seatsBefore + 1);

    // EDIT (C-CHD-03): first language Korean -> Vietnamese, phase -> developing.
    // Task 31: the row menu is the directory kit's now — ONE shared accessible
    // name ("Actions"), so the menu is selected inside the (single) row.
    await row
      .getByRole('button', { name: cat(en, 'SchoolStudents.list.rowMenuLabel'), exact: true })
      .click();
    const editItem = page.getByRole('menuitem', {
      name: cat(en, 'SchoolStudents.actions.edit'),
      exact: true,
    });
    await expect(editItem).toBeVisible();
    await editItem.click();
    const editDialog = page.getByRole('dialog');
    await expect(editDialog).toBeVisible();
    await editDialog
      .getByLabel(cat(en, 'SchoolStudents.form.firstLanguage'), { exact: true })
      .selectOption('vietnamese');
    await editDialog
      .getByLabel(cat(en, 'SchoolStudents.form.acaraPhase'), { exact: true })
      .selectOption('developing');
    await editDialog
      .getByRole('button', { name: cat(en, 'SchoolStudents.form.submitEdit'), exact: true })
      .click();
    await expect(editDialog).toBeHidden();
    // The success toast fires only when a PATCH actually left the building -
    // it is the UI proof the edit round-tripped (psql cross-check is manual).
    await expect(
      page.getByText(cat(en, 'SchoolStudents.form.updatedToast').replace('{name}', fullName), {
        exact: true,
      }),
    ).toBeVisible();

    // ARCHIVE (C-CHD-04): confirm copy promises the seat is freed.
    await row
      .getByRole('button', { name: cat(en, 'SchoolStudents.list.rowMenuLabel'), exact: true })
      .click();
    const archiveItem = page.getByRole('menuitem', {
      name: cat(en, 'SchoolStudents.actions.archive'),
      exact: true,
    });
    await expect(archiveItem).toBeVisible();
    await archiveItem.click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toBeVisible();
    await confirm
      .getByRole('button', { name: cat(en, 'SchoolStudents.archiveDialog.confirm'), exact: true })
      .click();
    await expect(confirm).toBeHidden();

    // API cross-check: archived, seat released immediately (C-ENT-01).
    matches = await apiChildren(request, jwt, `q=${familyName}&status=archived`);
    expect(matches.some((entry) => entry.given_name === givenName)).toBeTruthy();
    expect(await apiSeatsUsed(request, jwt)).toBe(seatsBefore);
  });

  // Task 31 — the roster is ON the shared directory kit in SERVER mode. The
  // wire contract is the point: status/class/level/q reach the endpoint
  // unchanged, 'all' is OMITTED rather than sent as a literal, the URL params
  // keep the endpoint's names so old links survive, and the proof captures
  // land at exactly 1440x900.
  test('task 31: server-mode kit — the three params reach the endpoint with "all" omitted, and old URLs still resolve', async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    const jwt = await login(request);
    const classesRes = await request.get(`${API}/api/schools/me/classes`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(classesRes.ok()).toBeTruthy();
    const classes = ((await classesRes.json()) as {
      data: { documentId: string; name: string }[];
    }).data;
    expect(classes.length).toBeGreaterThan(0);
    const targetClass = classes[0];

    const childrenRequests: URL[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/schools/me/children')) {
        childrenRequests.push(new URL(req.url()));
      }
    });

    await signIn(page);
    // The OLD URL form. The pre-kit screen read no params, so the bare path is
    // the URL every existing bookmark carries — it must resolve to the SAME
    // default view: kit toolbar, sentinel filters, nothing extra on the wire.
    await page.goto('/en/dashboard/school/students');
    const screen = page.locator('[data-slot="school-students"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });
    const table = screen.locator('[data-slot="school-students-table"]');
    // Server-mode lesson (teacher/30): VISIBLE IS NOT LOADED — a retrying row
    // expectation precedes every count.
    await expect(table.getByRole('row').first()).toBeVisible({ timeout: 20_000 });

    const defaults = rosterRequests(childrenRequests);
    expect(defaults.length).toBeGreaterThan(0);
    for (const url of defaults) {
      // 'all' omits the param — the sentinels never reach the wire literally.
      expect(url.searchParams.get('status')).toBeNull();
      expect(url.searchParams.get('class')).toBeNull();
      expect(url.searchParams.get('level')).toBeNull();
      expect(url.searchParams.get('q')).toBeNull();
      expect(url.searchParams.get('page')).toBe('1');
    }

    // PROOF SHOT 1 — the default kit roster, 1440x900, bytes read back.
    const defaultShot = path.join(SHOTS_31, '31-sa-students.png');
    await page.screenshot({ path: defaultShot, fullPage: false });
    const savedDefault = readFileSync(defaultShot);
    expect(savedDefault.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    expect({
      width: savedDefault.readUInt32BE(16),
      height: savedDefault.readUInt32BE(20),
    }).toEqual({ width: 1440, height: 900 });

    // Class filter narrows SERVER-side: `class=<documentId>` on the wire, and
    // STILL no status param anywhere.
    await screen.getByLabel(CLASS_LABEL, { exact: true }).click();
    await page.getByRole('option', { name: targetClass.name, exact: true }).click();
    await expect(table.getByRole('row').first()).toBeVisible({ timeout: 20_000 });
    await expect
      .poll(
        () =>
          rosterRequests(childrenRequests).filter(
            (url) => url.searchParams.get('class') === targetClass.documentId,
          ).length,
        { timeout: 15_000 },
      )
      .toBeGreaterThan(0);
    for (const url of rosterRequests(childrenRequests)) {
      expect(url.searchParams.get('status')).toBeNull();
    }
    const pageUrl = new URL(page.url());
    expect(pageUrl.searchParams.get('class')).toBe(targetClass.documentId);
    expect(pageUrl.searchParams.get('status')).toBeNull();
    expect(pageUrl.searchParams.get('level')).toBeNull();

    // Level composes additively: the raw phase value reaches the endpoint
    // alongside the class param.
    await screen.getByLabel(LEVEL_LABEL, { exact: true }).click();
    await page.getByRole('option', { name: LEVEL_BEGINNING_LABEL, exact: true }).click();
    await expect
      .poll(
        () =>
          rosterRequests(childrenRequests).filter(
            (url) =>
              url.searchParams.get('level') === 'beginning' &&
              url.searchParams.get('class') === targetClass.documentId,
          ).length,
        { timeout: 15_000 },
      )
      .toBeGreaterThan(0);

    // PROOF SHOT 2 — the filtered roster, 1440x900, bytes read back.
    const filteredShot = path.join(SHOTS_31, '31-sa-students-filtered.png');
    await page.screenshot({ path: filteredShot, fullPage: false });
    const savedFiltered = readFileSync(filteredShot);
    expect(savedFiltered.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    expect({
      width: savedFiltered.readUInt32BE(16),
      height: savedFiltered.readUInt32BE(20),
    }).toEqual({ width: 1440, height: 900 });

    // OLD-URL ROUND-TRIP: the filtered deep link SURVIVES a reload (the URL is
    // the contract now; the class select re-applies from it)...
    await page.reload();
    await expect(
      page.locator('[data-slot="school-students-table"]').getByRole('row').first(),
    ).toBeVisible({ timeout: 20_000 });
    expect(new URL(page.url()).searchParams.get('class')).toBe(targetClass.documentId);
    // ...and the bare path still resolves to the same unfiltered default view.
    await page.goto('/en/dashboard/school/students');
    await expect(
      page.locator('[data-slot="school-students-table"]').getByRole('row').first(),
    ).toBeVisible({ timeout: 20_000 });
    expect(new URL(page.url()).searchParams.get('class')).toBeNull();
  });

  // The paired pagination assertion (teacher/30's shape): a lone "page 1
  // renders" would pass identically under the regression this exists to catch
  // — a client-mode whole-read silently losing the server pages.
  test('task 31: the pager stays server-bound — page 2 serves rows absent from page 1', async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    const jwt = await login(request);
    const page1 = await apiChildrenMeta(request, jwt, 'page=1&pageSize=25');
    test.skip(
      page1.total <= 25,
      `the seeded roster is a single server page (total=${page1.total}) — an absent second page is not evidence either way`,
    );

    await signIn(page);
    await page.goto('/en/dashboard/school/students');
    const screen = page.locator('[data-slot="school-students"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });
    const table = screen.locator('[data-slot="school-students-table"]');
    await expect(table.getByRole('row').first()).toBeVisible({ timeout: 20_000 });

    // The kit's pager is offered — counted, not merely present.
    const pager = screen.locator('[data-slot="directory-pagination"]');
    await expect(pager).toHaveCount(1);

    const page2Meta = await apiChildrenMeta(request, jwt, 'page=2&pageSize=25');
    expect(page2Meta.rows.length).toBeGreaterThan(0);
    const firstOnPage2 = page2Meta.rows[0];
    const page1Ids = new Set(page1.rows.map((row) => row.documentId));
    expect(page1Ids.has(firstOnPage2.documentId)).toBe(false);

    await pager
      .getByRole('button', { name: cat(en, 'SchoolStudents.pagination.next'), exact: true })
      .click();
    await expect(page).toHaveURL(/[?&]page=2/);
    await expect(table.getByRole('row').first()).toBeVisible({ timeout: 20_000 });
    await expect(table.getByRole('row').first()).toContainText(
      firstOnPage2.family_name ?? firstOnPage2.given_name ?? '',
    );
  });
});
