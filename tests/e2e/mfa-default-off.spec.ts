import { expect, test } from '@playwright/test';

import { loginAs } from './helpers/roles';

// W3-20 (D3 MFA-3) — MFA step-up is DEFAULT OFF. With no role in the API's
// MFA_ENFORCED_ROLES, an ops user signs in through the real form, the ops
// dashboard renders, no "Verify your identity" dialog appears and the web
// issues NO request under /api/auth/mfa/. Requests are OBSERVED with
// page.on('request'); nothing is routed, mocked or intercepted.
//
// The enforced path (403 MFA_REQUIRED -> dialog -> verify -> step-up JWT)
// needs MFA_ENFORCED_ROLES set on the API, which is operator-owned env: it is
// exercised on staging after deploy, and by tests/unit/mfa-step-up.test.tsx.

test.describe('MFA step-up default OFF (W3-20)', () => {
  test('an ops user reaches the dashboard with no step-up dialog and no MFA request', async ({
    page,
  }) => {
    const mfaRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/auth/mfa/')) mfaRequests.push(request.url());
    });

    await loginAs(page, 'ops');
    await page.goto('/dashboard/ops/schools');
    await expect(page.locator('[data-slot="dashboard-content"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-slot="ops-session-expired"]')).toHaveCount(0);
    await expect(page.locator('[data-slot="mfa-step-up"]')).toHaveCount(0);

    // Let the page's own reads settle before asserting the negative.
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
    await expect(page.locator('[data-slot="mfa-step-up"]')).toHaveCount(0);
    expect(mfaRequests).toEqual([]);
  });
});
