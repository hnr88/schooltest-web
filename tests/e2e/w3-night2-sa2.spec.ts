import {
  expect,
  test,
  type APIRequestContext,
  type APIResponse,
  type Page,
} from '@playwright/test';

import { schoolAdminJwt } from './helpers/class-detail';
import { cat, loadMessages } from './helpers/i18n';
import { ROLE_CREDENTIALS, loginAs } from './helpers/roles';

// NIGHT-2 W3 wave 2 — the school-admin surfaces the first battery does not
// cover: SA-003 (students list search/filters/pagination + row link),
// SA-022 + SA-027 (class detail summary cards, teacher panel, zero-student
// empty state), SA-026 (class student drill-down), SA-045 (multi-school
// switcher re-scopes), SA-046 (breadcrumbs school > students > student).
// ONE real Strapi, no mocks; probes are clearly-named scratch rows retired in
// afterEach. First-render expects carry an explicit 30s budget because the
// shared dev server compiles routes on demand under the fleet's parallel load.
const en = loadMessages('en');
const API = 'http://127.0.0.1:5500';


/** The shared Strapi recompiles whenever any lane edits src — a setup call can
 *  land in an ECONNRESET window. Small bounded retry, same discipline as
 *  helpers/api-named-retry.ts. */
async function apiRetry(fn: () => Promise<APIResponse>, attempts = 4): Promise<APIResponse> {
  let last: APIResponse | undefined;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      last = await fn();
      if (last.status() < 500 || last.status() === 503) return last;
    } catch {
      // connection-level flake — wait out the recompile and go again
    }
    await new Promise((resolve) => setTimeout(resolve, 8_000));
  }
  if (!last) throw new Error('apiRetry: every attempt failed at the connection level');
  return last;
}

async function patientLogin(page: Page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await loginAs(page, 'schoolAdmin');
      return;
    } catch {
      await page.waitForTimeout(31_000);
      await page.goto('/sign-in');
      await page.waitForTimeout(2_000);
    }
  }
  await loginAs(page, 'schoolAdmin');
}

