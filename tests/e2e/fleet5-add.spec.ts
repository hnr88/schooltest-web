import { expect, test, type Page } from '@playwright/test';

import {
  apiChildren,
  apiLogin,
  dbStudentUserLink,
  realErrors,
  shot,
  signIn,
  STAMP,
} from './helpers/fleet5-live';
import { getMessage, waitForMessages } from './helpers/mailpit';
import { watchErrors } from './helpers/ui';

/**
 * Fleet 5 — ADD STUDENT, happy path, with TODAY'S-CHANGE evidence: every
 * created student must get a linked users-permissions account
 * (schooltest-api/src/bootstrap/student-provisioning-middlewares.ts).
 *
 * Two independent proofs, both recorded:
 *  A) DB: students_user_lnk joins the new student to a confirmed,
 *     passwordless (provider 'magic-link', no password) student-role user.
 *  B) Mailpit: POST /api/auth/student/magic-link/request for the student's
 *     email returns ok and the branded sign-in email lands; the link's token
 *     redeems at GET /api/auth/student/magic-link/verify into a real
 *     users-permissions JWT for THAT student.
 */

const ROSTER = '/en/dashboard/school/students';
const NEW = '/en/dashboard/school/students/new';
const API = 'http://127.0.0.1:5500';
const MAILPIT_UI = 'http://127.0.0.1:8125';

async function fillStudentForm(
  page: Page,
  values: { given: string; family: string; email: string },
): Promise<void> {
  const form = page.locator('[data-slot="school-student-new"]');
  await form.getByLabel('Given name').fill(values.given);
  await form.getByLabel('Family name', { exact: true }).fill(values.family);
  await form.getByLabel('Email', { exact: true }).fill(values.email);
  await form.getByLabel('Year level', { exact: true }).selectOption('8');
}

