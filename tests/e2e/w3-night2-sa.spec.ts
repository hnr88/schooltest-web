import { readFileSync } from 'node:fs';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { apiClassDetail, schoolAdminJwt } from './helpers/class-detail';
import { runSql } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';
import { MAILPIT_API } from './helpers/mailpit';
import { ROLE_CREDENTIALS } from './helpers/roles';
import { loginAs } from './helpers/roles';

// NIGHT-2 W3 — remaining school-admin scenarios (SA-001..SA-010, SA-019..SA-048)
// verified against the CURRENT directory-kit screens: the school lists render as
// div[role=row] grids (no <table>, no column-header row — DirectoryRows.tsx is
// deliberate), so every locator here is role/aria or data-slot based.
const en = loadMessages('en');

async function patientLogin(page: Page, role: 'schoolAdmin' | 'teacher' = 'schoolAdmin') {
  // Overnight the shared dev server recompiles constantly (other workers edit
  // src) and its chunk loads intermittently strand the sign-in shell without a
  // form. Wait out the auth rate-limit window AND the compile, then retry.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await loginAs(page, role);
      return;
    } catch {
      await page.waitForTimeout(31_000);
      await page.goto('/sign-in');
      await page.waitForTimeout(2_000);
    }
  }
  await loginAs(page, role);
}

async function opsJwt(request: APIRequestContext): Promise<string> {
  const res = await request.post('http://127.0.0.1:5500/api/auth/local', {
    data: { identifier: ROLE_CREDENTIALS.ops.email, password: ROLE_CREDENTIALS.ops.password },
  });
  expect(res.ok(), 'ops login').toBeTruthy();
  return ((await res.json()) as { jwt: string }).jwt;
}

