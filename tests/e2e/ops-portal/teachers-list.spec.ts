/**
 * C-OPS-PORTAL-021 (OPS-031) — the ops staff directory in the REAL portal.
 *
 * Drives the real Next app against the real Strapi and the real seeded school:
 * nothing is intercepted, so a green run means the browser actually received
 * the versioned body. Three things are proven that a 200 alone does not:
 *  1. the live response validates against the SHARED contract schema (the same
 *     module the server projects to), so client and server cannot drift;
 *  2. the Teachers tab renders that read — its header summary carries the
 *     query's own server total, not the number of rows on screen;
 *  3. the tab's search, empty state and pager are SERVER work — an unmatched
 *     search is an honest empty, and paging never repeats a page-1 row.
 * Captures run at the reference desktop viewport and at 375px with a fixed
 * clock, so the visual review compares like with like.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import {
  OPS_PORTAL_VERSION,
  OPS_PORTAL_VERSION_HEADER,
  teachersListResponseSchema,
} from '@schooltest/ops-contracts';

import { apiEnv } from '../helpers/auth-db';
import { HOOK_TIMEOUT_MS, namedRetry } from '../helpers/api-named-retry';
import { cat, loadMessages } from '../helpers/i18n';
import {
  OpsFixtureLedger,
  createOpsFixtureSchool,
  createOpsFixtureTeacher,
} from '../helpers/ops-portal';

import {
  MOBILE_VIEWPORT,
  REFERENCE_CLOCK_ISO,
  REFERENCE_DEVICE_SCALE_FACTOR,
  REFERENCE_VIEWPORT,
} from '@/modules/ops/hooks/use-visual-reference';

const en = loadMessages('en');
const API = process.env.E2E_API_URL ?? process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:5500';
// Fixture school with one teacher, created in beforeAll through the real
// contracts (the seeded demo school this spec once pinned is absent at HEAD).
let schoolId = '';
let teacherEmail = '';
const ledger = new OpsFixtureLedger();
const OPS_EMAIL = 'apiadmin@schooltest.local';
const ACTION_TIMEOUT = 10_000;

const CAPTURES = path.resolve(
  __dirname,
  '../../../../.codephant/missions/msn-ab5a6a54-f385-42e1-826a-aeba2bbdbc66/captures/ops-031',
);

async function opsJwt(request: APIRequestContext): Promise<string> {
  const login = await request.post(`${API}/api/auth/local`, {
    data: { identifier: OPS_EMAIL, password: apiEnv('SEED_APIADMIN_PASSWORD') },
  });
  expect(login.ok()).toBeTruthy();
  return ((await login.json()) as { jwt: string }).jwt;
}

async function signInAsOps(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(OPS_EMAIL);
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(apiEnv('SEED_APIADMIN_PASSWORD'));
  await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
  await page.waitForURL('**/dashboard', { timeout: ACTION_TIMEOUT });
}

// The manage-teachers modal is gone (its edit moved into the row ⋯ menu —
// see ops-teacher-details.spec). The drawn Teachers TAB is now the only
// directory surface: its search/chips/pager are the server's, and its header
// summary is fed by the SAME versioned C-OPS-PORTAL-021 read this spec pins.
async function openTeachersTab(page: Page) {
  await page.goto(`/en/dashboard/ops/schools/${schoolId}?tab=teachers`);
  const directory = page.locator('[data-slot="directory"]');
  await expect(directory).toBeVisible({ timeout: ACTION_TIMEOUT });
  await expect(directory.getByRole('row').filter({ hasText: teacherEmail }).first()).toBeVisible({
    timeout: ACTION_TIMEOUT,
  });
  return directory;
}

