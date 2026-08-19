import { expect, test } from '@playwright/test';

import { API, schoolAdminJwt } from './helpers/class-detail';
import { loginCached } from './helpers/http';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs, ROLE_CREDENTIALS } from './helpers/roles';

/**
 * Mission task 205 — the browser pass that turns records 200 (analytics cards)
 * and 202 (account page) from source-level verification into runtime evidence.
 *
 * EVERY expected string is DERIVED IN-RUN from the live C-RPT-06 / C-SCH-01 /
 * C-ENT-01 payloads (fetched with the same school_admin JWT the browser session
 * holds) — no figure was captured by hand and frozen here. The datastore
 * corroboration for the one populated figure at authoring time (DB: school A
 * has exactly one distinct closed reading form, RDG-DIAG-A-79) lives in the
 * task record, not in this file.
 *
 * MOCK label: DOES NOT APPLY — schooltest-web has no mock transport; every
 * number below travels live API -> card. (Stated per the evidence rules.)
 *
 * Sign-in discipline: one UI login (paced via loginAs) + one cached API login.
 * Run with E2E_PORT=3000 --workers=1.
 */
test.describe('task 200 — school analytics cards render the C-RPT-06 payload', () => {
  test('every card value matches the live payload the endpoint just returned', async ({ page, request }) => {
    const en = loadMessages('en');
    const jwt = await schoolAdminJwt(request);
    const res = await request.get(`${API}/api/schools/me/analytics`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status(), 'C-RPT-06 reachable').toBe(200);
    const payload = (await res.json()) as {
      data: {
        students_tested: number;
        avg_reading_level: string | null;
        reading_tests_completed: number;
        reading_tests_allowed: number;
        reading_progress: string | null;
        next_test_window: string | null;
        students_total: number;
        students_with_sitting: number;
      };
    };
    const summary = payload.data;

    await loginAs(page, 'schoolAdmin');
    await page.goto('/dashboard/school');

    // Each card is located by its LABEL and asserted on its VALUE — a card that
    // rendered the wrong page's shell cannot satisfy this.
    const noValue = cat(en, 'SchoolAdmin.home.noValue');
    const cardValue = async (label: string) => {
      const card = page.locator('[data-slot="metric-card"]', { hasText: label }).first();
      await expect(card).toBeVisible();
      return card;
    };

    // Diagnostics section (spec §1): Students tested / Avg. reading level /
    // Reading tests completed X / allowance.
    const tested = await cardValue(cat(en, 'SchoolAdmin.home.studentsTested'));
    await expect(tested).toContainText(String(summary.students_tested), { useInnerText: true });

    const avgLevel = await cardValue(cat(en, 'SchoolAdmin.home.avgReadingLevel'));
    await expect(avgLevel).toContainText(
      summary.avg_reading_level === null ? noValue : summary.avg_reading_level,
      { useInnerText: true },
    );

    const completed = await cardValue(cat(en, 'SchoolAdmin.home.readingTestsCompleted'));
    await expect(completed).toContainText(
      `${summary.reading_tests_completed} / ${summary.reading_tests_allowed}`,
      { useInnerText: true },
    );

    // Progress section (spec §1): Reading progress / Tests this cycle / Next
    // test window. The window renders as a FORMATTED DATE (d MMM yyyy) — the
    // assertion derives it from the payload instant with the same format.
    const progress = await cardValue(cat(en, 'SchoolAdmin.home.readingProgress'));
    await expect(progress).toContainText(
      summary.reading_progress === null ? noValue : summary.reading_progress,
      { useInnerText: true },
    );

    const thisCycle = await cardValue(cat(en, 'SchoolAdmin.home.testsThisCycle'));
    await expect(thisCycle).toContainText(String(summary.reading_tests_allowed), { useInnerText: true });

    const window = await cardValue(cat(en, 'SchoolAdmin.home.nextTestWindow'));
    const expectedWindow =
      summary.next_test_window === null
        ? noValue
        : new Date(summary.next_test_window).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
    await expect(window).toContainText(expectedWindow, { useInnerText: true });
  });
});

