import { expect, test, type APIRequestContext, type APIResponse, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, loadMessages } from './helpers/i18n';
import { fixtureClassId } from './helpers/fixture-class';

// Task 69 (st-mvp-pivot) targeted live check — NOT part of the suite.
// C-OPS-03: the pipeline page renders the live BullMQ queue counts and the R
// badge straight from GET /api/ops/pipeline/health. C-OPS-02: from the ops
// school detail, a real sitting (created + code-minted as the seeded teacher)
// is invalidated end to end through the recovery panel; the API then confirms
// the sitting is closed. Finally a teacher is bounced off the pipeline page.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const OPS = { email: 'admin@schooltest.local', password: process.env.E2E_OPS_PASSWORD ?? 'Admin1234!' };
const TEACHER = { email: process.env.E2E_TEACHER_EMAIL ?? 'teacher@schooltest.local', password: process.env.E2E_TEACHER_PASSWORD ?? 'Teacher1234!' };
// Seeded fixture class ("EAL/D Year 7 - Room 4") of SchoolTest Demo School A.
const CLASS_DOCUMENT_ID = fixtureClassId();
const SCHOOL_DOCUMENT_ID = 'tcdu9a7g6qm2tg8brju2kosp';

interface QueueHealth {
  name: string;
  waiting: number;
  active: number;
  failed: number;
  completed: number;
}

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

test.describe('task 69: ops pipeline health + sitting recovery', () => {
  // The timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  test.describe.configure({ timeout: 120_000 });
  test('pipeline page renders the live queue counts and R badge', async ({ page, request }) => {
    const jwt = await login(request, OPS.email, OPS.password);
    const res = await apiGet(request, `${API}/api/ops/pipeline/health`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.ok()).toBeTruthy();
    const { data } = (await res.json()) as { data: { queues: QueueHealth[]; r_scoring: string } };
    expect(data.queues).toHaveLength(4);

    await signIn(page, OPS.email, OPS.password, '/dashboard/ops/schools');
    await page.goto('/dashboard/ops/pipeline');

    const surface = page.locator('[data-surface="ops-pipeline"]');
    await expect(surface).toBeVisible({ timeout: 20_000 });
    await expect(
      surface.getByRole('heading', { name: cat(en, 'Ops.pipeline.title'), exact: true }),
    ).toBeVisible();
    await expect(
      surface.locator('[data-surface="ops-pipeline-r-status"]'),
    ).toHaveText(cat(en, data.r_scoring === 'up' ? 'Ops.pipeline.rUp' : 'Ops.pipeline.rDown'));

    for (const queue of data.queues) {
      const row = surface.locator(`[data-surface="ops-pipeline-queue-${queue.name}"]`);
      await expect(row).toBeVisible();
      await expect(row.getByText(String(queue.failed), { exact: true }).first()).toBeVisible();
    }
  });

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

  test('teacher is bounced out of /dashboard/ops/pipeline', async ({ page }) => {
    await signIn(page, TEACHER.email, TEACHER.password, '/dashboard');
    await page.goto('/dashboard/ops/pipeline');
    await page.waitForURL('**/dashboard/teach', { timeout: 30_000 });
    await expect(page.locator('[data-surface="ops-pipeline"]')).toHaveCount(0);
  });
});