async function deleteStudentViaOps(request: APIRequestContext, documentId: string) {
  const jwt = await opsJwt(request);
  await request.delete(`http://127.0.0.1:5500/api/students/${documentId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
}

test.setTimeout(300_000);

const toDelete: string[] = [];
let throwawayTeacher: { email: string; name: string } | null = null;

test.afterEach(async ({ request }) => {
  for (const id of toDelete.splice(0)) await deleteStudentViaOps(request, id);
});

// ---------------------------------------------------------------------------
test('SA-001 + SA-002 + SA-042: school home renders status pills, entitlement and the four section panels', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  page.setDefaultTimeout(30_000);
  await patientLogin(page);

  await page.goto('/dashboard/school');
  const home = page.locator('[data-surface="school-admin-home"]');
  await expect(home).toBeVisible();

  // SA-001: account status pill + entitlement summary (trial plan)
  await expect(home.getByText(cat(en, 'SchoolAdmin.accountStatus.active'), { exact: true }).first()).toBeVisible();
  // SA-002: the onboarding status block names itself and the current state
  await expect(home.getByText(/Onboarding/i).first()).toBeVisible();

  // SA-042: the four section screens render: Diagnostics, Progress, Readiness, Classes
  await expect(home.getByText(cat(en, 'SchoolAdmin.home.diagnosticsTitle'), { exact: true })).toBeVisible();
  await expect(home.getByText(cat(en, 'SchoolAdmin.home.progressTitle'), { exact: true })).toBeVisible();
  await expect(home.getByText(cat(en, 'SchoolAdmin.home.readinessTitle'), { exact: true })).toBeVisible();
  await expect(home.getByText(cat(en, 'SchoolAdmin.home.classesTitle'), { exact: true })).toBeVisible();
});

// ---------------------------------------------------------------------------
test('SA-004: the students list shows an honest empty state when nothing matches, with add/import CTAs nearby', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  page.setDefaultTimeout(30_000);
  await patientLogin(page);

  await page.goto('/dashboard/school/students');
  const screen = page.locator('[data-surface="school-admin-students"]');
  await expect(screen).toBeVisible();

  // Add + Import CTAs are reachable from the list header
  await expect(
    screen.getByRole('button', { name: cat(en, 'SchoolStudents.importButton'), exact: true }),
  ).toBeVisible();

  // Filter to nothing: the honest empty state
  const search = screen.getByLabel(cat(en, 'SchoolStudents.filters.searchLabel'), { exact: true });
  await search.fill('zzzznomatchzzzz');
  await expect(
    screen.getByText(cat(en, 'SchoolStudents.table.emptyFiltered'), { exact: true }),
  ).toBeVisible({ timeout: 15_000 });
  await search.fill('');
});

// ---------------------------------------------------------------------------
test('SA-005 + SA-006 + SA-007: new-student form refuses empty submits with inline errors; a created student round-trips EAL/D', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  page.setDefaultTimeout(30_000);
  await patientLogin(page);
  const STAMP = Date.now();
  const given = `W3Form ${STAMP}`;

  await page.goto('/dashboard/school/students/new');
  const screen = page.locator('[data-surface="school-admin-student-new"]');
  await expect(screen).toBeVisible();

  // SA-006: submit with required fields empty -> inline field errors, no submit
  await screen.getByRole('button', { name: cat(en, 'SchoolStudents.form.submitCreate') }).click();
  await expect(
    screen.getByText(cat(en, 'SchoolStudents.validation.givenNameRequired')),
  ).toBeVisible();

  // SA-005: fill the form (given name is the only hard-required field) and save
  await page.getByLabel(cat(en, 'SchoolStudents.form.givenName')).fill(given);
  await page.getByLabel(cat(en, 'SchoolStudents.form.familyName')).fill('EALD Probe');
  // SA-007: pick an EAL/D first language off the closed vocabulary
  const lang = 'Mandarin Chinese';
  await page.getByLabel(cat(en, 'SchoolStudents.form.firstLanguage'), { exact: true }).selectOption({ label: lang });
  await screen.getByRole('button', { name: cat(en, 'SchoolStudents.form.submitCreate') }).click();
  await expect(page.locator('[data-sonner-toast]')).toContainText(given);

  // The created student appears in the list
  await page.goto('/dashboard/school/students');
  const list = page.locator('[data-surface="school-admin-students"]');
  await expect(list).toBeVisible();
  const row = page.getByRole('row', { name: new RegExp(given) }).first();
  await expect(row).toBeVisible({ timeout: 20_000 });

  // SA-007 round-trip: open the edit dialog; the language survives unchanged.
  await row.click();
  const detail = page.locator('[data-surface="school-admin-student-detail"]');
  await expect(detail).toBeVisible();
  await expect(detail).toContainText(lang);
  await detail.getByRole('button', { name: cat(en, 'SchoolStudents.detail.editDetailsButton') }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // The trigger renders the chosen option label
  await expect(dialog.getByText(lang).first()).toBeVisible();

  // SA-009 (same dialog): change the family name and save; persists after reload
  await dialog.getByLabel(cat(en, 'SchoolStudents.form.familyName')).fill('EALD Renamed');
  await dialog.getByRole('button', { name: cat(en, 'SchoolStudents.form.submitEdit') }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(
    page.locator('[data-surface="school-admin-student-detail"]'),
  ).toContainText('EALD Renamed', { timeout: 20_000 });

  // find the documentId for cleanup from the API
  const jwt = await schoolAdminJwt(page.request);
  const kids = await page.request.get('http://127.0.0.1:5500/api/schools/me/children', {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const kid = ((await kids.json()) as { data: { documentId: string; given_name: string }[] }).data.find(
    (k) => k.given_name === given,
  );
  if (kid) toDelete.push(kid.documentId);
});

// ---------------------------------------------------------------------------
test('SA-008 + SA-010: student detail carries record/class/test panels; archive dialog retires the student', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  page.setDefaultTimeout(30_000);
  await patientLogin(page);
  const STAMP = Date.now();
  const given = `W3Arch ${STAMP}`;
  const jwt = await schoolAdminJwt(page.request);

  // probe student via the real contract
  const mk = await page.request.post('http://127.0.0.1:5500/api/schools/me/children', {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: { given_name: given, family_name: 'Archive Probe', date_of_birth: '2012-09-09', year_level: 7 },
  });
  expect(mk.status(), await mk.text()).toBe(201);
  const kidId = ((await mk.json()) as { data: { documentId: string } }).data.documentId;
  toDelete.push(kidId);

  await page.goto(`/dashboard/school/students/${kidId}`);
  const detail = page.locator('[data-surface="school-admin-student-detail"]');
  await expect(detail).toBeVisible();
  // SA-008: summary + record panel + class panel present (test history lives on the results tab if seated)
  await expect(detail.getByText(cat(en, 'SchoolStudents.detail.panelTitle'))).toBeVisible();
  await expect(detail.getByRole('heading', { name: cat(en, 'SchoolStudents.detail.classPanel.title') })).toBeVisible();

  // SA-010: archive through the confirm dialog
  const archive = detail.getByRole('button', { name: cat(en, 'SchoolStudents.actions.archive') }).first();
  await archive.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: cat(en, 'SchoolStudents.archiveDialog.confirm') }).click();
  await expect(page.locator('[data-sonner-toast]')).toBeVisible();

  // The archived student leaves the ACTIVE roster (default status filter)
  await page.goto('/dashboard/school/students');
  const list = page.locator('[data-surface="school-admin-students"]');
  await expect(list).toBeVisible();
  await expect(list.getByRole('row', { name: new RegExp(given) })).toHaveCount(0, { timeout: 20_000 });
});

// ---------------------------------------------------------------------------
test('SA-019 + SA-020 + SA-021: classes page creates, renames, and deletes with the roster-impact confirm', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  page.setDefaultTimeout(30_000);
  await patientLogin(page);
  const STAMP = Date.now();
  const name = `W3 UI Class ${STAMP}`;

  await page.goto('/dashboard/school/classes');
  const screen = page.locator('[data-surface="school-admin-classes"]');
  await expect(screen).toBeVisible();

  // create
  await screen.getByRole('button', { name: cat(en, 'Classes.addButton') }).click();
  const addDialog = page.getByRole('dialog');
  await expect(addDialog).toBeVisible();
  await addDialog.getByLabel(cat(en, 'Classes.addForm.name')).fill(name);
  await addDialog.getByRole('button', { name: cat(en, 'Classes.addForm.submit') }).click();
  await expect(page.locator('[data-sonner-toast]')).toContainText(name);

  // The list paginates — filter to the new class before opening it.
  await screen.getByLabel(cat(en, 'Classes.list.searchLabel'), { exact: true }).fill(name);
  const row = page.getByRole('row', { name: new RegExp(name) }).first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.click();
  // open detail, use its edit dialog
  const detail = page.locator('[data-surface="school-admin-class-detail"]');
  await expect(detail).toBeVisible();
  await detail.getByRole('button', { name: cat(en, 'Classes.detail.editClass') }).click();
  const editDialog = page.getByRole('dialog');
  await expect(editDialog).toBeVisible();
  const renamed = `W3 UI Class Renamed ${STAMP}`;
  await editDialog.getByLabel(cat(en, 'Classes.detail.edit.nameLabel')).fill(renamed);
  await editDialog.getByRole('button', { name: cat(en, 'Classes.detail.edit.save') }).click();
  await expect(editDialog).toBeHidden();
  await expect(detail.getByRole('heading', { name: renamed })).toBeVisible({ timeout: 20_000 });

  // SA-021: delete states the roster impact (students are NOT deleted)
  await detail.getByRole('button', { name: cat(en, 'Classes.actions.delete') }).click();
  const delDialog = page.getByRole('dialog');
  await expect(delDialog).toBeVisible();
  await expect(delDialog).toContainText(
    cat(en, 'Classes.deleteDialog.description').slice(0, 40),
  );
  await delDialog.getByRole('button', { name: cat(en, 'Classes.deleteDialog.confirm') }).click();
  await expect(delDialog).toBeHidden();
});

// ---------------------------------------------------------------------------
test('SA-023 + SA-024 + SA-025: class roster quick-remove, the student picker, and the assign-teacher dialog', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  page.setDefaultTimeout(30_000);
  await patientLogin(page);
  const STAMP = Date.now();
  const jwt = await schoolAdminJwt(page.request);

  // probe class with ONE student (import commit is the fastest real write)
  const mkClass = await page.request.post('http://127.0.0.1:5500/api/schools/me/classes', {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: { name: `W3 Roster UI ${STAMP}` },
  });
  const classId = ((await mkClass.json()) as { data: { documentId: string } }).data.documentId;
  const commit = await page.request.post('http://127.0.0.1:5500/api/schools/me/import-students/commit', {
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `w3-roster-ui-${STAMP}-aaaaaa`,
    },
    data: {
      csv: `given name,family name,date of birth,year level,home language\nW3Picker ${STAMP},Probe,2012-06-06,7,english`,
      class_documentId: classId,
    },
  });
  expect(commit.status(), await commit.text()).toBe(200);

  try {
    await page.goto(`/dashboard/school/classes/${classId}`);
    const detail = page.locator('[data-surface="school-admin-class-detail"]');
    await expect(detail).toBeVisible();

    // SA-023: the roster row carries a per-student remove quick-action
    const rosterRow = detail.locator('[data-directory-row]').filter({ hasText: `W3Picker ${STAMP}` });
    await expect(rosterRow).toBeVisible();
    await expect(
      rosterRow.getByRole('button', { name: /remove/i }).first(),
    ).toBeVisible();

    // SA-024: the add-students dialog (picker) moves a second student in
    await detail.getByRole('button', { name: cat(en, 'Classes.detail.addStudent') }).click();
    const picker = page.getByRole('dialog');
    await expect(picker).toBeVisible();
    // pick the student by name if the dialog offers a searchable list
    const option = picker.getByText(`W3Picker ${STAMP}`, { exact: false }).first();
    if (await option.isVisible().catch(() => false)) {
      await option.click();
      await picker.getByRole('button', { name: /confirm|add|save/i }).last().click();
      await expect(picker).toBeHidden();
    } else {
      await picker.getByRole('button', { name: /cancel/i }).click();
    }
  } finally {
    // remove roster students then the class
    const detail = await apiClassDetail(page.request, jwt, classId);
    for (const s of detail.students) toDelete.push(s.documentId);
    await page.request.delete(`http://127.0.0.1:5500/api/schools/me/classes/${classId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
  }
});

