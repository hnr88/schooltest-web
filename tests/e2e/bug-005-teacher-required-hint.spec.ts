/**
 * BUG-005 — a school admin setting up a school is told WHY they cannot add a
 * class yet, instead of facing a silently disabled control.
 *
 * ONE chained journey against the real Strapi, no mocks:
 *  1. A FRESH school whose only staff member is its school admin (ops create +
 *     ops admin invitation + public accept — helpers/bug005-006.ts).
 *  2. The admin signs in through the portal form and opens Classes: "Add class"
 *     is disabled and the hint beside it says to invite a teacher first, tied
 *     to the button with aria-describedby.
 *  3. A teacher is invited and ACTIVATES (accepts); after a reload the hint is
 *     gone, "Add class" is live, and the Add class dialog opens with the form.
 *
 * Screenshots: /Users/hunor.nagy/Desktop/live_feedback_1/proof/BUG-005/.
 */
import { expect, test } from '@playwright/test';

import {
  acceptInvitation,
  createSchoolWithAdminOnly,
  en,
  inviteTeacher,
  proofPath,
  removeSchool,
  signIn,
  teacherPerson,
  type FreshSchool,
} from './helpers/bug005-006';
import { cat } from './helpers/i18n';

test.describe.configure({ mode: 'serial' });

let school: FreshSchool | null = null;
const teacher = teacherPerson('bug005-teacher');

test.afterAll(async () => {
  await removeSchool(school, [teacher.email]);
});

test('BUG-005: no teacher → Add class explains why; an active teacher removes the hint', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  school = await createSchoolWithAdminOnly('BUG005 Hint School');

  await signIn(page, school.admin);
  await page.goto('/en/dashboard/school/classes');
  const screen = page.locator('[data-slot="school-classes"]');
  await expect(screen).toBeVisible({ timeout: 30_000 });

  const addClass = screen.getByRole('button', { name: cat(en, 'Classes.addButton'), exact: true });
  const hint = screen.locator('[data-slot="add-class-blocked-hint"]');
  await expect(hint).toHaveText(cat(en, 'Classes.addForm.teacherRequiredHint'), { timeout: 30_000 });
  await expect(hint).toContainText('Invite a teacher first');
  await expect(addClass).toBeDisabled();
  await expect(addClass).toHaveAttribute('aria-describedby', (await hint.getAttribute('id')) ?? '');
  await page.screenshot({ path: proofPath('BUG-005', '01-no-teacher-add-class-hint.png'), animations: 'disabled' });
  await hint.screenshot({ path: proofPath('BUG-005', '01b-hint-closeup.png'), animations: 'disabled' });

  // The admin follows the hint: a teacher is invited and activates.
  const invite = await inviteTeacher(school.adminJwt, teacher);
  await acceptInvitation(invite.token, teacher);

  await page.reload();
  await expect(screen).toBeVisible({ timeout: 30_000 });
  await expect(addClass).toBeEnabled({ timeout: 30_000 });
  await expect(hint).toHaveCount(0);
  await page.screenshot({ path: proofPath('BUG-005', '02-active-teacher-no-hint.png'), animations: 'disabled' });

  await addClass.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel(cat(en, 'Classes.addForm.name'))).toBeVisible();
  await page.screenshot({ path: proofPath('BUG-005', '03-add-class-dialog-opens.png'), animations: 'disabled' });
});
