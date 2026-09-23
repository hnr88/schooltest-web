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
 * a11y follow-up: the blocked trigger is aria-disabled (still focusable), so a
 * keyboard user reaches it and hears the hint; the hint ink meets AA on the
 * page; and ticking an invited teacher in a picker says what it unticked.
 *
 * Screenshots: /Users/hunor.nagy/Desktop/live_feedback_1/proof/BUG-005/.
 */
import { expect, test, type Locator } from '@playwright/test';

import {
  acceptInvitation,
  API,
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
const invitee = { ...teacherPerson('bug005-invitee'), first: 'Invitee' };

test.afterAll(async () => {
  await removeSchool(school, [teacher.email, invitee.email]);
});

/** WCAG contrast of an element's text against the first opaque background behind it. */
async function contrastRatio(target: Locator): Promise<number> {
  return target.evaluate((element) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const rgb = (css: string): [number, number, number, number] => {
      context!.clearRect(0, 0, 1, 1);
      context!.fillStyle = css;
      context!.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context!.getImageData(0, 0, 1, 1).data;
      return [r, g, b, a];
    };
    let node: Element | null = element;
    let background: [number, number, number, number] = [255, 255, 255, 255];
    while (node) {
      const candidate = rgb(getComputedStyle(node).backgroundColor);
      if (candidate[3] === 255) {
        background = candidate;
        break;
      }
      node = node.parentElement;
    }
    const luminance = ([r, g, b]: [number, number, number, number]) => {
      const channel = (value: number) => {
        const s = value / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };
    const text = luminance(rgb(getComputedStyle(element).color));
    const back = luminance(background);
    return (Math.max(text, back) + 0.05) / (Math.min(text, back) + 0.05);
  });
}

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

  // a11y follow-up: aria-disabled, never the native disabled that Tab skips.
  await expect(addClass).toHaveAttribute('aria-disabled', 'true');
  expect(await addClass.evaluate((button) => button.hasAttribute('disabled'))).toBe(false);
  await screen.getByRole('heading', { level: 1 }).click();
  let reached = false;
  for (let press = 0; press < 25 && !reached; press += 1) {
    await page.keyboard.press('Tab');
    reached = await addClass.evaluate((button) => button === document.activeElement);
  }
  expect(reached, 'Tab reaches the blocked Add class button').toBe(true);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const ratio = await contrastRatio(hint);
  test.info().annotations.push({ type: 'hint-contrast', description: ratio.toFixed(2) });
  expect(ratio, `hint contrast ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
  await page.screenshot({ path: proofPath('BUG-005', 'followup-01-blocked-add-class-focused.png'), animations: 'disabled' });

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

test('BUG-005 a11y follow-up: ticking an invited teacher says which picks it unticked', async ({ page }) => {
  test.setTimeout(180_000);
  expect(school, 'the first journey created the school').not.toBeNull();
  const fresh = school as FreshSchool;
  await page.setViewportSize({ width: 1440, height: 900 });

  // A class to assign to and a still-pending invitation beside the active teacher.
  const created = await fetch(`${API}/api/schools/me/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fresh.adminJwt}` },
    body: JSON.stringify({ name: `BUG005 Picker 7A ${Date.now()}` }),
  });
  expect(created.status).toBe(201);
  const classDocumentId = ((await created.json()) as { data: { documentId: string } }).data.documentId;
  await inviteTeacher(fresh.adminJwt, invitee);

  try {
    await signIn(page, fresh.admin);
    await page.goto('/en/dashboard/school/classes');
    const screen = page.locator('[data-slot="school-classes"]');
    await expect(screen).toBeVisible({ timeout: 30_000 });
    await screen.getByRole('button', { name: cat(en, 'Classes.assignTeachersButton'), exact: true }).click();
    const dialog = page.getByRole('dialog');
    const notice = dialog.locator('[data-slot="teacher-picks-cleared"]');
    await expect(notice).toHaveAttribute('aria-live', 'polite');
    await expect(notice).toHaveText('');

    const activeName = `${teacher.first} ${teacher.last}`;
    const invitedLabel = cat(en, 'Classes.teacherPicker.pendingOption').replace('{name}', `${invitee.first} ${invitee.last}`);
    await dialog.getByText(activeName, { exact: true }).click();
    await dialog.getByText(invitedLabel, { exact: true }).click();
    await expect(notice).toHaveText(
      `An invited teacher is assigned on their own, so ${activeName} was unticked.`,
    );
    await page.screenshot({ path: proofPath('BUG-005', 'followup-02-picker-announces-unticked.png'), animations: 'disabled' });
    await dialog.getByRole('button', { name: cat(en, 'Classes.assignTeachers.cancel'), exact: true }).click();
  } finally {
    await fetch(`${API}/api/schools/me/classes/${classDocumentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${fresh.adminJwt}` },
    });
  }
});
