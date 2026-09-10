/**
 * Mission st-ops-onboarding — E2E flows 11, 12, 13, 14, 24, 27, 34 (task 317):
 * the heart of the journey. The invitation is sent through the REAL modal, the
 * statuses really change without a reload, the list really reflects them, the
 * contact really lands on the school row, the emailed magic link really opens
 * the onboarding wizard, and exactly one invitation exists.
 */
import { expect, test, type Page } from '@playwright/test';

import { cat, icu, loadMessages } from './helpers/i18n';
import {
  cleanupSchool,
  createProspectSchool,
  detailPath,
  type FixtureSchool,
} from './helpers/ops-onboarding';
import {
  activeLinkCount,
  linkStatuses,
  magicLinkFromEmail,
  schoolContact,
  schoolStatuses,
} from './helpers/ops-onboarding-db';
import { loginAs } from './helpers/roles';

const en = loadMessages('en');
const t = (key: string) => cat(en, `Ops.onboard.${key}`);

test.describe.configure({ mode: 'serial' });

const CONTACT = { first: 'Ada', last: 'Lovelace' };

let school: FixtureSchool;
let contactEmail: string;

test.beforeAll(async () => {
  const label = `send-${Date.now()}`;
  school = await createProspectSchool(label);
  contactEmail = `ops-send-${label}@example.au`;
});

test.afterAll(async () => {
  await cleanupSchool(school.documentId);
});

/** Fills and submits the real Onboard School modal. */
async function sendInvitation(page: Page): Promise<void> {
  await page.goto(detailPath(school.documentId));
  await page.getByRole('button', { name: t('button'), exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(t('firstName')).fill(CONTACT.first);
  await dialog.getByLabel(t('lastName')).fill(CONTACT.last);
  await dialog.getByLabel(t('email')).fill(contactEmail);
  await dialog.getByRole('button', { name: t('submit'), exact: true }).click();
}

test('flows 11, 12, 13: sending toasts the spec copy and both badges change without a reload', async ({
  page,
}) => {
  await loginAs(page, 'ops');

  // The precondition, proven in Postgres before anything is sent.
  expect(schoolStatuses(school.documentId)).toEqual({
    account: 'prospect',
    onboarding: 'not_started',
  });
  expect(linkStatuses(school.documentId)).toEqual([]);

  await sendInvitation(page);

  // Flow 11 — the spec's exact success copy, scoped to the TOAST. The panel's
  // invitation indicator renders a byte-identical string, so an unscoped text
  // query would pass even with the toast deleted.
  await expect(
    page.locator('[data-sonner-toast]').getByText(
      icu(t('successToast'), { email: contactEmail }),
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toBeHidden();

  // Flows 12 and 13 — the statuses update in place, with no manual reload.
  // The portal-lifecycle redesign (ops rows 10-11) renders the school's ONE
  // lifecycle pill in the hero, from the same mapping the list row uses: a
  // school whose owner invite is out but whose onboarding has not completed
  // reads "Pending setup". The onboarding chip stays beside it; the legacy
  // account-status chip renders nowhere on the page any more.
  await expect(
    page.getByText(cat(en, 'Ops.schools.portalStatus.pending_setup'), { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(cat(en, 'Ops.detail.onboardingStatus.link_sent'), { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(cat(en, 'Ops.detail.accountStatus.prospect'), { exact: true }),
  ).toHaveCount(0);

  // ...and the change is REAL, not local state.
  expect(schoolStatuses(school.documentId)).toEqual({
    account: 'invited',
    onboarding: 'link_sent',
  });
});

test('flow 24: the contact details are persisted on the school record', async () => {
  expect(schoolContact(school.documentId)).toBe(
    `${CONTACT.first}|${CONTACT.last}|${contactEmail}`,
  );
});

test('flow 34: exactly one active invitation exists, with no duplicate rows', async () => {
  expect(linkStatuses(school.documentId)).toEqual(['active']);
  expect(activeLinkCount(school.documentId)).toBe(1);
});

test('flow 14: the schools list reflects the invited school after navigating back', async ({
  page,
}) => {
  await loginAs(page, 'ops');
  await page.goto(detailPath(school.documentId));
  await page.getByRole('link', { name: cat(en, 'Ops.detail.backToSchools'), exact: true }).click();
  await page.waitForURL('**/dashboard/ops/schools');

  // The kit list is server-paginated (25/page over the 300+ seeded schools),
  // so the fixture row is only on screen once the server-side search narrows
  // the directory to it.
  const search = page.locator('[data-slot="directory-toolbar"] input[type="search"]');
  await search.fill(school.name);

  // The list row carries the same lifecycle pill the detail hero renders —
  // one status, one label, both surfaces (portal-lifecycle.lib).
  const row = page.getByRole('row').filter({ hasText: school.name });
  await row.scrollIntoViewIfNeeded();
  await expect(
    row.getByText(cat(en, 'Ops.schools.portalStatus.pending_setup'), { exact: true }),
  ).toBeVisible();

  // It survives a full reload — the list is reading the server, not a cache.
  // The search param survives in the URL state, so the filtered row re-renders.
  await page.reload();
  await search.fill(school.name);
  const reloaded = page.getByRole('row').filter({ hasText: school.name });
  await reloaded.scrollIntoViewIfNeeded();
  await expect(
    reloaded.getByText(cat(en, 'Ops.schools.portalStatus.pending_setup'), { exact: true }),
  ).toBeVisible();
});

test('flow 27: the emailed magic link authenticates the school admin into the onboarding flow', async ({
  page,
}) => {
  const link = await magicLinkFromEmail(contactEmail, 1);
  expect(link).toContain('/school-onboarding/');

  // A brand-new browser context would be ideal, but this page has never signed
  // in as anyone but ops — the link is the ONLY credential the wizard needs.
  // The email's absolute host is the mailer's configured WEB_APP_URL, which on
  // this stack still names the retired :3101; the token is the credential, so
  // the wizard is opened at the link's PATH on the app under test.
  const linkUrl = new URL(link);
  await page.goto(linkUrl.pathname + linkUrl.search);
  await expect(
    page.getByRole('heading', { name: cat(en, 'SchoolOnboarding.school.title') }),
  ).toBeVisible();
  await expect(page.getByLabel(cat(en, 'SchoolOnboarding.school.name'))).toHaveValue(school.name);
});