async function opsJwt(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API}/api/auth/local`, {
    data: { identifier: ROLE_CREDENTIALS.ops.email, password: ROLE_CREDENTIALS.ops.password },
  });
  expect(res.ok(), 'ops login').toBeTruthy();
  return ((await res.json()) as { jwt: string }).jwt;
}

async function createClass(request: APIRequestContext, jwt: string, name: string): Promise<string> {
  const res = await apiRetry(() =>
    request.post(`${API}/api/schools/me/classes`, {
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      data: { name },
    }),
  );
  expect(res.status(), await res.text()).toBe(201);
  return ((await res.json()) as { data: { documentId: string } }).data.documentId;
}

async function createChild(
  request: APIRequestContext,
  jwt: string,
  body: Record<string, unknown>,
): Promise<string> {
  const res = await apiRetry(() =>
    request.post(`${API}/api/schools/me/children`, {
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      data: body,
    }),
  );
  expect(res.status(), await res.text()).toBe(201);
  return ((await res.json()) as { data: { documentId: string } }).data.documentId;
}

test.setTimeout(240_000);

const studentsToDelete: string[] = [];
/** Classes to retire, with the school scope they were created under (SA-045's
 *  B-side class only resolves when the delete carries its scope header). */
const classesToDelete: { documentId: string; schoolDocumentId?: string }[] = [];

test.afterEach(async ({ request }) => {
  const ops = await opsJwt(request);
  for (const id of studentsToDelete.splice(0)) {
    await request.delete(`${API}/api/students/${id}`, {
      headers: { Authorization: `Bearer ${ops}` },
    });
  }
  const sa = await schoolAdminJwt(request);
  for (const { documentId, schoolDocumentId } of classesToDelete.splice(0)) {
    await request.delete(`${API}/api/schools/me/classes/${documentId}`, {
      headers: {
        Authorization: `Bearer ${sa}`,
        ...(schoolDocumentId ? { 'X-School-DocumentId': schoolDocumentId } : {}),
      },
    });
  }
});

// ---------------------------------------------------------------------------
test('SA-003: the students list searches, filters by class, pages, and rows link to the detail', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  // Every Playwright context starts UNAUTHENTICATED (the config ships no
  // storageState) — sign in through the real portal form before anything UI.
  await patientLogin(page);
  const stamp = Date.now();
  const jwt = await schoolAdminJwt(page.request);
  const classId = await createClass(page.request, jwt, `W3 ListClass ${stamp}`);
  classesToDelete.push({ documentId: classId });
  const probeA = await createChild(page.request, jwt, {
    given_name: `W3 List ${stamp} A`,
    family_name: 'Probe',
    year_level: 7,
    class_documentId: classId,
  });
  studentsToDelete.push(probeA);
  const probeB = await createChild(page.request, jwt, {
    given_name: `W3 List ${stamp} B`,
    family_name: 'Probe',
    year_level: 7,
    class_documentId: classId,
  });
  studentsToDelete.push(probeB);

  await page.goto('/dashboard/school/students');
  const screen = page.locator('[data-surface="school-admin-students"]');
  await expect(screen).toBeVisible({ timeout: 30_000 });
  const table = screen.locator('[data-slot="school-students-table"]');
  await expect(table).toBeVisible();

  // SEARCH narrows to exactly the two probes.
  const search = screen.getByLabel(cat(en, 'SchoolStudents.filters.searchLabel'), { exact: true });
  await search.fill(`W3 List ${stamp}`);
  const rows = screen.locator('[data-slot="school-students-row"]');
  await expect(rows).toHaveCount(2, { timeout: 20_000 });

  // A ROW LINKS to the student detail — the row's first-cell anchor.
  await rows
    .filter({ hasText: `W3 List ${stamp} A` })
    .getByRole('link')
    .first()
    .click();
  await page.waitForURL(new RegExp(`/dashboard/school/students/${probeA}$`), { timeout: 30_000 });
  await expect(page.locator('[data-surface="school-admin-student-detail"]')).toBeVisible({
    timeout: 30_000,
  });
  await page.goBack();
  await expect(screen).toBeVisible({ timeout: 30_000 });

  // FILTER by the probes' class — search again first (the list re-mounts on
  // back), then the class filter narrows to the same two rows. The directory
  // select is a Radix trigger; its options portal to <body>.
  await search.fill(`W3 List ${stamp}`);
  await expect(rows).toHaveCount(2, { timeout: 20_000 });
  await screen
    .getByLabel(cat(en, 'SchoolStudents.filters.classLabel'), { exact: true })
    .click();
  await page.getByRole('option', { name: `W3 ListClass ${stamp}` }).click();
  await expect(
    screen.locator('[data-slot="school-students-row"]').filter({ hasText: `W3 List ${stamp}` }),
  ).toHaveCount(2, { timeout: 20_000 });

  // PAGINATION: clear filters, then the honest count and a working pager.
  await screen.getByRole('button', { name: cat(en, 'SchoolStudents.list.clearFilters') }).click();
  const pager = screen.getByRole('navigation', {
    name: cat(en, 'SchoolStudents.list.paginationLabel'),
  });
  await expect(pager).toBeVisible({ timeout: 20_000 });
  await expect(screen.getByText(/^Showing \d+ of \d+$/)).toBeVisible();
  const next = pager.getByRole('button', { name: cat(en, 'SchoolStudents.pagination.next') });
  if (await next.isEnabled()) {
    const firstPage = await screen.getByText(/Page \d+ of \d+/).innerText();
    await next.click();
    const nextPage = await screen
      .getByText(/Page \d+ of \d+/)
      .innerText({ timeout: 20_000 })
      .catch(() => '');
    expect(nextPage).not.toBe('');
    expect(nextPage).not.toBe(firstPage);
    await pager
      .getByRole('button', { name: cat(en, 'SchoolStudents.pagination.previous') })
      .click();
  }
});

// ---------------------------------------------------------------------------
test('SA-022 + SA-027: an empty class shows four summary cards, the unassigned teacher panel and the import/add empty state', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  await patientLogin(page);
  const stamp = Date.now();
  const jwt = await schoolAdminJwt(page.request);
  const classId = await createClass(page.request, jwt, `W3 EmptyClass ${stamp}`);
  classesToDelete.push({ documentId: classId });

  await page.goto(`/dashboard/school/classes/${classId}`);
  const detail = page.locator('[data-surface="school-admin-class-detail"]');
  await expect(detail).toBeVisible({ timeout: 30_000 });

  // SA-022: the four summary cards (students, Test A, Test B, avg score).
  await expect(detail.locator('[data-slot="metric-card"]')).toHaveCount(4);

  // SA-027: the zero-student empty state with its two real actions. The class
  // HEADER also carries an "Import students" button, so every assertion here is
  // scoped to the empty-state region (strict-mode safe).
  const emptyState = detail.locator('[data-slot="empty-state"]');
  await expect(emptyState.getByText(cat(en, 'Classes.detail.empty.title'), { exact: true })).toBeVisible();
  await expect(
    emptyState.getByRole('button', { name: cat(en, 'Classes.detail.empty.import') }),
  ).toBeVisible();
  // The add-student action is the kit's D21 Button render={<Link/>} — an <a> in
  // the DOM exposed as role=button (Base UI composition), so assert it as a button.
  await expect(
    emptyState.getByRole('button', { name: cat(en, 'Classes.detail.empty.addStudent') }),
  ).toBeVisible();

  // SA-022: the assigned-teacher panel — unassigned first…
  const panel = detail.getByRole('list', { name: cat(en, 'Classes.detail.teachers.label') });
  await expect(panel).toBeVisible();
  await expect(panel).toContainText(cat(en, 'Classes.detail.teacherUnassigned'));

  // …then a teacher is added through the panel's OWN picker and the chip appears.
  await panel.getByRole('button', { name: cat(en, 'Classes.detail.teachers.add') }).click();
  const picker = page.getByRole('dialog');
  await expect(picker).toBeVisible({ timeout: 20_000 });
  // The picker first renders LOADING SKELETONS while the teachers query runs —
  // deciding the branch off isVisible() at that instant raced the fetch. Wait
  // for the settled state: either a checkboxable list or the honest empty copy.
  const checkbox = picker.getByRole('checkbox').first();
  const emptyMessage = picker.getByText(cat(en, 'Classes.detail.teachers.pickerEmpty'));
  await expect(checkbox.or(emptyMessage)).toBeVisible({ timeout: 20_000 });
  if (await checkbox.isVisible().catch(() => false)) {
    await checkbox.check();
    await picker.getByRole('button', { name: cat(en, 'Classes.detail.teachers.save') }).click();
    await expect(picker).toBeHidden({ timeout: 20_000 });
    await expect(detail.locator('[data-slot="class-teacher-chip"]').first()).toBeVisible({
      timeout: 20_000,
    });
  } else {
    // Every teacher already teaches this class — the panel's honest message.
    await expect(emptyMessage).toBeVisible();
    await picker.getByRole('button', { name: cat(en, 'Classes.detail.teachers.cancel') }).click();
  }
});

// ---------------------------------------------------------------------------
test('SA-026: a roster row drills down to the student detail inside the class context and back', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  await patientLogin(page);
  const stamp = Date.now();
  const jwt = await schoolAdminJwt(page.request);
  const classId = await createClass(page.request, jwt, `W3 DrillClass ${stamp}`);
  classesToDelete.push({ documentId: classId });

  // One roster entry through the REAL school-admin import commit — the same
  // write the import journey uses (the /classes/:id/roster/* family is the
  // TEACHER surface; the school-admin write path is import-students/commit).
  const commit = await page.request.post(`${API}/api/schools/me/import-students/commit`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `w3-drill-${stamp}-aaaaaa`,
    },
    data: {
      csv: `given name,family name,date of birth,year level,home language\nW3 Drill ${stamp},Probe,2012-06-06,7,english`,
      class_documentId: classId,
    },
  });
  expect(commit.status(), await commit.text()).toBe(200);

  const detailRes = await page.request.get(`${API}/api/schools/me/classes/${classId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const roster = ((await detailRes.json()) as {
    data: { students: { documentId: string; given_name: string }[] };
  }).data.students;
  const student = roster.find((s) => s.given_name === `W3 Drill ${stamp}`);
  expect(student, 'import commit created the drill-down probe').toBeTruthy();
  studentsToDelete.push(student!.documentId);

  await page.goto(`/dashboard/school/classes/${classId}`);
  const detail = page.locator('[data-surface="school-admin-class-detail"]');
  await expect(detail).toBeVisible({ timeout: 30_000 });

  // The roster row's first-cell anchor is the drill-down link.
  const row = detail.locator('[data-directory-row]').filter({ hasText: `W3 Drill ${stamp}` });
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.getByRole('link').first().click();

  await page.waitForURL(
    new RegExp(`/dashboard/school/classes/${classId}/students/${student!.documentId}$`),
    { timeout: 30_000 },
  );
  const drill = page.locator('[data-surface="school-admin-class-student-detail"]');
  await expect(drill).toBeVisible({ timeout: 30_000 });
  await expect(drill).toContainText(`W3 Drill ${stamp}`);

  // The back link names the class and returns to the class detail.
  const back = drill.getByRole('link', { name: new RegExp(`W3 DrillClass ${stamp}`) });
  await expect(back).toBeVisible();
  await back.click();
  await expect(page.locator('[data-surface="school-admin-class-detail"]')).toBeVisible({
    timeout: 30_000,
  });
});