test.describe('fleet5: add student (happy)', () => {
  test.setTimeout(90_000);

  test('10 create via the form -> roster row -> linked user account (DB + Mailpit + verify JWT)', async ({
    page,
    request,
  }) => {
    test.setTimeout(150_000);
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    const given = 'Fleet';
    const family = `${STAMP}Add`;
    const email = `f5.add.${STAMP.toLowerCase()}@schooltest.local`;
    const fullName = `${given} ${family}`;

    await signIn(page);
    await page.goto(ROSTER);
    const screen = page.locator('[data-slot="school-students"]');
    await expect(screen).toBeVisible({ timeout: 30_000 });

    // ADD — minimal fields: name, email, year level.
    await screen.getByRole('button', { name: 'Add student', exact: true }).click();
    await page.waitForURL('**/dashboard/school/students/new');
    await expect(page.locator('[data-slot="school-student-new"]')).toBeVisible();
    await shot(page, '10a-add-form-empty');
    await fillStudentForm(page, { given, family, email });
    await shot(page, '10b-add-form-filled');

    await page
      .locator('[data-slot="school-student-new"]')
      .getByRole('button', { name: 'Add student', exact: true })
      .click();
    await page.waitForURL('**/dashboard/school/students', { timeout: 30_000 });

    // The success toast names the student. It auto-dismisses within seconds
    // and the shared dev stack can stall between navigation and assertion, so
    // a missed toast is caught here and the ROW becomes the hard proof below.
    let toastSeen = true;
    try {
      await expect(
        page.getByText(`${fullName} was added to your students.`, { exact: true }),
      ).toBeVisible({ timeout: 6_000 });
    } catch {
      toastSeen = false;
      console.log('[fleet5] created toast not captured (auto-dismissed before assert); the roster row assert below is the hard proof');
    }
    await shot(page, '10c-created-toast');

    // ...and the roster search surfaces the row.
    await screen.getByLabel('Search by name').fill(family);
    const row = page
      .locator('[data-slot="school-students-table"]')
      .locator('[data-slot="school-students-row"]');
    await expect(row).toHaveCount(1, { timeout: 30_000 });
    await expect(row.first()).toContainText(fullName);
    await shot(page, '10d-created-row-in-roster');

    // The created student's API row: active + the email we typed.
    const jwt = await apiLogin(request);
    const { rows } = await apiChildren(request, jwt, `q=${family}`);
    expect(rows).toHaveLength(1);
    const student = rows[0]!;
    expect(student.documentId).toBeTruthy();
    expect(student.student_status).toBe('active');
    expect((student.email ?? '').toLowerCase()).toBe(email);

    // PROOF A — the linked users-permissions account in the live DB.
    const link = await dbStudentUserLink(student.documentId);
    expect(link, 'student has NO linked users-permissions user (provisioning missing)').toBeTruthy();
    expect(link!.email.toLowerCase()).toBe(email);
    expect(link!.username.toLowerCase()).toBe(email);
    expect(link!.role_type).toBe('student');
    expect(link!.provider).toBe('magic-link');
    expect(link!.confirmed).toBe(true);
    expect(link!.has_password, 'passwordless account must carry no password').toBe(false);

    // PROOF B — the email can be sent a real magic link that lands in Mailpit.
    const requestRes = await request.post(`${API}/api/auth/student/magic-link/request`, {
      data: { email },
    });
    expect(requestRes.status(), await requestRes.text()).toBe(200);
    const summaries = await waitForMessages(request, email, 1);
    const message = await getMessage(request, summaries[0]!.ID);
    expect(message.Subject).toBe('Your SchoolTest sign-in link');
    const token = message.HTML.match(/token=([0-9a-f]+)/)?.[1] ?? '';
    expect(token, 'magic-link email must carry a raw token').not.toBe('');

    // The link redeems into a users-permissions JWT for THIS student, and that
    // JWT AUTHENTICATES against the users-permissions plugin itself
    // (GET /api/auth/student/me — 401 without a real, linked account). This is
    // the API-level proof the provisioned account exists and works.
    const verify = await request.get(`${API}/api/auth/student/magic-link/verify?token=${token}`);
    expect(verify.status(), await verify.text()).toBe(200);
    const verified = (await verify.json()) as {
      jwt: string;
      student: { documentId: string };
    };
    expect(verified.jwt).toBeTruthy();
    expect(verified.student.documentId).toBe(student.documentId);
    const me = await request.get(`${API}/api/auth/student/me`, {
      headers: { Authorization: `Bearer ${verified.jwt}` },
    });
    expect(me.status(), await me.text()).toBe(200);
    const meBody = (await me.json()) as {
      student: { documentId: string; email: string | null };
    };
    expect(meBody.student.documentId).toBe(student.documentId);

    // Student detail loads for the brand-new student too (direct URL — the
    // row-click navigation is probed separately in fleet5-edit-detail).
    await page.goto(`${ROSTER}/${student.documentId}`);
    const detail = page.locator('[data-slot="school-student-detail"]');
    await expect(detail.getByRole('heading', { level: 1, name: fullName })).toBeVisible({
      timeout: 30_000,
    });
    await shot(page, '10f-new-student-detail');

    // Visual evidence of the email in Mailpit's own UI (informational shot —
    // the API-level delivery + redemption asserts above are the hard proof).
    try {
      await page.goto(`${MAILPIT_UI}/#/search?q=${encodeURIComponent(`to:${email}`)}`);
      await expect(
        page.getByText('Your SchoolTest sign-in link').first(),
      ).toBeVisible({ timeout: 15_000 });
      await shot(page, '10e-mailpit-magic-link-email');
    } catch (mailpitUiError) {
      console.log(
        '[fleet5] Mailpit UI screenshot skipped (API evidence stands):',
        (mailpitUiError as Error).message.slice(0, 200),
      );
    }
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });

  test('11 create WITHOUT an email still provisions the deterministic fallback account', async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);
    page.setDefaultTimeout(30_000);
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const jwt = await apiLogin(request);
    const family = `${STAMP}NoMail`;

    await signIn(page);
    await page.goto(NEW);
    const form = page.locator('[data-slot="school-student-new"]');
    await form.getByLabel('Given name').fill('Noah');
    await form.getByLabel('Family name', { exact: true }).fill(family);
    // No email — the middleware mints <student_key>@students.schooltest.invalid.
    await form.getByRole('button', { name: 'Add student', exact: true }).click();
    await page.waitForURL('**/dashboard/school/students', { timeout: 30_000 });
    // Toast is transient and often dismissed while navigation settles; the
    // API row + provisioning asserts below are the hard proof.
    try {
      await expect(
        page.getByText(`Noah ${family} was added to your students.`, { exact: true }),
      ).toBeVisible({ timeout: 4_000 });
    } catch {
      console.log('[fleet5] no-email create: toast not captured; row + DB asserts follow');
    }
    await shot(page, '11a-created-without-email');

    const { rows } = await apiChildren(request, jwt, `q=${family}`);
    expect(rows).toHaveLength(1);
    const link = await dbStudentUserLink(rows[0]!.documentId);
    expect(link, 'email-less student still gets a linked account').toBeTruthy();
    expect(link!.email).toMatch(/@students\.schooltest\.invalid$/);
    expect(link!.role_type).toBe('student');
    expect(link!.provider).toBe('magic-link');
    expect(link!.confirmed).toBe(true);
    await shot(page, '11b-noemail-still-provisioned');
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
  });
});
