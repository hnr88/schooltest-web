import { expect, test, type APIRequestContext, type APIResponse, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, loadMessages } from './helpers/i18n';
import { fixtureClassId } from './helpers/fixture-class';
import { fixtureSchoolId } from './helpers/fixture-ids';
import { roleCredentials } from './helpers/credentials';

// Task 69 (st-mvp-pivot) targeted live check — NOT part of the suite.
// C-OPS-02: from the ops school detail, a real sitting (created + code-minted
// as the seeded teacher) is invalidated end to end through the recovery panel;
// the API then confirms the sitting is closed.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const OPS = roleCredentials('ops');
const TEACHER = roleCredentials('teacher');
// Seeded fixture class ("EAL/D Year 7 - Room 4") of SchoolTest Demo School A.
const CLASS_DOCUMENT_ID = fixtureClassId();
const SCHOOL_DOCUMENT_ID = fixtureSchoolId();

async function login(request: APIRequestContext, email: string, password: string): Promise<string> {
  return loginCached(request, API, { email, password });
}

// Every request-context call rides out the API's fixed-window 429 (helpers/http.ts).
const apiGet = (
  request: APIRequestContext,
  url: string,
  options?: Parameters<APIRequestContext['get']>[1],
): Promise<APIResponse> => fetchWithRetry(() => request.get(url, options));
const apiPost = (
  request: APIRequestContext,
  url: string,
  options?: Parameters<APIRequestContext['post']>[1],
): Promise<APIResponse> => fetchWithRetry(() => request.post(url, options));

async function signIn(page: Page, email: string, password: string, landing: string): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  // late role redirect can never hijack the goto that follows. The axios
  // layer rides out any 429 on the auth POST, so allow for that here.
  await page.waitForURL(`**${landing}`, { timeout: 90_000 });
}

test.describe('task 69: ops sitting recovery', () => {
  // The timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  test.describe.configure({ timeout: 120_000 });
  test('ops invalidates a live sitting end to end from the school detail', async ({
    page,
    request,
  }) => {
    // Arrange a real open sitting as the seeded teacher (same path as test day).
    const teacherJwt = await login(request, TEACHER.email, TEACHER.password);
    const created = await apiPost(request, `${API}/api/sittings`, {
      headers: { Authorization: `Bearer ${teacherJwt}` },
      data: {
        data: {
          class_document_id: CLASS_DOCUMENT_ID,
          mode: 'progress',
          skill: 'reading',
        },
      },
    });
    expect(created.status()).toBe(201);
    const sitting = ((await created.json()) as { data: { documentId: string } }).data;
    const minted = await apiPost(request, `${API}/api/sittings/${sitting.documentId}/code`, {
      headers: { Authorization: `Bearer ${teacherJwt}` },
    });
    expect(minted.ok()).toBeTruthy();
    const { code } = (await minted.json()) as { code: string };

    await signIn(page, OPS.email, OPS.password, '/dashboard/ops/schools');
    await page.goto(`/dashboard/ops/schools/${SCHOOL_DOCUMENT_ID}`);

    const panel = page.locator('[data-surface="ops-sitting-recovery"]');
    await expect(panel).toBeVisible({ timeout: 20_000 });
    await panel.getByLabel(cat(en, 'Ops.recovery.pickerLabel'), { exact: true }).click();
    await page.getByRole('option', { name: new RegExp(code) }).click();

    const detail = panel.locator('[data-surface="ops-sitting-recovery-detail"]');
    await expect(detail).toBeVisible({ timeout: 20_000 });
    await detail
      .getByRole('button', { name: cat(en, 'Ops.recovery.invalidateButton'), exact: true })
      .click();
    await page
      .getByRole('button', { name: cat(en, 'Ops.recovery.confirm'), exact: true })
      .click();
    await expect(
      detail.locator('[data-surface="ops-sitting-invalidated"]'),
    ).toHaveText(cat(en, 'Ops.recovery.invalidatedNotice'), { timeout: 20_000 });

    // The API confirms the sitting is closed (C-OPS-02 effect).
    const opsJwt = await login(request, OPS.email, OPS.password);
    const check = await apiGet(request, `${API}/api/sittings/${sitting.documentId}`, {
      headers: { Authorization: `Bearer ${opsJwt}` },
    });
    expect(check.ok()).toBeTruthy();
    const body = (await check.json()) as { data: { status: string } };
    expect(body.data.status).toBe('closed');
  });
});
