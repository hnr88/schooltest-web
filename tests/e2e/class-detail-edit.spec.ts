import { expect, test } from '@playwright/test';

import {
  apiClassDetail,
  FIXTURE_CLASS_ID,
  gotoClassDetail,
  schoolAdminJwt,
} from './helpers/class-detail';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';

// Spec §1 "Edit Class Modal" — a single teacher dropdown, no checkboxes, and a
// write that REALLY persists. Both flows restore the class to its original
// state through the same real UI path they changed it with.
const en = loadMessages('en');
const PROBE_SUFFIX = ' (edit probe)';

test.describe.configure({ mode: 'serial' });

test.describe('edit class modal (spec §1)', () => {
  test('flow 6: the modal pre-fills the name and offers ONE teacher select', async ({ page }) => {
    await loginAs(page, 'schoolAdmin');
    const detail = await apiClassDetail(page.request, await schoolAdminJwt(page.request));
    await gotoClassDetail(page);

    await page.getByRole('button', { name: cat(en, 'Classes.detail.editClass') }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await expect(dialog.getByLabel(cat(en, 'Classes.detail.edit.nameLabel'))).toHaveValue(
      detail.name ?? '',
    );

    const select = dialog.getByLabel(cat(en, 'Classes.detail.edit.teacherLabel'));
    await expect(select).toBeVisible();
    // A SINGLE select, not a multi-select and not a checkbox list.
    await expect(select).not.toHaveAttribute('multiple', /.*/);
    await expect(dialog.locator('input[type="checkbox"], [role="checkbox"]')).toHaveCount(0);
    await expect(select).toHaveValue(detail.teacher?.documentId ?? '');

    // ESC closes and focus is restored to the trigger.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('flow 7: a rename persists, survives a reload and shows in the Classes list', async ({
    page,
  }) => {
    await loginAs(page, 'schoolAdmin');
    const jwt = await schoolAdminJwt(page.request);
    const before = await apiClassDetail(page.request, jwt);
    const original = before.name ?? '';
    const probeName = `${original}${PROBE_SUFFIX}`;

    await gotoClassDetail(page);
    await page.getByRole('button', { name: cat(en, 'Classes.detail.editClass') }).click();
    await page.getByLabel(cat(en, 'Classes.detail.edit.nameLabel')).fill(probeName);
    await page.getByRole('button', { name: cat(en, 'Classes.detail.edit.save') }).click();

    // The header reflects it immediately…
    await expect(page.getByRole('heading', { level: 1, name: probeName })).toBeVisible();

    // …the SERVER really holds it…
    const afterSave = await apiClassDetail(page.request, jwt);
    expect(afterSave.name).toBe(probeName);
    // …the roster was not touched by the edit…
    expect(afterSave.student_count).toBe(before.student_count);

    // …it survives a full reload…
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: probeName })).toBeVisible();

    // …and the Classes list shows the new name.
    await page.goto('/dashboard/school/classes');
    await expect(page.getByRole('link', { name: probeName, exact: true }).first()).toBeVisible();

    // Restore through the same real UI path.
    await gotoClassDetail(page);
    await page.getByRole('button', { name: cat(en, 'Classes.detail.editClass') }).click();
    await page.getByLabel(cat(en, 'Classes.detail.edit.nameLabel')).fill(original);
    await page.getByRole('button', { name: cat(en, 'Classes.detail.edit.save') }).click();
    await expect(page.getByRole('heading', { level: 1, name: original })).toBeVisible();
    expect((await apiClassDetail(page.request, jwt)).name).toBe(original);
  });

  test('flow 8: reassigning the teacher persists and never unlinks a student', async ({ page }) => {
    await loginAs(page, 'schoolAdmin');
    const jwt = await schoolAdminJwt(page.request);
    const before = await apiClassDetail(page.request, jwt);
    const originalTeacherId = before.teacher?.documentId ?? '';

    await gotoClassDetail(page);
    await page.getByRole('button', { name: cat(en, 'Classes.detail.editClass') }).click();
    const select = page.getByLabel(cat(en, 'Classes.detail.edit.teacherLabel'));

    // Pick a DIFFERENT teacher from the school's real staff list. `evaluateAll`
    // does NOT auto-wait, so the staff options are awaited first — otherwise it
    // can read the select in the frame before C-TCH-01 has painted its options.
    await expect(select.locator('option').nth(1)).toBeAttached();
    const options = await select.locator('option').evaluateAll((nodes) =>
      nodes.map((node) => ({
        value: (node as HTMLOptionElement).value,
        label: (node as HTMLOptionElement).textContent ?? '',
      })),
    );
    const next = options.find((option) => option.value !== '' && option.value !== originalTeacherId);
    expect(next, 'the school needs at least two teachers for this flow').toBeTruthy();

    await select.selectOption(next!.value);
    await page.getByRole('button', { name: cat(en, 'Classes.detail.edit.save') }).click();
    await expect(page.locator('[data-surface="school-admin-class-detail"]')).toContainText(
      next!.label.trim(),
    );

    const afterSave = await apiClassDetail(page.request, jwt, FIXTURE_CLASS_ID);
    expect(afterSave.teacher?.documentId).toBe(next!.value);
    expect(afterSave.student_count).toBe(before.student_count);

    await page.reload();
    await expect(page.locator('[data-surface="school-admin-class-detail"]')).toContainText(
      next!.label.trim(),
    );

    // Restore the original assignment through the modal.
    await page.getByRole('button', { name: cat(en, 'Classes.detail.editClass') }).click();
    await page.getByLabel(cat(en, 'Classes.detail.edit.teacherLabel')).selectOption(originalTeacherId);
    await page.getByRole('button', { name: cat(en, 'Classes.detail.edit.save') }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    const restored = await apiClassDetail(page.request, jwt);
    expect(restored.teacher?.documentId ?? '').toBe(originalTeacherId);
    expect(restored.student_count).toBe(before.student_count);
  });
});
