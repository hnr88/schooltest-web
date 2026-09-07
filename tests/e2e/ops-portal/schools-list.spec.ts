/**
 * OPS-011 — the Schools screen driven against the versioned directory.
 *
 * The ops session is the REAL signed-in portal (auth-fixture task-005); the
 * fixture schools are created and deleted through the REAL contracts. The
 * screen under test is the server-driven C-OPS-PORTAL-001 table: URL params
 * are the source of truth for q/state/sector/sort/page, the API applies them,
 * and the totals on screen come from meta.pagination — never from counting
 * loaded rows.
 */
import { randomUUID } from 'node:crypto';

import { expect, type APIRequestContext } from '@playwright/test';

import { apiEnv } from '../helpers/auth-db';
import { test } from '../helpers/auth-fixture';

const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:5500';
const SCREEN = '/en/dashboard/ops/schools';
const CAPTURES = '/home/hnr/Code/schooltest/.codephant/missions/msn-ab5a6a54-f385-42e1-826a-aeba2bbdbc66/captures';

let jwt = '';
const token = `ops011w${Date.now().toString(36)}`;
const created: string[] = [];

async function opsApi(request: APIRequestContext): Promise<void> {
  const login = await request.post(`${API}/api/auth/local`, {
    data: { identifier: 'apiadmin@schooltest.local', password: apiEnv('SEED_APIADMIN_PASSWORD') },
  });
  expect(login.ok()).toBeTruthy();
  jwt = ((await login.json()) as { jwt: string }).jwt;
}

async function createFixture(request: APIRequestContext, name: string, state: string): Promise<string> {
  const res = await request.post(`${API}/api/schools`, {
    headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1', 'Idempotency-Key': randomUUID() },
    data: {
      name,
      contact_email: `${token}@fixture.schooltest.local`,
      suburb: 'Probeville',
      state,
      sector: 'government',
    },
  });
  expect([200, 201]).toContain(res.status());
  const body = (await res.json()) as { data: { documentId: string } };
  created.push(body.data.documentId);
  return body.data.documentId;
}

test.beforeAll(async ({ request }) => {
  await opsApi(request);
  await createFixture(request, `${token} Tas Gov`, 'TAS');
  await createFixture(request, `${token} Vic Cath`, 'VIC');
});

test.afterAll(async ({ request }) => {
  for (const documentId of created.reverse()) {
    await request.delete(`${API}/api/ops/schools/${documentId}`, {
      headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' },
    });
  }
});

test('the directory renders server-driven rows, the gap pills and the pager', async ({ authPage: page }) => {
  await page.goto(SCREEN);
  await expect(page.locator('[data-slot="ops-schools"]')).toBeVisible();

  const pills = page.locator('[data-slot="ops-schools-pills"]');
  await expect(pills).toBeVisible();
  // GAP-12/16 recorded on screen: five pictured status pills, non-functional.
  await expect(page.locator('[data-slot="ops-schools-pills"] [data-gap]')).toHaveCount(5);

  const pager = page.locator('[data-slot="ops-schools-pagination"]');
  await expect(pager).toBeVisible();
  await expect(pager.getByRole('button', { name: /previous/i })).toBeDisabled();

  await expect(page.getByRole('status').first()).toContainText(/of \d+ schools/);
});

test('search round-trips through the URL and matches the fixture school', async ({ authPage: page }) => {
  await page.goto(SCREEN);
  await page.getByLabel(/search schools/i).fill(token);
  await expect(page).toHaveURL(new RegExp(`q=${token}`));
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await expect(page.getByRole('link', { name: `${token} Tas Gov` })).toBeVisible();
  await expect(page.getByRole('link', { name: `${token} Vic Cath` })).toBeVisible();

  await page.getByRole('button', { name: /clear all/i }).click();
  await expect(page).not.toHaveURL(/q=/);
});

test('state and sort params drive the server query and survive reload', async ({ authPage: page }) => {
  await page.goto(`${SCREEN}?state=TAS&q=${token}&sort=student_count:desc`);
  await expect(page.locator('[data-slot="ops-schools"]')).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.getByRole('link', { name: `${token} Tas Gov` })).toBeVisible();
  await expect(page.getByRole('link', { name: `${token} Vic Cath` })).toHaveCount(0);

  await page.reload();
  await expect(page).toHaveURL(/state=TAS/);
  await expect(page.locator('tbody tr')).toHaveCount(1);
});

test('visual captures: reference desktop and 375px, identical data, real rows', async ({ authPage: page }) => {
  await page.goto(`${SCREEN}?q=${token}`);
  await expect(page.locator('tbody tr')).toHaveCount(2);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator('[data-slot="ops-schools"]')).toBeVisible();
  await page.screenshot({ path: `${CAPTURES}/ops011-schools-list-1440x1000.png`, fullPage: false });

  await page.setViewportSize({ width: 375, height: 800 });
  await expect(page.locator('[data-slot="ops-schools"]')).toBeVisible();
  await page.screenshot({ path: `${CAPTURES}/ops011-schools-list-375x800.png`, fullPage: false });
});
