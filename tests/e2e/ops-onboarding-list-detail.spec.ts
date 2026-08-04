/**
 * Mission st-ops-onboarding — E2E flows 1, 2, 3, 4, 5, 25, 30, 31, 32, 35
 * (task 315): the entry surface of the OPS School Onboarding journey.
 *
 * Everything is real: a genuine ops sign-in through the app's own form, the
 * running Next app on :3101 reading the running Strapi, and Postgres for the
 * persistence assertions. Fixture schools are created and removed through the
 * real ops contract (D-41).
 */
import { expect, test } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { cleanupSchool, createProspectSchool, detailPath } from './helpers/ops-onboarding';
import { schoolStatuses } from './helpers/ops-onboarding-db';
import { runSql } from './helpers/auth-db';
import { loginAs } from './helpers/roles';

const en = loadMessages('en');

test.describe.configure({ mode: 'serial' });

test('flow 1: ops sign-in lands on Schools by default, with the seven contracted columns', async ({
  page,
}) => {
  await loginAs(page, 'ops');
  await page.goto('/dashboard/ops');
  await page.waitForURL('**/dashboard/ops/schools');

  const headers = page.locator('table thead th');
  await expect(headers).toHaveText([
    cat(en, 'Ops.schools.columnName'),
    cat(en, 'Ops.schools.columnAccountStatus'),
    cat(en, 'Ops.schools.columnOnboarding'),
    cat(en, 'Ops.schools.columnTeachers'),
    cat(en, 'Ops.schools.columnClasses'),
    cat(en, 'Ops.schools.columnStudents'),
    cat(en, 'Ops.schools.columnResults'),
  ]);
});

test('flow 2: the prospect cohort reads Prospect / Not started, and no school is Invited without a live invitation', async ({
  page,
}) => {
  // Scoped honestly (D-42): the spec's "all schools" assumes a FRESH dataset.
  // This dev database also holds real rows from earlier missions at other
  // lifecycle states, so the assertion is the 300+ prospect cohort plus the
  // invariant that `invited` never exists without a backing active link.
  const prospectRows = Number(
    runSql(
      "select count(*) from schools where account_status = 'prospect' and onboarding_status = 'not_started'",
    ).trim(),
  );
  expect(prospectRows, 'the seeded prospect cohort').toBeGreaterThanOrEqual(300);

  // The invariant is scoped to the state it actually governs: the ops-facing
  // "Invited / Invitation sent" pair must never be a lie. A school whose admin
  // has since STARTED onboarding legitimately sits at invited with its link
  // consumed — account_status only leaves `invited` through the separate
  // onboarding journey or the ops activate action (D-38).
  const lyingRows = Number(
    runSql(
      `select count(*) from schools s
         where s.account_status = 'invited'
           and s.onboarding_status = 'link_sent'
           and not exists (
             select 1 from school_onboardings so
               join school_onboardings_school_lnk l on l.school_onboarding_id = so.id
              where l.school_id = s.id and so.status = 'active')`,
    ).trim(),
  );
  expect(lyingRows, 'Invited / Invitation sent always has a live magic link behind it').toBe(0);

  await loginAs(page, 'ops');
  await page.goto('/dashboard/ops/schools');
  const prospectCells = page.getByRole('cell', {
    name: cat(en, 'Ops.schools.accountStatus.prospect'),
    exact: true,
  });
  await expect(prospectCells.first()).toBeVisible();
  expect(await prospectCells.count()).toBeGreaterThanOrEqual(300);

  const notStarted = page.getByRole('cell', {
    name: cat(en, 'Ops.schools.onboardingStatus.not_started'),
    exact: true,
  });
  expect(await notStarted.count()).toBeGreaterThanOrEqual(300);
});

test('flow 25: the list renders every school, and the last row is reachable by scrolling', async ({
  page,
}) => {
  const total = Number(runSql('select count(*) from schools').trim());
  expect(total, 'the seeded directory').toBeGreaterThanOrEqual(300);

  await loginAs(page, 'ops');
  await page.goto('/dashboard/ops/schools');
  const rows = page.locator('table tbody tr');
  await expect(rows.first()).toBeVisible();
  await expect(rows).toHaveCount(total);

  const lastRow = rows.last();
  await lastRow.scrollIntoViewIfNeeded();
  await expect(lastRow).toBeVisible();
});

test('flows 3, 4, 5, 30, 31, 32: a row click reaches the detail page with badges, zero counts, an enabled button and the three ops sections', async ({
  page,
}) => {
  const school = await createProspectSchool(`detail-${Date.now()}`);
  try {
    expect(schoolStatuses(school.documentId)).toEqual({
      account: 'prospect',
      onboarding: 'not_started',
    });

    await loginAs(page, 'ops');
    await page.goto('/dashboard/ops/schools');

    // Flow 3: click the row itself, not a deep link.
    const link = page.getByRole('link', { name: school.name, exact: true });
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await page.waitForURL(`**${detailPath(school.documentId)}`);

    await expect(page.getByRole('heading', { name: school.name, level: 1 })).toBeVisible();
    await expect(
      page.getByText(cat(en, 'Ops.detail.accountStatus.prospect'), { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(cat(en, 'Ops.detail.onboardingStatus.not_started'), { exact: true }),
    ).toBeVisible();

    // Flow 4: a brand-new prospect school counts zero of everything.
    for (const label of ['teachersLabel', 'classesLabel', 'studentsLabel', 'resultsLabel']) {
      const term = page.getByText(cat(en, `Ops.detail.${label}`), { exact: true });
      await expect(term).toBeVisible();
      await expect(term.locator('xpath=following-sibling::dd[1]')).toHaveText('0');
    }

    // Flow 5: the Onboard School button is present and enabled at Not started.
    const button = page.getByRole('button', { name: cat(en, 'Ops.onboard.button'), exact: true });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();

    // Flows 30, 31, 32: the pre-existing ops sections are still on the page,
    // asserted by their own surface markers AND their catalogue headings.
    await expect(page.locator('[data-surface="ops-form-window"]')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: cat(en, 'Ops.window.title'), level: 2 }),
    ).toBeVisible();
    await expect(page.locator('[data-slot="ops-sitting-recovery"]')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: cat(en, 'Ops.recovery.title'), level: 2 }),
    ).toBeVisible();
    await expect(page.locator('[data-surface="ops-student-import"]')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: cat(en, 'Ops.import.title'), level: 2 }),
    ).toBeVisible();
  } finally {
    await cleanupSchool(school.documentId);
  }
});

test('flow 35: a school whose name carries special characters renders correctly end to end', async ({
  page,
}) => {
  const label = `special-${Date.now()}`;
  // Apostrophes, an ampersand, a hyphen, parentheses and an accent — the shapes
  // real Australian school names actually carry.
  const name = `St Mary's & Saint-Joseph's Coll\u00e8ge (K-12) ${label}`;
  const school = await createProspectSchool(label, name);
  try {
    await loginAs(page, 'ops');
    await page.goto(detailPath(school.documentId));

    // The heading carries the raw characters — no HTML entity leakage.
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveText(name);

    const button = page.getByRole('button', { name: cat(en, 'Ops.onboard.button'), exact: true });
    await expect(button).toBeEnabled();

    await page.goto('/dashboard/ops/schools');
    const link = page.getByRole('link', { name, exact: true });
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
  } finally {
    await cleanupSchool(school.documentId);
  }
});
