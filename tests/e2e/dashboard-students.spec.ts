import { expect, type APIRequestContext, type Page, test } from '@playwright/test';

import { deleteAuthEmailRows } from './helpers/auth-db';
import { cat, icu, loadMessages } from './helpers/i18n';
import { loginParentJwt, registerAndConfirmParent } from './helpers/throwaway-parent';
import { watchErrors } from './helpers/ui';

// Task 054 (C-UI-MYCHILDREN): the add-student DIALOG is gone (D-UI-1 — replaced by
// the wizard, covered by student-wizard.spec.ts). This file now exercises the
// relocated /dashboard/children flows against the REAL C-STUDENT-LIST-EXT /
// C-STUDENT-UPDATE endpoints: the archive/unarchive lifecycle (with DB-truth
// proofs) and the edit-wizard prefill + PUT submit. Each test provisions its OWN
// throwaway parent through the real register → Mailpit confirm → login round-trip
// (never the seeded parent), so it never perturbs the Mia/Jonas fixtures.
const en = loadMessages('en');
const API_BASE_URL = 'http://localhost:5500';
const usedEmails: string[] = [];

// Serial: each test registers its own throwaway parent (D20 register race).
test.describe.configure({ mode: 'serial' });

test.afterAll(() => {
  for (const email of usedEmails) deleteAuthEmailRows(email);
});

interface ApiStudentsResponse {
  data: { documentId: string; status: string }[];
}

