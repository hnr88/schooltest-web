import { expect, test } from '@playwright/test';

import { loginAs } from './helpers/roles';

// W3-22 (D3 MFA-3) — the MFA enrolment panel is DEFAULT OFF. With no role in
// the API's MFA_ENFORCED_ROLES / MFA_OPTIONAL_ROLES (and no MFA_SECRET_KEY),
// GET /api/auth/mfa/status answers `available: false`: an ops user opens
// /dashboard/ops/settings, the account card renders, the MFA panel is absent
// and that single status read is the only request under /api/auth/mfa/.
// Requests and responses are OBSERVED with page.on; nothing is routed, mocked
// or intercepted.
//
// Live enrolment needs the API's MFA env (operator-owned): it is proven by the
// W3-14/W3-20 unit specs and tests/unit/mfa-enrol-panel.test.tsx, and is
// exercised on staging after deploy. This spec makes no claim about it.

test.describe('MFA enrolment panel default OFF (W3-22)', () => {
  test('ops settings shows the account card, no MFA panel and one status read', async ({
    page,
  }) => {
    const statusRequests: string[] = [];
    const otherMfaRequests: string[] = [];
    const statusBodies: Promise<unknown>[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (!url.includes('/api/auth/mfa/')) return;
      if (request.method() === 'GET' && url.includes('/api/auth/mfa/status')) {
        statusRequests.push(url);
      } else {
        otherMfaRequests.push(`${request.method()} ${url}`);
      }
    });
    page.on('response', (response) => {
      if (response.url().includes('/api/auth/mfa/status') && response.request().method() === 'GET') {
        statusBodies.push(response.json().catch(() => null));
      }
    });

    await loginAs(page, 'ops');
    await page.goto('/dashboard/ops/settings');
    await expect(page.locator('[data-slot="ops-account-card"]')).toBeVisible({ timeout: 60_000 });

    // Let the page's own reads settle before asserting the negatives.
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);

    await expect(page.locator('[data-slot="mfa-enrol-panel"]')).toHaveCount(0);
    await expect(page.locator('[data-slot="mfa-step-up"]')).toHaveCount(0);

    expect(statusRequests).toHaveLength(1);
    expect(otherMfaRequests).toEqual([]);
    const bodies = (await Promise.all(statusBodies)) as Array<{ available?: boolean } | null>;
    expect(bodies).toHaveLength(1);
    expect(bodies[0]?.available).toBe(false);
  });
});