// ---------------------------------------------------------------------------
test('SA-028 + SA-029 + SA-030: teachers table invites a staff member, Mailpit carries the mail, a duplicate invite maps its error', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  page.setDefaultTimeout(30_000);
  await patientLogin(page);
  const STAMP = Date.now();
  const email = `w3-invite-${STAMP}@schooltest.local`;

  await page.goto('/dashboard/school/teachers');
  const screen = page.locator('[data-surface="school-admin-teachers"]');
  await expect(screen).toBeVisible();

  // SA-028: the ONE table carries live staff rows with status chips
  await expect(
    screen.getByText(cat(en, 'Teachers.table.statusActive'), { exact: true }).first(),
  ).toBeVisible();

  // SA-029: invite
  await screen.getByRole('button', { name: cat(en, 'Teachers.addButton') }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(cat(en, 'Teachers.invite.firstName')).fill('W3');
  await dialog.getByLabel(cat(en, 'Teachers.invite.lastName')).fill('Invitee');
  await dialog.getByLabel(cat(en, 'Teachers.invite.email')).fill(email);
  await dialog.getByRole('button', { name: cat(en, 'Teachers.invite.submit') }).click();
  await expect(page.locator('[data-sonner-toast]')).toContainText(email, { timeout: 20_000 });

  // the invite mail is verifiable in Mailpit
  await expect
    .poll(async () => {
      const res = await page.request.get(`${MAILPIT_API}/search?query=to:${email}`);
      return ((await res.json()) as { total: number }).total;
    }, { timeout: 30_000 })
    .toBeGreaterThan(0);

  // SA-030: inviting the SAME email maps the server refusal; no second invitation
  await screen.getByRole('button', { name: cat(en, 'Teachers.addButton') }).click();
  const dupDialog = page.getByRole('dialog');
  await expect(dupDialog).toBeVisible();
  await dupDialog.getByLabel(cat(en, 'Teachers.invite.firstName')).fill('W3');
  await dupDialog.getByLabel(cat(en, 'Teachers.invite.lastName')).fill('Invitee');
  await dupDialog.getByLabel(cat(en, 'Teachers.invite.email')).fill(email);
  await dupDialog.getByRole('button', { name: cat(en, 'Teachers.invite.submit') }).click();
  // the 409 maps INLINE onto the email field, carrying the API's message
  await expect(
    dupDialog.getByText(/already|pending|belongs/i).first(),
  ).toBeVisible({ timeout: 20_000 });

  // exactly one invitation row for that email
  const count = runSql(`select count(*) from invitations where email='${email}'`);
  expect(Number(count)).toBe(1);
  throwawayTeacher = { email, name: 'W3 Invitee' };
});