// ---------------------------------------------------------------------------
test('SA-045: the school switcher changes context and school-scoped data re-scopes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  await patientLogin(page);
  const stamp = Date.now();
  const jwt = await schoolAdminJwt(page.request);

  // The admin's memberships drive the switcher menu.
  const mem = await page.request.get(`${API}/api/schools/me/memberships`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const memberships = ((await mem.json()) as {
    data: { documentId: string; name: string; is_primary: boolean }[];
  }).data;
  expect(memberships.length, 'the admin holds multiple school memberships').toBeGreaterThan(1);
  const primary = memberships.find((s) => s.is_primary) ?? memberships[0]!;
  const other = memberships.find((s) => s.documentId !== primary.documentId)!;

  // A scratch class visible ONLY in the other school's scope.
  const classId = await createClassWithScope(page.request, jwt, other.documentId, `W3 BSide ${stamp}`);
  classesToDelete.push({ documentId: classId, schoolDocumentId: other.documentId });

  await page.goto('/dashboard/school');
  const switcher = page.getByTestId('school-switcher');
  await expect(switcher).toBeVisible({ timeout: 30_000 });
  await expect(switcher).toContainText(primary.name ?? '');

  // Pick the other school; the portal resets to the school home.
  await switcher.click();
  const option = page.getByRole('menuitem').filter({ hasText: other.name ?? '' });
  await expect(option).toBeVisible({ timeout: 20_000 });
  await option.click();
  await page.waitForURL(/\/dashboard\/school$/, { timeout: 30_000 });
  await expect(switcher).toContainText(other.name ?? '', { timeout: 20_000 });

  // The other school's scoped data is now visible…
  await page.goto('/dashboard/school/classes');
  const classes = page.locator('[data-surface="school-admin-classes"]');
  await expect(classes).toBeVisible({ timeout: 30_000 });
  await classes.getByLabel(cat(en, 'Classes.list.searchLabel'), { exact: true }).fill(`W3 BSide ${stamp}`);
  await expect(
    page.getByRole('row', { name: new RegExp(`W3 BSide ${stamp}`) }).first(),
  ).toBeVisible({ timeout: 20_000 });

  // …and switching back re-scopes away from it.
  await page.getByTestId('school-switcher').click();
  await page
    .getByRole('menuitem')
    .filter({ hasText: primary.name ?? '' })
    .click();
  await page.waitForURL(/\/dashboard\/school$/, { timeout: 30_000 });
  await page.goto('/dashboard/school/classes');
  const classesA = page.locator('[data-surface="school-admin-classes"]');
  await expect(classesA).toBeVisible({ timeout: 30_000 });
  await classesA
    .getByLabel(cat(en, 'Classes.list.searchLabel'), { exact: true })
    .fill(`W3 BSide ${stamp}`);
  await expect(
    classesA
      .getByText(cat(en, 'Classes.list.filteredEmptyTitle'), { exact: true })
      .first(),
  ).toBeVisible({ timeout: 20_000 });
});

