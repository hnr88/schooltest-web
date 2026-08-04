/**
 * Mission st-ops-onboarding — E2E flows 15, 16, 17, 18, 26, 28 (task 318): the
 * Invitation Sent state and resend, including the rule that is easiest to get
 * wrong — "Previous magic link remains valid".
 */
import { expect, test, type Page } from '@playwright/test';

import { cat, icu, loadMessages } from './helpers/i18n';
import {
  cleanupSchool,
  createProspectSchool,
  detailPath,
  inviteViaApi,
  type FixtureSchool,
} from './helpers/ops-onboarding';
import { activeLinkCount, magicLinkFromEmail, messagesTo } from './helpers/ops-onboarding-db';
import { loginAs } from './helpers/roles';

const en = loadMessages('en');
const t = (key: string) => cat(en, `Ops.onboard.${key}`);

test.describe.configure({ mode: 'serial' });

let school: FixtureSchool;
let other: FixtureSchool;
let contactEmail: string;
let otherEmail: string;
let firstLink: string;

test.beforeAll(async () => {
  const label = `resend-${Date.now()}`;
  school = await createProspectSchool(label);
  other = await createProspectSchool(`${label}-b`);
  contactEmail = `ops-resend-${label}@example.au`;
  otherEmail = `ops-resend-${label}-b@example.au`;

  // The invitation itself is set up through the contract; the UI behaviour
  // AFTER it is what these flows exercise.
  const invited = await inviteViaApi(school.documentId, {
    first_name: 'Ada',
    last_name: 'Lovelace',
    contact_email: contactEmail,
  });
  expect(invited.status).toBe(201);
  firstLink = invited.body.data.url;
});

test.afterAll(async () => {
  await cleanupSchool(school.documentId);
  await cleanupSchool(other.documentId);
});

async function openDetail(page: Page, documentId: string) {
  await page.goto(detailPath(documentId));
  await expect(page.locator('[data-slot="ops-onboard-actions"]')).toBeVisible();
}

test('flows 15, 16, 28: at Invitation Sent the button is gone, replaced by the indicator with Resend and Revoke', async ({
  page,
}) => {
  await loginAs(page, 'ops');
  await openDetail(page, school.documentId);

  // Flow 15 / 28 — the Onboard School button is not offered at all.
  await expect(page.getByRole('button', { name: t('button'), exact: true })).toHaveCount(0);

  // ...and the status indicator names the contact the spec stored.
  const panel = page.locator('[data-slot="ops-onboard-actions"][data-invitation="sent"]');
  await expect(panel).toBeVisible();
  await expect(
    panel.getByText(icu(t('sentIndicator'), { email: contactEmail }), { exact: true }),
  ).toBeVisible();

  // Flow 16 — both post-invitation actions are offered.
  await expect(panel.getByRole('button', { name: t('resend'), exact: true })).toBeEnabled();
  await expect(panel.getByRole('button', { name: t('revoke'), exact: true })).toBeEnabled();

  // The badges agree with the state.
  await expect(
    page.getByText(cat(en, 'Ops.detail.accountStatus.invited'), { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(cat(en, 'Ops.detail.onboardingStatus.link_sent'), { exact: true }),
  ).toBeVisible();
});

test('flows 17, 18: Resend delivers a NEW magic link to the same contact, and the previous one still works', async ({
  page,
}) => {
  const before = (await messagesTo(contactEmail)).length;
  expect(before).toBeGreaterThanOrEqual(1);

  await loginAs(page, 'ops');
  await openDetail(page, school.documentId);
  await page.getByRole('button', { name: t('resend'), exact: true }).click();

  // Flow 17 — a second email really arrived, at the SAME address.
  await expect(
    page.locator('[data-sonner-toast]').getByText(
      icu(t('resendSuccess'), { email: contactEmail }),
      { exact: true },
    ),
  ).toBeVisible();
  const secondLink = await magicLinkFromEmail(contactEmail, before + 1);
  expect(secondLink).not.toBe(firstLink);
  expect(activeLinkCount(school.documentId), 'resend adds a link, it does not replace one').toBe(2);

  // Flow 18 — the spec: "Previous magic link remains valid".
  const wizardStepOne = cat(en, 'SchoolOnboarding.school.title');
  await page.goto(firstLink);
  await expect(page.getByRole('heading', { name: wizardStepOne })).toBeVisible();

  // And so does the new one.
  await page.goto(secondLink);
  await expect(page.getByRole('heading', { name: wizardStepOne })).toBeVisible();
});

test('flow 26: a second invited school keeps its own single active invitation', async ({ page }) => {
  const invited = await inviteViaApi(other.documentId, {
    first_name: 'Grace',
    last_name: 'Hopper',
    contact_email: otherEmail,
  });
  expect(invited.status).toBe(201);

  // Two invited schools, each with exactly one live invitation of its own.
  expect(activeLinkCount(other.documentId)).toBe(1);
  expect(activeLinkCount(school.documentId), 'the first school is untouched').toBe(2);

  await loginAs(page, 'ops');
  await openDetail(page, other.documentId);
  await expect(
    page
      .locator('[data-slot="ops-onboard-actions"]')
      .getByText(icu(t('sentIndicator'), { email: otherEmail }), { exact: true }),
  ).toBeVisible();

  // The other school's contact never bleeds across.
  await expect(page.getByText(contactEmail, { exact: false })).toHaveCount(0);
});
