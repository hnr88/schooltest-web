/**
 * E2E PROOF SPEC — school-admin portal visual acceptance on populated fixtures.
 *
 * Drives the real app on :3002 against the real API on :5500 as the seeded
 * schooladmin-a, in one serial login (the auth limiter is 20 POSTs/min/IP).
 * Demo School A is asserted active through the rail's school switcher, then
 * every view is screenshotted fullPage at 1440px into tests/proofs/sa-acceptance/:
 *
 *   01 school home          05 student drill-down
 *   02 classes list         06 teachers list
 *   03 class detail         07 teacher detail
 *   04 students list        08 account
 *
 * The second half smokes the five dialogs on live data and PROVES each
 * mutation round-trips (the list/detail reflects it) before REVERTING it so
 * the fixtures stay clean:
 *
 *   09 add-class dialog      -> creates "ZZ Proof Class <ts>"    -> deleted
 *   10 edit-class dialog     -> renames the proof class          -> (deleted above)
 *   11 assign-teachers dialog-> assigns a teacher to it          -> (deleted above)
 *   12 add-students picker   -> adds a student ("move class")    -> removed/restored
 *   13 invite-teacher dialog -> invites a proof teacher          -> invitation revoked
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../../helpers/roles';

const SHOTS = path.resolve(process.cwd(), 'tests/proofs/sa-acceptance');
mkdirSync(SHOTS, { recursive: true });

const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, name), fullPage: true });

/** Dialogs animate in (~200ms); shoot after the entrance settles or the
 * capture catches a half-faded overlay. */
const shotDialog = async (page: Page, name: string) => {
  await page.waitForTimeout(500);
  await shot(page, name);
};

const STAMP = Date.now().toString(36);
const PROOF_CLASS = `ZZ Proof Class ${STAMP}`;
const PROOF_TEACHER_EMAIL = `sa-proof-teacher-${STAMP}@schooltest.local`;
// Set by test 11: an existing class and its teacher. Test 12 moves one of that
// class's students into the proof class, which the API only accepts when both
// sides carry the same teacher (O13(h) student⇄class teacher coherence).
let ORIGIN_CLASS = '';
let ORIGIN_TEACHER = '';

test.describe.configure({ mode: 'serial', timeout: 240_000 });

let page: Page;

/** The classes table renders one [data-directory-row] per class. */
const rows = () => page.locator('[data-directory-row]');

async function goto(pathname: string): Promise<void> {
  await page.goto(pathname);
  await page.waitForLoadState('networkidle');
}

/** First-cell anchor the directory kit renders for a row with a rowHref. */
function rowLink(row: ReturnType<ReturnType<typeof rows>['nth']>) {
  return row.locator('a[data-row-href]');
}

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  page = await context.newPage();
  await loginAs(page, 'schoolAdmin');
  await cleanupLeftovers();
});

test.afterAll(async () => {
  await page.close();
});

/**
 * Rerun hygiene: an earlier interrupted run must never leak fixtures. Any
 * "ZZ Proof Class*" left on the roster is deleted and any leftover
 * sa-proof-teacher-* invitation is revoked before the proof starts.
 *
 * Each attempt is retried: the runs showed the fresh post-login context
 * re-rendering the table (row buttons detaching) while hydration settles.
 */