async function createClassWithScope(
  request: APIRequestContext,
  jwt: string,
  schoolDocumentId: string,
  name: string,
): Promise<string> {
  const res = await request.post(`${API}/api/schools/me/classes`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
      'X-School-DocumentId': schoolDocumentId,
    },
    data: { name },
  });
  expect(res.status(), await res.text()).toBe(201);
  return ((await res.json()) as { data: { documentId: string } }).data.documentId;
}

// ---------------------------------------------------------------------------
test('SA-046: breadcrumbs walk School > Students > student and back without losing state', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  await patientLogin(page);
  const stamp = Date.now();
  const jwt = await schoolAdminJwt(page.request);
  const kidId = await createChild(page.request, jwt, {
    given_name: `W3 Crumb ${stamp}`,
    family_name: 'Probe',
    year_level: 7,
  });
  studentsToDelete.push(kidId);

  await page.goto(`/dashboard/school/students/${kidId}`);
  await expect(page.locator('[data-surface="school-admin-student-detail"]')).toBeVisible({
    timeout: 30_000,
  });

  const crumbs = page.getByRole('navigation', {
    name: cat(en, 'Shell.topbar.breadcrumbLabel'),
  });
  await expect(crumbs).toBeVisible({ timeout: 20_000 });
  // School and Students are links; the current crumb is the student's name.
  await expect(crumbs.getByRole('link', { name: cat(en, 'Shell.nav.school'), exact: true })).toBeVisible();
  await expect(
    crumbs.getByRole('link', { name: cat(en, 'Shell.nav.students'), exact: true }),
  ).toBeVisible();
  await expect(crumbs.locator('[data-slot="topbar-page-title"]')).toContainText(`W3 Crumb ${stamp}`);

  // Students crumb navigates to the list, still signed in and rendered.
  await crumbs.getByRole('link', { name: cat(en, 'Shell.nav.students'), exact: true }).click();
  await page.waitForURL(/\/dashboard\/school\/students$/, { timeout: 30_000 });
  await expect(page.locator('[data-surface="school-admin-students"]')).toBeVisible({
    timeout: 30_000,
  });

  // Back to the record, then the School crumb lands on the school home.
  await page.goto(`/dashboard/school/students/${kidId}`);
  await expect(page.locator('[data-surface="school-admin-student-detail"]')).toBeVisible({
    timeout: 30_000,
  });
  await page
    .getByRole('navigation', { name: cat(en, 'Shell.topbar.breadcrumbLabel') })
    .getByRole('link', { name: cat(en, 'Shell.nav.school'), exact: true })
    .click();
  await page.waitForURL(/\/dashboard\/school$/, { timeout: 30_000 });
  await expect(page.locator('[data-surface="school-admin-home"]')).toBeVisible({
    timeout: 30_000,
  });
});
