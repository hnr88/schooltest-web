import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';

// Task 28 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Signs in as the seeded school_admin, pulls C-ENT-01 directly from the API,
// and asserts the /dashboard/school entitlement panel renders those exact
// numbers (seats, plan, per-type allowances, renewal, seat-cap conditional).
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const SCHOOL_ADMIN = { email: 'schooladmin-a@schooltest.local', password: 'pEbjxVnJ4PPYiv8D!A1' };

interface Allowance {
  test_type: string;
  total: number;
  used: number;
  remaining: number;
}

interface Entitlement {
  plan_code: string;
  seats_total: number;
  seats_used: number;
  seats_remaining: number;
  allowances: Allowance[];
  renewal_date: string | null;
  account_status: string;
}

async function fetchEntitlement(request: APIRequestContext): Promise<Entitlement> {
  const login = await request.post(`${API}/api/auth/local`, {
    data: { identifier: SCHOOL_ADMIN.email, password: SCHOOL_ADMIN.password },
  });
  expect(login.ok()).toBeTruthy();
  const { jwt } = (await login.json()) as { jwt: string };
  const res = await request.get(`${API}/api/schools/me/entitlement`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { data: Entitlement };
  return body.data;
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(SCHOOL_ADMIN.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(SCHOOL_ADMIN.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL('**/dashboard/school', { timeout: 30_000 });
}

test.describe('task 28: school overview entitlement panel vs live C-ENT-01', () => {
  test('panel renders the live entitlement numbers digit for digit', async ({
    page,
    request,
  }) => {
    const ent = await fetchEntitlement(request);
    await signIn(page);

    const panel = page.locator('[data-slot="school-entitlement-panel"]');
    await expect(panel).toBeVisible({ timeout: 20_000 });

    // Seats: used/total headline plus remaining line.
    await expect(
      panel.getByText(`${ent.seats_used} of ${ent.seats_total} seats used`, { exact: true }),
    ).toBeVisible();
    const seatsRemainingText =
      ent.seats_remaining === 1
        ? `${ent.seats_remaining} seat remaining`
        : `${ent.seats_remaining} seats remaining`;
    await expect(panel.getByText(seatsRemainingText, { exact: true })).toBeVisible();

    // Seat-cap copy shows only when the school is at the cap.
    const capCopy = panel.getByText(cat(en, 'SchoolAdmin.entitlement.seatCapReached'), {
      exact: false,
    });
    if (ent.seats_remaining === 0) {
      await expect(capCopy).toBeVisible();
    } else {
      await expect(capCopy).toHaveCount(0);
    }

    // Plan code + renewal date (seeded school has no renewal date set).
    await expect(panel.getByText(ent.plan_code, { exact: true })).toBeVisible();
    if (ent.renewal_date === null) {
      await expect(
        panel.getByText(cat(en, 'SchoolAdmin.entitlement.renewalNotSet'), { exact: true }),
      ).toBeVisible();
    }

    // One row per allowance type with remaining + used/total from the API.
    for (const allowance of ent.allowances) {
      const typeName = cat(en, `SchoolAdmin.entitlement.testType.${allowance.test_type}`);
      const row = panel.getByRole('listitem').filter({ hasText: typeName });
      await expect(
        row.getByText(`${allowance.remaining} remaining`, { exact: true }),
      ).toBeVisible();
      await expect(
        row.getByText(`${allowance.used} of ${allowance.total} used`, { exact: true }),
      ).toBeVisible();
    }
  });
});
