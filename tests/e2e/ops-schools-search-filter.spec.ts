import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { apiEnv, runSql } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';
// SPEC-schools-search-filter.md — the ops schools search + filter band, driven
// against the REAL portal, the REAL Strapi C-OPS-01 and the REAL Postgres.
// Nothing is fixtured: the expected school list is read live from /api/ops/schools
// with an ops JWT and the total is cross-checked against public.schools.
// ⚠️ The filters expose every enum value (6 account statuses, 5 onboarding
// states), not the spec's 3 — see the flag in schools-filter.lib.ts.
const en = loadMessages('en');
const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:5500';

interface ApiSchool {
  documentId: string;
  name: string;
  account_status: string;
}

async function opsSchools(request: APIRequestContext): Promise<ApiSchool[]> {
  const login = await request.post(`${API}/api/auth/local`, {
    data: {
      identifier: 'apiadmin@schooltest.local',
      password: apiEnv('SEED_APIADMIN_PASSWORD'),
    },
  });
  expect(login.ok()).toBeTruthy();
  const { jwt } = (await login.json()) as { jwt: string };
  const res = await request.get(`${API}/api/ops/schools`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { data: ApiSchool[] };
  return body.data;
}

async function signInAsOps(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page
    .getByLabel(cat(en, 'Auth.emailLabel'), { exact: true })
    .fill('apiadmin@schooltest.local');
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(apiEnv('SEED_APIADMIN_PASSWORD'));
  await page
    .getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true })
    .click();
  await page.waitForURL('**/dashboard');
}

function visibleSchoolNames(page: Page) {
  return page
    .getByRole('table')
    .getByRole('link')
    .allInnerTexts();
}

test.describe('ops schools search + filter (SPEC-schools-search-filter)', () => {
  test('counts match the DB, search filters and persists in the URL, filters compose, clear restores', async ({
    page,
    request,
  }) => {
    const schools = await opsSchools(request);
    expect(schools.length).toBeGreaterThan(0);

    // DB-side proof: the table total is the real row count, not a fixture.
    const dbCount = Number(runSql('select count(*) from schools'));
    expect(dbCount).toBe(schools.length);

    await signInAsOps(page);
    await page.goto('/en/dashboard/ops/schools');

    const status = page.getByRole('status');

    // §4: unfiltered count shows every school.
    await expect(status).toContainText(
      new RegExp(`of ${schools.length} schools`),
    );
    expect(await page.getByRole('table').getByRole('link').count()).toBe(
      schools.length,
    );

    // §1: search narrows to the name substring, live in the URL.
    const needle = schools[0].name.split(' ')[0].toLowerCase();
    const matches = schools.filter((school) =>
      school.name.toLowerCase().includes(needle),
    );
    await page
      .getByLabel(cat(en, 'Ops.schools.searchLabel'), { exact: true })
      .fill(needle);
    await expect(status).toContainText(
      new RegExp(`${matches.length} of ${schools.length}`),
    );
    await expect(page).toHaveURL(new RegExp(`[?&]q=${needle}`));
    expect(await page.getByRole('table').getByRole('link').count()).toBe(
      matches.length,
    );

    // §3: reload — the URL carries the state.
    await page.reload();
    await expect(
      page.getByLabel(cat(en, 'Ops.schools.searchLabel'), { exact: true }),
    ).toHaveValue(needle);
    await expect(status).toContainText(
      new RegExp(`${matches.length} of ${schools.length}`),
    );

    // §2: the account-status filter ANDs with the search (every enum value is
    // reachable — the flagged 6-value reconciliation).
    const wanted = schools[0].account_status;
    const statusMatches = matches.filter(
      (school) => school.account_status === wanted,
    );
    await page
      .getByRole('combobox', {
        name: new RegExp(`^${cat(en, 'Ops.schools.filterAccountStatus')}`),
      })
      .click();
    await page.getByRole('option', { name: cat(en, `Ops.schools.accountStatus.${wanted}`) }).click();
    await expect(status).toContainText(
      new RegExp(`${statusMatches.length} of ${schools.length}`),
    );
    await expect(page).toHaveURL(new RegExp(`[?&]status=${wanted}`));

    // §5: no-match search shows the empty state, not a blank table.
    await page
      .getByLabel(cat(en, 'Ops.schools.searchLabel'), { exact: true })
      .fill('zzz-no-such-school-zzz');
    await expect(
      page.getByText(cat(en, 'Ops.schools.noMatches')),
    ).toBeVisible();

    // Clear all: full list, URL params gone.
    await page
      .getByRole('button', { name: cat(en, 'Ops.schools.clearFilters') })
      .click();
    await expect(status).toContainText(
      new RegExp(`${schools.length} of ${schools.length}`),
    );
    await expect(page).not.toHaveURL(/q=|status=/);
  });
});