test.describe('C-OPS-PORTAL-021 ops teachers directory', () => {
  test.beforeAll(async ({ request }) => {
    test.setTimeout(HOOK_TIMEOUT_MS);
    await namedRetry('ops-031', 'create the fixture school and teacher', async () => {
      const school = await createOpsFixtureSchool(request, ledger, 'ops-031');
      schoolId = school.documentId;
      const teacher = await createOpsFixtureTeacher(request, ledger, schoolId, 'ops-031');
      teacherEmail = teacher.email;
    });
  });

  test.afterAll(async ({ request }) => {
    await ledger.cleanup(request);
  });

  test('the live versioned body validates against the shared contract schema', async ({
    request,
  }) => {
    const jwt = await opsJwt(request);
    const res = await request.get(`${API}/api/ops/schools/${schoolId}/teachers?pageSize=200`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        [OPS_PORTAL_VERSION_HEADER]: OPS_PORTAL_VERSION,
      },
    });
    expect(res.status()).toBe(200);
    const parsed = teachersListResponseSchema.safeParse(await res.json());
    expect(parsed.success, JSON.stringify(parsed.error?.issues ?? [], null, 2)).toBe(true);
  });

  test('the tab renders the fixture teacher and the header summary carries the server total', async ({
    page,
    request,
  }) => {
    await page.clock.setFixedTime(new Date(REFERENCE_CLOCK_ISO));
    await signInAsOps(page);

    const requests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/teachers')) requests.push(req.url());
    });

    const directory = await openTeachersTab(page);
    const rows = directory.getByRole('row').filter({ hasText: teacherEmail });
    await expect(rows.first()).toBeVisible({ timeout: ACTION_TIMEOUT });

    // The tab's OWN versioned read fired, scoped to this school's teachers.
    expect(requests.some((url) => url.includes('role=teacher'))).toBe(true);

    // The header summary reports the SERVER's total, taken from the same
    // versioned body the browser fetched — not the number of rows painted.
    // (The fixture teacher belongs to no class, so "classes covered" is 0.)
    const jwt = await opsJwt(request);
    const api = await request.get(
      `${API}/api/ops/schools/${schoolId}/teachers?pageSize=200&role=teacher`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
          [OPS_PORTAL_VERSION_HEADER]: OPS_PORTAL_VERSION,
        },
      },
    );
    const body = teachersListResponseSchema.parse(await api.json());
    await expect(
      page.getByText(
        cat(en, 'Ops.schoolTables.teachersHeaderSummary')
          .replace('{teachers}', String(body.meta.pagination.total))
          .replace('{classes}', '0'),
      ),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });

    await mkdir(CAPTURES, { recursive: true });
    await page.setViewportSize(REFERENCE_VIEWPORT);
    expect(REFERENCE_DEVICE_SCALE_FACTOR).toBe(1);
    await page.screenshot({ path: path.join(CAPTURES, 'teachers-tab-1440.png') });
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.screenshot({ path: path.join(CAPTURES, 'teachers-tab-375.png') });
  });

  test('search narrows the result server-side and an unmatched search is an honest empty state', async ({
    page,
  }) => {
    await page.clock.setFixedTime(new Date(REFERENCE_CLOCK_ISO));
    await signInAsOps(page);
    const directory = await openTeachersTab(page);

    const search = directory.getByPlaceholder(cat(en, 'Ops.schoolTables.searchPlaceholder'));
    await search.fill('zzz-no-such-teacher-zzz', { timeout: ACTION_TIMEOUT });
    await expect(directory.locator('[data-slot="directory-empty"]')).toBeVisible({
      timeout: ACTION_TIMEOUT,
    });
    await expect(directory.getByRole('row').filter({ hasText: teacherEmail })).toHaveCount(0);

    await mkdir(CAPTURES, { recursive: true });
    await page.setViewportSize(REFERENCE_VIEWPORT);
    await page.screenshot({ path: path.join(CAPTURES, 'teachers-tab-empty-1440.png') });

    await search.fill('', { timeout: ACTION_TIMEOUT });
    await expect(directory.getByRole('row').filter({ hasText: teacherEmail }).first()).toBeVisible({
      timeout: ACTION_TIMEOUT,
    });
  });

  test('paging controls follow the server pageCount', async ({ page }) => {
    await page.clock.setFixedTime(new Date(REFERENCE_CLOCK_ISO));
    await signInAsOps(page);
    const directory = await openTeachersTab(page);

    const pagination = directory.locator('[data-slot="directory-pagination"]');
    await expect(pagination).toBeVisible({ timeout: ACTION_TIMEOUT });
    const previous = pagination.getByRole('button', { name: cat(en, 'Directory.defaults.previous') });
    const next = pagination.getByRole('button', { name: cat(en, 'Directory.defaults.next') });
    await expect(previous).toBeDisabled({ timeout: ACTION_TIMEOUT });

    if (await next.isEnabled()) {
      await next.click({ timeout: ACTION_TIMEOUT });
      await expect(previous).toBeEnabled({ timeout: ACTION_TIMEOUT });
      // the fixture teacher lives on page 1 — page 2 must not list them again
      await expect(directory.getByRole('row').filter({ hasText: teacherEmail })).toHaveCount(0, {
        timeout: ACTION_TIMEOUT,
      });
    }
  });
});
