/**
 * Mission st-ops-onboarding — E2E flows 6, 7, 8, 9, 10, 33 (task 316): the
 * Onboard School modal and its validation, driven through the real UI against
 * the running app. Cancelling is asserted in Postgres, not just visually.
 */
import { expect, test, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import {
  cleanupSchool,
  createProspectSchool,
  detailPath,
  inviteViaApi,
  revokeViaApi,
  type FixtureSchool,
} from './helpers/ops-onboarding';
import { linkStatuses, schoolContact, schoolStatuses } from './helpers/ops-onboarding-db';
import { loginAs } from './helpers/roles';

const en = loadMessages('en');
const t = (key: string) => cat(en, `Ops.onboard.${key}`);
const validation = (key: string) => cat(en, `Ops.onboard.validation.${key}`);

test.describe.configure({ mode: 'serial' });

let school: FixtureSchool;

test.beforeAll(async () => {
  school = await createProspectSchool(`modal-${Date.now()}`);
});

test.afterAll(async () => {
  await cleanupSchool(school.documentId);
});

/** Opens the detail page and the modal, returning the dialog locator. */
async function openModal(page: Page) {
  await page.goto(detailPath(school.documentId));
  await page.getByRole('button', { name: t('button'), exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
}

test('flow 6: the modal opens with exactly the first name, last name and email fields', async ({
  page,
}) => {
  await loginAs(page, 'ops');
  const dialog = await openModal(page);

  await expect(dialog.getByRole('heading', { name: t('dialogTitle') })).toBeVisible();
  // FieldShell renders the required marker inside the <label>, so the accessible
  // name is "<label> *" — these queries match by substring on purpose.
  await expect(dialog.getByLabel(t('firstName'))).toBeVisible();
  await expect(dialog.getByLabel(t('lastName'))).toBeVisible();
  await expect(dialog.getByLabel(t('email'))).toBeVisible();
  await expect(dialog.getByRole('button', { name: t('submit'), exact: true })).toBeVisible();

  // Exactly three inputs — no smuggled extra field.
  await expect(dialog.locator('input')).toHaveCount(3);
});

test('flow 7: submitting the empty modal raises a validation error on every required field', async ({
  page,
}) => {
  await loginAs(page, 'ops');
  const dialog = await openModal(page);

  await dialog.getByRole('button', { name: t('submit'), exact: true }).click();
  await expect(dialog.getByText(validation('required'), { exact: true })).toHaveCount(3);

  // Nothing was sent: the school is untouched.
  expect(schoolStatuses(school.documentId)).toEqual({
    account: 'prospect',
    onboarding: 'not_started',
  });
  expect(linkStatuses(school.documentId)).toEqual([]);
});

test('flow 8: first and last name only leaves the error on the empty email field', async ({
  page,
}) => {
  await loginAs(page, 'ops');
  const dialog = await openModal(page);

  await dialog.getByLabel(t('firstName')).fill('Ada');
  await dialog.getByLabel(t('lastName')).fill('Lovelace');
  await dialog.getByRole('button', { name: t('submit'), exact: true }).click();

  const errors = dialog.getByText(validation('required'), { exact: true });
  await expect(errors).toHaveCount(1);
  // The one remaining error belongs to the email field, via aria-describedby.
  const describedBy = await dialog
    .getByLabel(t('email'))
    .getAttribute('aria-describedby');
  expect(describedBy).toBeTruthy();
  await expect(dialog.locator(`#${describedBy}`)).toHaveText(validation('required'));

  expect(linkStatuses(school.documentId)).toEqual([]);
});

test('flow 9: a malformed email address is refused with the email validation message', async ({
  page,
}) => {
  await loginAs(page, 'ops');
  const dialog = await openModal(page);

  await dialog.getByLabel(t('firstName')).fill('Ada');
  await dialog.getByLabel(t('lastName')).fill('Lovelace');
  await dialog.getByLabel(t('email')).fill('not-an-email');
  await dialog.getByRole('button', { name: t('submit'), exact: true }).click();

  await expect(dialog.getByText(validation('emailInvalid'), { exact: true })).toBeVisible();
  await expect(dialog).toBeVisible();
  expect(linkStatuses(school.documentId)).toEqual([]);
});

test('flow 10: with valid data the CTA is enabled and carries no validation errors', async ({
  page,
}) => {
  await loginAs(page, 'ops');
  const dialog = await openModal(page);

  await dialog.getByLabel(t('firstName')).fill('Ada');
  await dialog.getByLabel(t('lastName')).fill('Lovelace');
  await dialog.getByLabel(t('email')).fill('ada.lovelace@example.au');

  const cta = dialog.getByRole('button', { name: t('submit'), exact: true });
  await expect(cta).toBeEnabled();
  await expect(dialog.getByText(validation('required'), { exact: true })).toHaveCount(0);
  await expect(dialog.getByText(validation('emailInvalid'), { exact: true })).toHaveCount(0);

  // Deliberately NOT submitted — flow 33 closes it and proves nothing changed.
});

test('flow 33: cancelling the modal sends nothing and changes no status', async ({ page }) => {
  await loginAs(page, 'ops');
  const dialog = await openModal(page);

  await dialog.getByLabel(t('firstName')).fill('Grace');
  await dialog.getByLabel(t('lastName')).fill('Hopper');
  await dialog.getByLabel(t('email')).fill('grace.hopper@example.au');
  await dialog.getByRole('button', { name: t('cancel'), exact: true }).click();
  await expect(dialog).toBeHidden();

  // Real proof, not a visual one: no link row, no status change, no contact.
  expect(linkStatuses(school.documentId)).toEqual([]);
  expect(schoolStatuses(school.documentId)).toEqual({
    account: 'prospect',
    onboarding: 'not_started',
  });

  // And the button is back, still offering to onboard.
  await expect(page.getByRole('button', { name: t('button'), exact: true })).toBeEnabled();

  // Reopening starts clean — the cancelled draft is not retained.
  const reopened = await openModal(page);
  await expect(reopened.getByLabel(t('firstName'))).toHaveValue('');
  await expect(reopened.getByLabel(t('email'))).toHaveValue('');
});

test('the 409 lands inline on the form, not in a toast', async ({ page }) => {
  // A race the ops user can really hit: they open the modal, someone else (or
  // another tab) invites the same school, then they submit.
  await loginAs(page, 'ops');
  const dialog = await openModal(page);
  await dialog.getByLabel(t('firstName')).fill('Ada');
  await dialog.getByLabel(t('lastName')).fill('Lovelace');
  await dialog.getByLabel(t('email')).fill('ada.inline@example.au');

  const raced = await inviteViaApi(school.documentId, {
    first_name: 'Grace',
    last_name: 'Hopper',
    contact_email: 'grace.raced@example.au',
  });
  expect(raced.status, 'the racing invite wins').toBe(201);

  try {
    await dialog.getByRole('button', { name: t('submit'), exact: true }).click();

    // Inline on the email field — the ops user has to revoke first, so a toast
    // that vanishes would be the wrong place for it.
    await expect(dialog.getByText(t('conflict'), { exact: true })).toBeVisible();
    await expect(dialog, 'the modal stays open so the message is readable').toBeVisible();

    // The racing invitation is untouched: still exactly one link, and still
    // GRACE's contact — a 409 that nonetheless overwrote the stored contact
    // would otherwise slip through.
    expect(linkStatuses(school.documentId)).toEqual(['active']);
    expect(schoolContact(school.documentId)).toBe('Grace|Hopper|grace.raced@example.au');
  } finally {
    await dialog.getByRole('button', { name: t('cancel'), exact: true }).click();
    await revokeViaApi(school.documentId);
  }
});