test.describe('task 202 — account page renders C-SCH-01 + C-ENT-01 + the seat pair', () => {
  test('school details, plan, seats and allowance tiles match the live payloads', async ({ page, request }) => {
    const en = loadMessages('en');
    const jwt = await schoolAdminJwt(request);

    const [schoolRes, entitlementRes, analyticsRes] = await Promise.all([
      request.get(`${API}/api/schools/me`, { headers: { Authorization: `Bearer ${jwt}` } }),
      request.get(`${API}/api/schools/me/entitlement`, { headers: { Authorization: `Bearer ${jwt}` } }),
      request.get(`${API}/api/schools/me/analytics`, { headers: { Authorization: `Bearer ${jwt}` } }),
    ]);
    expect(schoolRes.status()).toBe(200);
    expect(entitlementRes.status()).toBe(200);
    expect(analyticsRes.status()).toBe(200);

    const schoolBody = (await schoolRes.json()) as {
      data: { name: string; suburb: string | null; state: string | null; postcode: string | null; account_status: string; onboarding_status: string };
    };
    const school = schoolBody.data;
    const entitlementBody = (await entitlementRes.json()) as {
      data: { plan: string; renewal_date: string | null; allowances: Array<{ test_type: string; remaining: number }> };
    };
    const entitlement = entitlementBody.data;
    const analyticsBody = (await analyticsRes.json()) as {
      data: { students_total: number; students_with_sitting: number };
    };
    const analytics = analyticsBody.data;

    await loginAs(page, 'schoolAdmin');
    await page.goto('/dashboard/school/account');

    const body = page.locator('main[data-slot="school-account"]');
    await expect(body).toBeVisible();

    // School details card: name; Location falls to "Not set" when the record
    // has no parts (derived, not assumed); admin email is the signed-in user's.
    const notSet = cat(en, 'SchoolAdmin.account.notSet');
    await expect(body).toContainText(school.name);
    const location = [school.suburb, school.state, school.postcode]
      .filter((part): part is string => Boolean(part))
      .join(' ');
    await expect(page.locator('[data-slot="account-details-card"]')).toContainText(
      location === '' ? notSet : location,
    );
    await expect(page.locator('[data-slot="account-details-card"]')).toContainText(
      ROLE_CREDENTIALS.schoolAdmin.email,
    );

    // Plan card: the plan label, the spec's seat pair (C-RPT-06
    // students_with_sitting / students_total — NOT the licensing seats), and
    // the renewal fallback.
    const planCard = page.locator('[data-slot="account-plan-card"]');
    await expect(planCard).toContainText(cat(en, `SchoolAdmin.account.plan.${entitlement.plan}`));
    await expect(planCard).toContainText(
      `${analytics.students_with_sitting} / ${analytics.students_total}`,
      { useInnerText: true },
    );
    await expect(planCard).toContainText(
      entitlement.renewal_date === null
        ? cat(en, 'SchoolAdmin.entitlement.renewalNotSet')
        : entitlement.renewal_date,
    );
    await expect(planCard).toContainText(cat(en, 'SchoolAdmin.account.fullLicenseLabel'));
    await expect(planCard).toContainText(cat(en, 'SchoolAdmin.account.fullLicenseContact'));

    // Test allowance card: one tile per payload allowance, each showing the
    // payload's own remaining count.
    const allowanceCard = page.locator('[data-slot="account-allowance-card"]');
    await expect(allowanceCard).toBeVisible();
    for (const allowance of entitlement.allowances) {
      const tile = allowanceCard
        .locator('[data-slot="tint-tile"]')
        .filter({ hasText: cat(en, `SchoolAdmin.entitlement.testType.${allowance.test_type}`) })
        .first();
      await expect(tile).toBeVisible();
      await expect(tile).toContainText(`${allowance.remaining} remaining`, { useInnerText: true });
    }
  });
});