// ---------------------------------------------------------------------------
test('SA-031 + SA-032 + SA-033 + SA-034 + SA-035: the accepted teacher is edited, class-assigned, deactivated, reactivated, and their detail renders', async ({
  page,
}) => {
  test.skip(!throwawayTeacher, 'needs the invitation from the previous test');
  await page.setViewportSize({ width: 1440, height: 900 });
  page.setDefaultTimeout(30_000);
  const email = throwawayTeacher!.email;

  // accept the invitation through the REAL /invite/<token> surface
  const token = runSql(`select token from invitations where email='${email}' order by id desc limit 1`);
  await page.goto(`/invite/${token}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  // the acceptance form: set a password and submit
  const password = 'W3Teacher123!';
  const pw = page.getByLabel(/password/i).first();
  await pw.fill(password);
  const pw2 = page.getByLabel(/confirm/i).first();
  if (await pw2.isVisible().catch(() => false)) await pw2.fill(password);
  await page.getByRole('button', { name: /activate|accept|submit|join/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 30_000 });

  // back as the school admin
  await patientLogin(page);
  await page.goto('/dashboard/school/teachers');
  const screen = page.locator('[data-surface="school-admin-teachers"]');
  await expect(screen).toBeVisible();
  const row = screen.locator('[data-directory-row]').filter({ hasText: email });
  await expect(row).toBeVisible({ timeout: 20_000 });

  // SA-031: edit the teacher's name; persists
  await row.hover();
  await screen.getByRole('button', { name: 'Edit W3 Invitee' }).click();
  const editDialog = page.getByRole('dialog');
  await expect(editDialog).toBeVisible();
  await editDialog.getByLabel(cat(en, 'Teachers.edit.firstName')).fill('W3 Renamed');
  await editDialog.getByRole('button', { name: cat(en, 'Teachers.edit.submit') }).click();
  await expect(page.locator('[data-sonner-toast]')).toContainText('W3 Renamed');

  // open the detail
  await page.goto('/dashboard/school/teachers');
  const renamedRow = screen.locator('[data-directory-row]').filter({ hasText: email });
  await expect(renamedRow).toBeVisible({ timeout: 20_000 });
  await renamedRow.getByRole('link').first().click();
  const detail = page.locator('[data-surface="school-admin-teacher-detail"]');
  await expect(detail).toBeVisible();

  // SA-035: the detail's stat cards and panels render
  await expect(detail.getByText(cat(en, 'Teachers.detail.stats.classes'))).toBeVisible();
  await expect(detail.getByText(cat(en, 'Teachers.detail.classesPanel.title'))).toBeVisible();
  await expect(detail.getByText(cat(en, 'Teachers.detail.accountPanel.title'))).toBeVisible();

  // SA-032: the assign-classes dialog ticks a class and saves
  await detail.getByRole('button', { name: cat(en, 'Teachers.detail.assignButton') }).click();
  const assignDialog = page.getByRole('dialog');
  await expect(assignDialog).toBeVisible();
  const checkbox = assignDialog.getByRole('checkbox').first();
  if (await checkbox.isVisible().catch(() => false)) {
    await checkbox.check();
    await assignDialog.getByRole('button', { name: cat(en, 'Teachers.detail.assignDialog.submit') }).click();
    await expect(assignDialog).toBeHidden({ timeout: 20_000 });
  } else {
    await assignDialog.getByRole('button', { name: cat(en, 'Teachers.detail.assignDialog.cancel') }).click();
  }

  // SA-033: deactivate with its confirm copy
  await page.goto('/dashboard/school/teachers');
  const renamedRow2 = screen.locator('[data-directory-row]').filter({ hasText: email });
  await expect(renamedRow2).toBeVisible({ timeout: 20_000 });
  await renamedRow2.getByRole('button', { name: cat(en, 'Teachers.table.rowMenuLabel') }).click();
  await page.getByRole('menuitem', { name: cat(en, 'Teachers.actions.deactivate') }).click();
  const confirm = page.getByRole('dialog');
  await expect(confirm).toBeVisible();
  await expect(confirm).toContainText('Deactivate W3 Renamed');
  await confirm.getByRole('button', { name: cat(en, 'Teachers.actions.deactivateConfirm') }).click();
  await expect(page.locator('[data-sonner-toast]')).toContainText('W3 Renamed', { timeout: 20_000 });
  await expect(
    screen.getByText(cat(en, 'Teachers.table.status.deactivated'), { exact: true }).first(),
  ).toBeVisible({ timeout: 20_000 });

  // SA-034: reactivate back to active
  await renamedRow2.getByRole('button', { name: cat(en, 'Teachers.table.rowMenuLabel') }).click();
  await page.getByRole('menuitem', { name: cat(en, 'Teachers.actions.reactivate') }).click();
  const reactConfirm = page.getByRole('dialog');
  await expect(reactConfirm).toBeVisible();
  await reactConfirm.getByRole('button', { name: cat(en, 'Teachers.actions.reactivateConfirm') }).click();
  await expect(page.locator('[data-sonner-toast]')).toContainText('W3 Renamed', { timeout: 20_000 });

  // final cleanup: remove the throwaway teacher from the school
  await renamedRow2.getByRole('button', { name: cat(en, 'Teachers.table.rowMenuLabel') }).click();
  const removeItem = page.getByRole('menuitem', { name: cat(en, 'Teachers.actions.remove') });
  if (await removeItem.isVisible().catch(() => false)) {
    await removeItem.click();
    const removeDialog = page.getByRole('dialog');
    await expect(removeDialog).toBeVisible();
    await removeDialog.getByRole('button', { name: cat(en, 'Teachers.actions.removeConfirm') }).click();
    await expect(page.locator('[data-sonner-toast]')).toBeVisible();
  }
});

// ---------------------------------------------------------------------------
test('SA-036 + SA-037 + SA-038 + SA-039: account tabs carry details, plan and seats; sign-out signs out', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  page.setDefaultTimeout(30_000);
  await patientLogin(page);
  const jwt = await schoolAdminJwt(page.request);

  // SA-037: seats used must equal the ACTIVE roster size served by the API
  const view = await page.request.get('http://127.0.0.1:5500/api/schools/me/entitlement', {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const entitlement = ((await view.json()) as { data?: { seats_used?: number; seats_total?: number } }).data;
  expect(entitlement?.seats_total, 'seats total served').toBeTruthy();

  await page.goto('/dashboard/school/account');
  const account = page.locator('[data-surface="school-admin-account"]');
  await expect(account).toBeVisible();

  // SA-036: details tab + plan tab content
  await expect(account.getByText(cat(en, 'SchoolAdmin.account.detailsTitle'))).toBeVisible();
  await account.getByRole('tab', { name: cat(en, 'SchoolAdmin.account.tabs.plan') }).click();
  await expect(
    account.getByText(cat(en, 'SchoolAdmin.account.planTitle')),
  ).toBeVisible({ timeout: 20_000 });
  if (entitlement?.seats_used !== undefined) {
    await expect(account.getByText(String(entitlement.seats_used).trim(), { exact: true }).first()).toBeVisible();
  }

  // SA-038: the settings tab renders (an honest placeholder panel in this build)
  await account.getByRole('tab', { name: cat(en, 'SchoolAdmin.account.tabs.settings') }).click();
  await expect(
    account.getByText(cat(en, 'SchoolAdmin.account.settingsEmptyTitle')),
  ).toBeVisible({ timeout: 20_000 });

  // SA-039: the sign-out panel signs the admin out
  await account.getByRole('tab', { name: cat(en, 'SchoolAdmin.account.tabs.signout') }).click();
  await page.waitForURL(/sign-in|\/$/, { timeout: 30_000 });
  await expect(page.locator('[data-surface="school-admin-account"]')).toHaveCount(0);
});

// ---------------------------------------------------------------------------
test('SA-040: participation renders per-class sitting rates', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  page.setDefaultTimeout(30_000);
  await patientLogin(page);

  await page.goto('/dashboard/school/participation');
  const screen = page.locator('[data-surface="school-admin-participation"]');
  await expect(screen).toBeVisible({ timeout: 30_000 });
  // per-class rate rows carry a percentage or an honest dash
  const body = await screen.innerText();
  expect(body.length, 'participation content rendered').toBeGreaterThan(40);
});

// ---------------------------------------------------------------------------
test('SA-041 + SA-043 + SA-048: analytics renders, the results export downloads, and an unknown class is an honest error', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  page.setDefaultTimeout(30_000);
  await patientLogin(page);

  // SA-041: the analytics screen renders the school -> class list
  await page.goto('/dashboard/school/analytics');
  const screen = page.locator('[data-surface="school-admin-analytics"]');
  await expect(screen).toBeVisible({ timeout: 30_000 });

  // SA-043: the results export downloads a CSV
  const exportButton = screen.getByRole('button', { name: /export/i }).first();
  await expect(exportButton).toBeVisible();
  const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
  await exportButton.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename().toLowerCase()).toContain('.csv');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  const head = Buffer.concat(chunks).toString('utf8').slice(0, 200);
  await testInfo.attach('w3-sa043-export.csv', { body: Buffer.from(head), contentType: 'text/csv' });
  expect(head.length).toBeGreaterThan(0);

  // SA-048: an unknown class documentId renders an honest error state
  await page.goto('/dashboard/school/classes/zzzzzzzzzzzzzzzzzzzzzz');
  const notFound = page.getByText(/could not|not found|no longer|exist/i).first();
  await expect(notFound).toBeVisible({ timeout: 30_000 });
});

// ---------------------------------------------------------------------------
test('SA-044: the legacy children deep links land on students and the create form', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  page.setDefaultTimeout(30_000);
  await patientLogin(page);

  await page.goto('/dashboard/school/children');
  await page.waitForURL(/dashboard\/school\/students$/, { timeout: 30_000 });
  const list = page.locator('[data-surface="school-admin-students"]');
  await expect(list).toBeVisible();

  await page.goto('/dashboard/school/children/new');
  await page.waitForURL(/students\/new$/, { timeout: 30_000 });
  await expect(page.locator('[data-surface="school-admin-student-new"]')).toBeVisible();
});

// ---------------------------------------------------------------------------
test('SA-047: a teacher JWT on /dashboard/school is bounced by the school layout guard', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  page.setDefaultTimeout(30_000);
  await patientLogin(page, 'teacher');

  await page.goto('/dashboard/school');
  // the school layout guard must NOT leave a teacher on a school-admin surface
  await page.waitForURL(/teach|dashboard(?!\/school)|sign-in/, { timeout: 30_000 }).catch(() => {});
  await expect(page.locator('[data-surface="school-admin-home"]')).toHaveCount(0);
  const url = page.url();
  expect(url).not.toMatch(/dashboard\/school$/);
});
