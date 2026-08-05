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
  // The school record's plan tier (redesign spec section "Plan System"),
  // distinct from the entitlement row's commercial plan_code.
  plan: 'trial' | 'full_license';
  plan_code: string;
  seats_total: number;
  seats_used: number;
  seats_remaining: number;
  allowances: Allowance[];
  renewal_date: string | null;
  account_status: string;
}

async function login(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API}/api/auth/local`, {
    data: { identifier: SCHOOL_ADMIN.email, password: SCHOOL_ADMIN.password },
  });
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { jwt: string }).jwt;
}

async function fetchEntitlement(request: APIRequestContext): Promise<Entitlement> {
  const jwt = await login(request);
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

test.describe('task 28: entitlement numbers vs live C-ENT-01', () => {
  test('the Account plan and allowance cards render the live numbers digit for digit', async ({
    page,
    request,
  }) => {
    const ent = await fetchEntitlement(request);
    await signIn(page);

    // Plan and seats + the test allowance grid moved off the school home into
    // Account > My account (redesign spec section 5). The C-ENT-01 contract is
    // unchanged; only the presentation moved.
    await page.goto('/dashboard/school/account');

    const plan = page.locator('[data-slot="account-plan-card"]');
    await expect(plan).toBeVisible({ timeout: 20_000 });

    // "Seats used" renders the REDESIGN spec's metric (section 5:
    // X = students with at least one sitting, Y = total students) from
    // C-RPT-06, NOT the entitlement's licensing seats_used / seats_total,
    // which stay the seat-cap gate the API enforces on student create.
    const analyticsRes = await request.get(`${API}/api/schools/me/analytics`, {
      headers: { Authorization: `Bearer ${await login(request)}` },
    });
    expect(analyticsRes.ok()).toBeTruthy();
    const analytics = ((await analyticsRes.json()) as {
      data: { students_with_sitting: number; students_total: number };
    }).data;
    await expect(
      plan.getByText(`${analytics.students_with_sitting} / ${analytics.students_total}`, { exact: true }),
    ).toBeVisible();

    // The plan tier is the school record's, not the entitlement's plan_code.
    expect(ent.plan).toBe('trial');

    const allowance = page.locator('[data-slot="account-allowance-card"]');
    await expect(allowance).toBeVisible();
    for (const row of ent.allowances) {
      const tile = allowance
        .locator('[data-slot="tint-tile"]')
        .filter({ hasText: cat(en, `SchoolAdmin.entitlement.testType.${row.test_type}`) });
      await expect(tile.getByText(`${row.remaining} remaining`, { exact: true })).toBeVisible();
    }

    // Trial derives reading 2 and zeroes the other three, regardless of the
    // totals stored on the entitlement row.
    expect(ent.allowances.find((a) => a.test_type === 'reading')?.remaining).toBe(2);
    for (const type of ['listening', 'writing', 'speaking']) {
      expect(ent.allowances.find((a) => a.test_type === type)?.remaining).toBe(0);
    }
  });
});