async function cleanupLeftovers(): Promise<void> {
  await goto('/dashboard/school/classes');
  await expect(rows().first()).toBeVisible();
  for (let guard = 0; guard < 10; guard += 1) {
    const stale = page.locator('[data-directory-row]', { hasText: /ZZ Proof Class/ }).first();
    if ((await stale.count()) === 0) break;
    let deleted = false;
    for (let attempt = 0; attempt < 3 && !deleted; attempt += 1) {
      try {
        await page.waitForTimeout(1_500);
        await stale.getByRole('button', { name: 'Row actions' }).click();
        await page.getByRole('menuitem', { name: 'Delete class' }).click();
        await page
          .getByRole('alertdialog')
          .getByRole('button', { name: 'Delete class' })
          .click();
        await expect(page.getByRole('alertdialog')).toBeHidden();
        deleted = true;
      } catch {
        if (attempt === 2) throw new Error(`cleanup delete failed — still on ${page.url()}`);
        await page.keyboard.press('Escape');
      }
    }
    await expect(page.locator('[data-directory-row]', { hasText: /ZZ Proof Class/ })).toHaveCount(
      0,
    );
  }
  await goto('/dashboard/school/teachers');
  await expect(rows().first()).toBeVisible();
  for (let guard = 0; guard < 10; guard += 1) {
    const stale = page
      .locator('[data-directory-row][data-status="invited"]', {
        hasText: /sa-proof-teacher-/,
      })
      .first();
    if ((await stale.count()) === 0) break;
    await stale.getByRole('button', { name: 'Row actions' }).click();
    await page.getByRole('menuitem', { name: 'Revoke invitation' }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Revoke invitation' })
      .click();
    await expect(
      page.locator('[data-directory-row]', { hasText: /sa-proof-teacher-/ }),
    ).toHaveCount(0);
  }
}

async function ensureDemoSchoolA(): Promise<void> {
  const trigger = page.getByTestId('school-switcher');
  await expect(trigger).toBeVisible();
  const label = (await trigger.innerText()) + ' ' + (await trigger.getAttribute('aria-label'));
  if (/demo school a/i.test(label)) return;
  await trigger.click();
  await page.getByRole('menuitem', { name: /demo school a/i }).click();
  // The pick resets the whole portal to the school home (use-switch-school).
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('school-switcher')).toContainText(/demo school a/i);
}

// ---------------------------------------------------------------------------
// VIEW SCREENSHOTS — Demo School A populated fixtures (19 classes / 172
// students / 20 teachers), one fullPage 1440px shot per design view.
// ---------------------------------------------------------------------------

test('01 — school home', async () => {
  await goto('/dashboard/school');
  await ensureDemoSchoolA();
  const home = page.locator('[data-slot="school-home"]');
  await expect(home).toBeVisible();
  await expect(home.getByRole('heading', { level: 1 })).toBeVisible();
  // Diagnostics strip renders real aggregates, not the pending skeleton.
  await expect(page.getByText('Students tested')).toBeVisible();
  await shot(page, '01-school-home.png');
});