async function seedParentWithStudent(
  page: Page,
  request: APIRequestContext,
  flow: string,
  student: Record<string, unknown>,
): Promise<{ jwt: string; documentId: string }> {
  const parent = await registerAndConfirmParent(request, flow);
  usedEmails.push(parent.email);
  const jwt = await loginParentJwt(request, parent);
  const res = await request.post(`${API_BASE_URL}/api/students`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: { data: student },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  const { data } = (await res.json()) as { data: { documentId: string } };
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
  return { jwt, documentId: data.documentId };
}

async function listStatuses(
  request: APIRequestContext,
  jwt: string,
  documentId: string,
  includeArchived: boolean,
): Promise<string[]> {
  const params: Record<string, string> = { 'pagination[pageSize]': '100' };
  if (includeArchived) {
    params['filters[status][$in][0]'] = 'active';
    params['filters[status][$in][1]'] = 'archived';
    params['filters[status][$in][2]'] = 'enrolled';
  }
  const res = await request.get(`${API_BASE_URL}/api/my/students`, {
    headers: { Authorization: `Bearer ${jwt}` },
    params,
  });
  const body = (await res.json()) as ApiStudentsResponse;
  return body.data.filter((s) => s.documentId === documentId).map((s) => s.status);
}

test('en: archive → confirm → row disappears; "Include archived" restores it; unarchive re-activates (DB-proven)', async ({
  page,
  request,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  const { jwt, documentId } = await seedParentWithStudent(page, request, 'children-archive', {
    given_name: 'Nora',
    family_name: 'Archive',
    nationality: 'Australia',
    current_year_level: 'Year 5',
    target_entry_year: '2027',
    target_entry_term: 'Term 2',
    parent_guardian_name: 'Guardian Test',
    parent_guardian_phone: '+61400000000',
    preferred_contact_channel: 'whatsapp',
  });
  await page.goto('/dashboard/children');

  const row = page.getByRole('row', { name: /Nora Archive/ });
  await expect(row).toBeVisible();
  await expect(row).toContainText(cat(en, 'Children.statusActive'));

  // Open the ⋯ actions dropdown, choose Archive, confirm in the AlertDialog.
  await page
    .getByRole('button', { name: icu(cat(en, 'Children.actionsLabel'), { name: 'Nora Archive' }) })
    .click();
  await page.getByRole('menuitem', { name: cat(en, 'Children.archive'), exact: true }).click();
  await expect(
    page.getByText(icu(cat(en, 'Children.archiveDialogTitle'), { name: 'Nora Archive' })),
  ).toBeVisible();
  await page.getByRole('button', { name: cat(en, 'Children.archiveConfirm'), exact: true }).click();

  // Row leaves the default list (server filter status $ne archived) + toast.
  await expect(
    page.getByText(icu(cat(en, 'Children.archivedToast'), { name: 'Nora Archive' })),
  ).toBeVisible();
  await expect(page.getByRole('row', { name: /Nora Archive/ })).toHaveCount(0);
  expect(await listStatuses(request, jwt, documentId, false)).toEqual([]);
  expect(await listStatuses(request, jwt, documentId, true)).toEqual(['archived']);

  // "Include archived" chip re-queries with filters[status][$in] → row returns.
  await page.getByRole('button', { name: cat(en, 'Children.includeArchived'), exact: true }).click();
  const archivedRow = page.getByRole('row', { name: /Nora Archive/ });
  await expect(archivedRow).toBeVisible();
  await expect(archivedRow).toContainText(cat(en, 'Children.statusArchived'));

  // Unarchive → back to active (UI + DB).
  await page
    .getByRole('button', { name: icu(cat(en, 'Children.actionsLabel'), { name: 'Nora Archive' }) })
    .click();
  await page.getByRole('menuitem', { name: cat(en, 'Children.unarchive'), exact: true }).click();
  await expect(
    page.getByText(icu(cat(en, 'Children.unarchivedToast'), { name: 'Nora Archive' })),
  ).toBeVisible();
  await expect(page.getByRole('row', { name: /Nora Archive/ }).getByText(cat(en, 'Children.statusActive'))).toBeVisible();
  expect(await listStatuses(request, jwt, documentId, false)).toEqual(['active']);

  expect(errors, errors.join('\n')).toEqual([]);
});

test('en: edit opens the wizard prefilled (passport empty) and Save changes PUTs, returning to the list', async ({
  page,
  request,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  const { documentId } = await seedParentWithStudent(page, request, 'children-edit', {
    given_name: 'Edith',
    family_name: 'Prefill',
    nationality: 'Australia',
    passport_number: 'X1234567',
    current_year_level: 'Year 6',
    target_entry_year: '2027',
    target_entry_term: 'Term 2',
    parent_guardian_name: 'Guardian Test',
    parent_guardian_phone: '+61400000000',
    preferred_contact_channel: 'whatsapp',
  });
  await page.goto('/dashboard/children');

  await page
    .getByRole('button', { name: icu(cat(en, 'Children.actionsLabel'), { name: 'Edith Prefill' }) })
    .click();
  await page.getByRole('menuitem', { name: cat(en, 'Children.edit'), exact: true }).click();

  await expect(page).toHaveURL(new RegExp(`/dashboard/children/${documentId}/edit$`));
  // Prefill from the detail read; passport_number is API-private → renders empty.
  await expect(page.locator('input[name="given_name"]')).toHaveValue('Edith');
  await expect(page.locator('input[name="family_name"]')).toHaveValue('Prefill');
  await expect(page.locator('input[name="passport_number"]')).toHaveValue('');

  // Advance through the 5 steps (all prefilled valid) to Review and Save.
  for (let step = 0; step < 4; step += 1) {
    await page.getByRole('button', { name: cat(en, 'StudentWizard.continue'), exact: true }).click();
  }
  const putPromise = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/students/${documentId}`) &&
      response.request().method() === 'PUT',
  );
  await page.getByRole('button', { name: cat(en, 'StudentWizard.saveChanges'), exact: true }).click();
  const put = await putPromise;
  expect(put.status(), await put.text()).toBe(200);

  await expect(page).toHaveURL(/\/dashboard\/children$/);
  await expect(page.getByText(cat(en, 'Children.updatedToast'))).toBeVisible();

  expect(errors, errors.join('\n')).toEqual([]);
});
