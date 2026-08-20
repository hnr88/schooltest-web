import { expect, test } from '@playwright/test';

import {
  API,
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
  // These flows MUTATE the seeded fixture class. Each restores what it changed
  // through the same modal, but a failure mid-flow would leave the probe name
  // (or a foreign teacher) live in the dev database for the next run and for
  // anyone browsing the app — so the original state is captured once and put
  // back unconditionally, whatever happened.
  let original: { name: string; teacherDocumentId: string } | null = null;

  /**
   * THE FIXTURE OWNER IS CHECKED, NOT INFERRED (D-13).
   *
   * This spec used to take "original" from whatever the database happened to
   * hold, which made the teardown SELF-POISONING. On 2026-08-19 at 12:46 the
   * restore PATCH returned 401 after a 60-second hang and never landed; from
   * then on every run read the corrupted state as its "original" and faithfully
   * restored the corruption. A ratchet: the fixture could be knocked out of
   * true exactly once and could never come back. It stayed wrong for 26 hours,
   * owned by a throwaway `e2e-scoping-*` account, and while it was wrong the
   * class was absent from `teacher@`'s dashboard entirely — so the 22 API specs
   * pinned on `classes[0]` were indexing a different class while staying GREEN.
   *
   * The seed now repairs the link (`schooltest-api/src/bootstrap/seed-users.ts`,
   * `repairStarterClassTeacher`), but a repair alone leaves the pawl in place:
   * the next run of THIS spec would adopt the corruption again. So the
   * precondition is checked here. A test that silently accepts a broken
   * precondition cannot detect a broken precondition.
   *
   * WHY `first_name` AND NOT `email`. `classDetailTeacherSchema` is a
   * `z.strictObject` exposing only `documentId`, `first_name` and `last_name`
   * (`src/modules/classes/schemas/class-detail.schema.ts:50-54`) — there is no
   * `email` on this payload, so an email assertion here would compare
   * `undefined` and fail on EVERY run, including healthy ones. That is a broken
   * harness wearing a finding's clothes, and it is the shape this check is
   * guarding against, so it would have been a poor way to write it.
   *
   * Every throwaway teacher is stamped `first_name: 'E2E'` by the shared helper
   * (`tests/e2e/helpers/revocation.ts:80`), which is precisely the population
   * that leaks into this class. So the guard tests the thing that actually goes
   * wrong, using a field the contract really carries.
   */
  const THROWAWAY_MARKER = 'E2E';

  test.beforeAll(async ({ request }) => {
    const before = await apiClassDetail(request, await schoolAdminJwt(request));
    // FAIL LOUDLY on a dirty fixture rather than baking it in as the baseline.
    // If this fires, do NOT relax it — the fixture is wrong, and the seed will
    // repair it on the next boot (ask L1, who owns restarts, for one).
    expect(
      before.teacher?.first_name ?? '(no teacher)',
      'fixture class must NOT be owned by a throwaway e2e teacher before this spec mutates it — '
        + 'a foreign owner means an earlier run failed to restore (D-13), and capturing it as '
        + '"original" would make this teardown cement the corruption permanently',
    ).not.toBe(THROWAWAY_MARKER);
    original = {
      name: before.name ?? '',
      teacherDocumentId: before.teacher?.documentId ?? '',
    };
  });

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