test('02 — classes list', async () => {
  await goto('/dashboard/school/classes');
  await expect(page.locator('[data-slot="school-classes"]')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Classes' })).toBeVisible();
  await expect(rows().first()).toBeVisible();
  await shot(page, '02-classes-list.png');
});

test('03 — class detail (populated class)', async () => {
  // Pick the first class whose Students figure is non-zero. The row is plain
  // text (badge, name, teacher, count, completion line) — the count is the row's
  // only standalone numeric line.
  const total = await rows().count();
  let classHref = '';
  for (let i = 0; i < total; i += 1) {
    const lines = (await rows().nth(i).innerText()).split('\n');
    const count = lines.find((line) => /^\d{1,4}$/.test(line.trim()));
    if (count !== undefined && Number(count) > 0) {
      classHref = (await rowLink(rows().nth(i)).getAttribute('href')) ?? '';
      break;
    }
  }
  expect(classHref, 'Demo School A should have at least one populated class').not.toBe('');
  await goto(classHref);
  const detail = page.locator('[data-slot="school-class-detail"]');
  await expect(detail).toBeVisible();
  await expect(detail.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('[data-slot="class-students-table"]')).toBeVisible();
  await shot(page, '03-class-detail.png');
});

test('04 — students list', async () => {
  await goto('/dashboard/school/students');
  await expect(page.locator('[data-slot="school-students"]')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Students' })).toBeVisible();
  await expect(rows().first()).toBeVisible();
  await shot(page, '04-students-list.png');
});

test('05 — student drill-down', async () => {
  await goto('/dashboard/school/students');
  // The roster's head rows are archived fixtures; the drill-down proof wants a
  // live enrolment, so take the first row that carries no Archived pill.
  const total = await rows().count();
  let href = '';
  for (let i = 0; i < total; i += 1) {
    if (!/archived/i.test(await rows().nth(i).innerText())) {
      href = (await rowLink(rows().nth(i)).getAttribute('href')) ?? '';
      break;
    }
  }
  expect(href, 'students roster rows navigate to the drill-down').toContain(
    '/dashboard/school/students/',
  );
  await goto(href);
  const detail = page.locator('[data-slot="school-student-detail"]');
  await expect(detail).toBeVisible();
  await expect(detail.getByRole('heading', { level: 1 })).toBeVisible();
  await shot(page, '05-student-drilldown.png');
});

test('06 — teachers list', async () => {
  await goto('/dashboard/school/teachers');
  await expect(page.locator('[data-slot="school-teachers"]')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Teachers' })).toBeVisible();
  await expect(rows().first()).toBeVisible();
  await shot(page, '06-teachers-list.png');
});

test('07 — teacher detail', async () => {
  await goto('/dashboard/school/teachers');
  // An ACTIVE teacher row navigates to /teachers/<id>; invitation rows stay put.
  const active = page.locator('[data-directory-row][data-status="active"]').first();
  const href = await rowLink(active).getAttribute('href');
  expect(href, 'active teacher rows navigate to the detail').toContain(
    '/dashboard/school/teachers/',
  );
  await goto(href ?? '');
  await expect(page.locator('[data-slot="school-teacher-detail"]')).toBeVisible();
  await shot(page, '07-teacher-detail.png');
});

test('08 — account', async () => {
  await goto('/dashboard/school/account');
  await expect(page.locator('[data-slot="school-account"]')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Account' })).toBeVisible();
  await shot(page, '08-account.png');
});

// ---------------------------------------------------------------------------
// DIALOG SMOKES — one screenshot each, round-trip proven, data reverted.
// ---------------------------------------------------------------------------

test('09 — add class dialog round-trips and the proof class exists', async () => {
  await goto('/dashboard/school/classes');
  await page.getByRole('button', { name: 'Add class' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await shotDialog(page, '09-add-class-dialog.png');
  await dialog.getByLabel('Class name').fill(PROOF_CLASS);
  await dialog.getByRole('button', { name: 'Create class' }).click();
  // Round-trip: the new class is on the roster.
  await expect(page.locator('[data-directory-row]', { hasText: PROOF_CLASS })).toBeVisible();
});

test('10 — edit class dialog renames the proof class', async () => {
  const row = page.locator('[data-directory-row]', { hasText: PROOF_CLASS });
  await row.locator('a[data-row-href]').click();
  const detail = page.locator('[data-slot="school-class-detail"]');
  await expect(detail).toBeVisible();
  await detail.getByRole('button', { name: 'Edit class' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await shotDialog(page, '10-edit-class-dialog.png');
  const renamed = `${PROOF_CLASS} RENAMED`;
  await dialog.getByLabel('Class name').fill(renamed);
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  // Round-trip: the detail header carries the new name.
  await expect(detail.getByRole('heading', { level: 1 })).toHaveText(renamed);
});

test('11 — assign teachers dialog assigns a teacher to the proof class', async () => {
  await goto('/dashboard/school/classes');
  // Find an existing class with an assigned teacher: its teacher becomes the
  // proof class's teacher so test 12's student move is teacher-coherent.
  const total = await rows().count();
  for (let i = 0; i < total; i += 1) {
    const lines = (await rows().nth(i).innerText()).split('\n').map((line) => line.trim());
    // Row anatomy: badge, name, teacher (— when none), student count, tests.
    // A comma means multiple teachers; the dialog labels one teacher per row.
    // The class also needs STUDENTS — test 12 moves one of them.
    const count = Number(lines[3]);
    if (
      lines[2] !== undefined &&
      lines[2] !== '—' &&
      lines[2] !== '' &&
      !lines[2].includes(',') &&
      Number.isFinite(count) &&
      count > 0
    ) {
      ORIGIN_CLASS = lines[1];
      ORIGIN_TEACHER = lines[2];
      break;
    }
  }
  expect(ORIGIN_CLASS, 'a class with an assigned teacher exists').toBeTruthy();
  await page.getByRole('button', { name: 'Assign teachers' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await shotDialog(page, '11-assign-teachers-dialog.png');
  // Base UI's checkbox is a <span role="checkbox"> + a hidden native input;
  // getByRole resolves the visible control only.
  await dialog.getByRole('checkbox', { name: `${PROOF_CLASS} RENAMED` }).click();
  await dialog.getByRole('checkbox', { name: ORIGIN_TEACHER }).click();
  await dialog.getByRole('button', { name: 'Assign', exact: true }).click();
  // Round-trip: the proof class detail shows the assigned teacher.
  await goto('/dashboard/school/classes');
  const row = page.locator('[data-directory-row]', { hasText: `${PROOF_CLASS} RENAMED` });
  await row.locator('a[data-row-href]').click();
  const detail = page.locator('[data-slot="school-class-detail"]');
  await expect(detail).toBeVisible();
  await expect(detail.getByText('No teacher assigned')).toHaveCount(0);
});

test('12 — add-students picker moves a student in and back out', async () => {
  // The proof class detail is on screen from the previous test.
  const detail = page.locator('[data-slot="school-class-detail"]');
  // An empty class renders TWO "Add student" controls (section header button +
  // empty-state link); the header button is the dialog this proof drives.
  await detail.getByRole('button', { name: 'Add student' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('A student already in another class will be moved')).toBeVisible();
  await expect(dialog.locator('[data-slot="class-students-picker"] label').first()).toBeVisible();
  await shotDialog(page, '12-add-students-picker.png');

  // Move a student FROM the origin class (test 11 captured it): their teacher
  // matches the proof class's teacher, so the O13(h) coherence guard passes.
  const picker = dialog.locator('[data-slot="class-students-picker"]');
  const labels = picker.locator('label');
  const movedLabel = labels.filter({ hasText: `In ${ORIGIN_CLASS} — will be moved` }).first();
  await expect(movedLabel).toBeVisible();
  // The name lives on the checkbox's aria-label, not in a plain span (the
  // first span inside the label is the checkbox's own icon).
  const studentName = (await movedLabel.getByRole('checkbox').getAttribute('aria-label')) ?? '';
  expect(studentName, 'candidate exposes a display name').toBeTruthy();
  await movedLabel.getByRole('checkbox').click();
  await dialog.getByRole('button', { name: 'Add to class' }).click();
  // Round-trip: the roster carries the student.
  await expect(
    page.locator('[data-slot="class-students-table"]', { hasText: studentName }),
  ).toBeVisible({ timeout: 15_000 });

  // REVERT — take the student back off the proof roster.
  await page.getByRole('button', { name: `Remove ${studentName} from this class` }).click();
  await expect(
    page.locator('[data-slot="class-students-table"]', { hasText: studentName }),
  ).toHaveCount(0);

  // The student goes home to their origin class (still teacher-coherent).
  await goto('/dashboard/school/classes');
  const originRow = page.locator('[data-directory-row]', { hasText: ORIGIN_CLASS });
  await originRow.locator('a[data-row-href]').click();
  await page
    .locator('[data-slot="school-class-detail"]')
    .getByRole('button', { name: 'Add student' })
    .first()
    .click();
  const restore = page.getByRole('dialog');
  await restore
    .locator('label')
    .filter({ hasText: studentName })
    .first()
    .getByRole('checkbox')
    .click();
  await restore.getByRole('button', { name: 'Add to class' }).click();
  await expect(
    page.locator('[data-slot="class-students-table"]', { hasText: studentName }),
  ).toBeVisible({ timeout: 15_000 });
});

test('13 — delete class dialog removes the proof class (revert)', async () => {
  await goto('/dashboard/school/classes');
  const row = page.locator('[data-directory-row]', { hasText: `${PROOF_CLASS} RENAMED` });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Row actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete class' }).click();
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Delete class' }).click();
  // Round-trip: the roster no longer carries the proof class.
  await expect(page.locator('[data-directory-row]', { hasText: PROOF_CLASS })).toHaveCount(0);
});

test('14 — invite teacher dialog round-trips and the invitation is revoked', async () => {
  await goto('/dashboard/school/teachers');
  await page.getByRole('button', { name: 'Add teacher' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await shotDialog(page, '13-invite-teacher-dialog.png');
  await dialog.getByLabel('First name').fill('Proof');
  await dialog.getByLabel('Last name').fill(`Teacher ${STAMP}`);
  await dialog.getByLabel('Email').fill(PROOF_TEACHER_EMAIL);
  await dialog.getByRole('button', { name: 'Send invitation' }).click();
  // Round-trip: the merged staff table shows the open invitation.
  const invited = page.locator('[data-directory-row][data-status="invited"]', {
    hasText: PROOF_TEACHER_EMAIL,
  });
  await expect(invited).toBeVisible();

  // REVERT — revoke the invitation so the fixture roster is untouched.
  await invited.getByRole('button', { name: 'Row actions' }).click();
  await page.getByRole('menuitem', { name: 'Revoke invitation' }).click();
  const confirm = page.getByRole('alertdialog');
  await confirm.getByRole('button', { name: 'Revoke invitation' }).click();
  await expect(
    page.locator('[data-directory-row]', { hasText: PROOF_TEACHER_EMAIL }),
  ).toHaveCount(0);
});
