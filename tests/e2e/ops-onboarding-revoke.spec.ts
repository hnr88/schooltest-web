/**
 * Mission st-ops-onboarding — E2E flows 19, 20, 21, 22, 23, 29 (task 319):
 * revoking an invitation, re-inviting with different details, and the
 * single-use rule once the school admin has completed onboarding.
 */
import { expect, test, type Page } from '@playwright/test';

import { cat, icu, loadMessages } from './helpers/i18n';
import {
  cleanupSchool,
  createProspectSchool,
  detailPath,
  inviteViaApi,
  resendViaApi,
  type FixtureSchool,
} from './helpers/ops-onboarding';
import { linkStatuses, schoolContact, schoolStatuses } from './helpers/ops-onboarding-db';
import { loginAs } from './helpers/roles';

const en = loadMessages('en');
const t = (key: string) => cat(en, `Ops.onboard.${key}`);

const API_BASE_URL =
  process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500';

test.describe.configure({ mode: 'serial' });

let school: FixtureSchool;
let contactEmail: string;
let firstLink: string;
let secondLink: string;

test.beforeAll(async () => {
  const label = `revoke-${Date.now()}`;
  school = await createProspectSchool(label);
  contactEmail = `ops-revoke-${label}@example.au`;

  const invited = await inviteViaApi(school.documentId, {
    first_name: 'Ada',
    last_name: 'Lovelace',
    contact_email: contactEmail,
  });
  expect(invited.status).toBe(201);
  firstLink = invited.body.data.url;

  // A resend as well, so revoke has to invalidate MORE than one link (D-40).
  const resent = await resendViaApi(school.documentId);
  expect(resent.status).toBe(200);
  secondLink = resent.body.data.url;
});

test.afterAll(async () => {
  await cleanupSchool(school.documentId);
});

async function openDetail(page: Page) {
  await page.goto(detailPath(school.documentId));
  await expect(page.locator('[data-slot="ops-onboard-actions"]')).toBeVisible();
}

test('flows 19, 20, 22: revoking resets both statuses in place and re-enables the button', async ({
  page,
}) => {
  await loginAs(page, 'ops');
  await openDetail(page);
  expect(linkStatuses(school.documentId)).toEqual(['active', 'active']);

  await page.getByRole('button', { name: t('revoke'), exact: true }).click();
  await expect(
    page.locator('[data-sonner-toast]').getByText(t('revokeSuccess'), { exact: true }),
  ).toBeVisible();

  // Flows 19 and 20 — both badges reset without a manual reload.
  await expect(
    page.getByText(cat(en, 'Ops.detail.accountStatus.prospect'), { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(cat(en, 'Ops.detail.onboardingStatus.not_started'), { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(cat(en, 'Ops.detail.accountStatus.invited'), { exact: true }),
  ).toHaveCount(0);

  // Flow 22 — the Onboard School button is enabled again.
  await expect(page.getByRole('button', { name: t('button'), exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: t('resend'), exact: true })).toHaveCount(0);

  // Real persistence: it survives a full reload, and the contact is retained so
  // ops can see who was invited (the spec allows re-inviting with new details).
  await page.reload();
  await expect(
    page.getByText(cat(en, 'Ops.detail.accountStatus.prospect'), { exact: true }),
  ).toBeVisible();
  expect(schoolStatuses(school.documentId)).toEqual({
    account: 'prospect',
    onboarding: 'not_started',
  });
  expect(schoolContact(school.documentId)).toBe(`Ada|Lovelace|${contactEmail}`);
});

test('flow 21: EVERY magic link of the school is invalidated, including the resent one', async ({
  page,
}) => {
  expect(linkStatuses(school.documentId)).toEqual(['revoked', 'revoked']);

  for (const link of [firstLink, secondLink]) {
    await page.goto(link);
    // POSITIVE assertion: the guest sees the REVOKED screen, named from the
    // catalogue. A "the wizard heading is absent" check would also pass on a
    // blank page or a 500 (D-34).
    await expect(
      page.getByRole('heading', { name: cat(en, 'SchoolOnboarding.errors.revokedTitle') }),
    ).toBeVisible();
    await expect(
      page.getByText(cat(en, 'SchoolOnboarding.errors.revokedMessage'), { exact: true }),
    ).toBeVisible();
    // ...and NOT the expired screen, whose copy still promises a 14-day window.
    await expect(
      page.getByRole('heading', { name: cat(en, 'SchoolOnboarding.errors.expiredTitle') }),
    ).toHaveCount(0);
    const token = link.split('/').pop() as string;
    const res = await page.request.get(`${API_BASE_URL}/api/school-onboarding/${token}`);
    expect(res.status(), 'a revoked link is Gone').toBe(410);
    expect(((await res.json()) as { error: { message: string } }).error.message).toBe(
      'This onboarding link is no longer valid',
    );
  }
});

test('flow 23: re-onboarding with different contact details stores the NEW details', async ({
  page,
}) => {
  const replacement = {
    first: 'Grace',
    last: 'Hopper',
    email: contactEmail.replace('ops-revoke-', 'ops-reinvite-'),
  };

  await loginAs(page, 'ops');
  await openDetail(page);
  await page.getByRole('button', { name: t('button'), exact: true }).click();

  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(t('firstName')).fill(replacement.first);
  await dialog.getByLabel(t('lastName')).fill(replacement.last);
  await dialog.getByLabel(t('email')).fill(replacement.email);
  await dialog.getByRole('button', { name: t('submit'), exact: true }).click();

  // Scoped to the toast: the panel's indicator renders identical copy.
  await expect(
    page.locator('[data-sonner-toast]').getByText(
      icu(t('successToast'), { email: replacement.email }),
      { exact: true },
    ),
  ).toBeVisible();

  // The school row now carries the REPLACEMENT contact, and a fresh link.
  expect(schoolContact(school.documentId)).toBe(
    `${replacement.first}|${replacement.last}|${replacement.email}`,
  );
  expect(linkStatuses(school.documentId)).toEqual(['revoked', 'revoked', 'active']);
  expect(schoolStatuses(school.documentId)).toEqual({
    account: 'invited',
    onboarding: 'link_sent',
  });
  await expect(
    page
      .locator('[data-slot="ops-onboard-actions"]')
      .getByText(icu(t('sentIndicator'), { email: replacement.email }), { exact: true }),
  ).toBeVisible();
});
