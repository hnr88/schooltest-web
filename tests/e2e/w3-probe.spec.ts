import { expect, test } from '@playwright/test';

import { schoolAdminJwt } from './helpers/class-detail';
import { ROLE_CREDENTIALS, loginAs } from './helpers/roles';

const API = 'http://127.0.0.1:5500';

// THROWAWAY W3 diagnostic — dump the empty-state action markup.
test('probe: empty-state add-student anchor', async ({ page }) => {
  test.setTimeout(180_000);
  page.setDefaultTimeout(60_000);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await loginAs(page, 'schoolAdmin');
      break;
    } catch {
      await page.waitForTimeout(20_000);
      if (attempt === 2) throw new Error('login never landed');
    }
  }
  const jwt = await schoolAdminJwt(page.request);
  const cls = await page.request.post(`${API}/api/schools/me/classes`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: { name: `W3 EmptyProbe ${Date.now()}` },
  });
  const classId = ((await cls.json()) as { data: { documentId: string } }).data.documentId;

  await page.goto(`/dashboard/school/classes/${classId}`);
  const detail = page.locator('[data-surface="school-admin-class-detail"]');
  await expect(detail).toBeVisible({ timeout: 30_000 });
  const empty = detail.locator('[data-slot="empty-state"]');
  await expect(empty).toBeVisible({ timeout: 20_000 });
  console.log(
    'ANCHORS:',
    JSON.stringify(
      await empty
        .locator('a')
        .evaluateAll((as) =>
          as.map((a) => ({ text: a.textContent, aria: a.getAttribute('aria-label'), html: a.innerHTML.slice(0, 160) })),
        ),
    ),
  );
  console.log(
    'BUTTONS:',
    JSON.stringify(await empty.getByRole('button').allInnerTexts()),
  );

  const ops = await page.request.post(`${API}/api/auth/local`, {
    data: { identifier: ROLE_CREDENTIALS.ops.email, password: ROLE_CREDENTIALS.ops.password },
  });
  const opsJwt = ((await ops.json()) as { jwt: string }).jwt;
  await page.request.delete(`${API}/api/schools/me/classes/${classId}`, {
    headers: { Authorization: `Bearer ${opsJwt}` },
  });
});
