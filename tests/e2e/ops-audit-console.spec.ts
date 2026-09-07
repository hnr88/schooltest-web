/**
 * Ledger 6 — the ops Audit console end to end against the REAL stack.
 *
 * C-OPSA-01: the audit ledger table, proven to filter and paginate ON THE
 * SERVER — the assertions read `meta.pagination` totals through the rendered
 * pager and watch the request's own query string, so a client-side filter over
 * one loaded page could not pass them.
 *
 * C-OPSA-02: the API-token inventory and its irreversible revoke.
 *
 * THROWAWAY-TOKEN DISCLOSURE (read before changing this file): revoke is a HARD
 * DELETE server-side, so the mutation is proven on a token this spec creates
 * and destroys itself, never on one of the two real seeded tokens ("Read Only",
 * "Full Access"). The ops API exposes NO token-create route — only list and
 * revoke — so the fixture is inserted straight into Postgres through the same
 * container the suite's own SQL helpers target. That insert is the ONLY
 * non-API step; the revoke under test goes through the real UI and the real
 * endpoint. `afterAll` removes the row if the revoke never ran.
 *
 * ONE sign-in for the whole file: the API allows 20 POST /api/auth/local per
 * minute per IP and that budget is shared with every other suite on this host.
 */
import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';

import { loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';

const en = loadMessages('en');
const OUT = path.resolve(
  __dirname,
  '../../../.codephant/missions/msn-0da39441-f845-426b-88a1-037c9eb98442/captures',
);
const PG = 'schooltest-api-st1-postgres';
const STAMP = Date.now();
const TOKEN_NAME = `ZZ E2E audit throwaway ${STAMP}`;
const WAIT = 30_000;

function sql(statement: string): string {
  return execFileSync(
    'docker',
    ['exec', PG, 'psql', '-U', 'schooltest', '-d', 'schooltest', '-t', '-A', '-c', statement],
    { encoding: 'utf-8' },
  ).trim();
}

/** The fixture token. Named with a ZZ prefix so it can never be confused for a real one. */
function createThrowawayToken(): number {
  const id = sql(
    `insert into strapi_api_tokens (document_id, name, description, type, access_key, created_at, updated_at, published_at)
     values ('thrw${STAMP}', '${TOKEN_NAME}', 'e2e throwaway fixture', 'read-only', md5(random()::text), now(), now(), now())
     returning id;`,
  );
  const parsed = Number(id.split('\n')[0]);
  expect(Number.isInteger(parsed) && parsed > 0, `fixture token id was created (got ${id})`).toBe(true);
  return parsed;
}

const auditRows = (page: Page) => page.locator('[data-slot="ops-audit-row"]');
const tokenRow = (page: Page, name: string) =>
  page.locator(`[data-slot="ops-api-token-row"][data-token-name="${name}"]`);

test.describe('ledger 6 — the ops Audit console', () => {
  // Serial + a real budget: one shared page, and a dev-server compile on the
  // first navigation can eat Playwright's 30s default on its own.
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  let context: BrowserContext;
  let page: Page;
  let tokenId = 0;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    tokenId = createThrowawayToken();
    context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    page = await context.newPage();
    await loginAs(page, 'ops');
  });

  test.afterAll(async () => {
    // Only fires if the revoke test never ran; the revoke itself is the delete.
    if (tokenId > 0) sql(`delete from strapi_api_tokens where id = ${tokenId};`);
    await context?.close();
  });

  test('the ledger renders live server data and pages through it', async () => {
    // pageSize is a SERVER parameter: 5 makes the 10+ seeded rows span pages.
    await page.goto('/dashboard/ops/audit?pageSize=5');
    await expect(page.getByRole('heading', { name: en['Ops.audit.title'], level: 1 })).toBeVisible({
      timeout: WAIT,
    });

    await expect(auditRows(page).first()).toBeVisible({ timeout: WAIT });
    const firstPage = await auditRows(page).count();
    expect(firstPage, 'the server filled a full page of 5').toBe(5);
    const firstTarget = await auditRows(page).first().locator('[data-field="target"]').innerText();

    // The pager's copy comes from the server's whole-scope meta.pagination.
    const pager = page.locator('[data-slot="ops-directory-pagination"]');
    await expect(pager).toBeVisible();
    await expect(pager.getByRole('status')).toContainText('1');

    // Advancing asks the SERVER for page 2 — the URL carries it and the rows change.
    const request = page.waitForRequest(
      (req) => req.url().includes('/api/ops/audit-logs') && req.url().includes('page=2'),
    );
    await pager.getByRole('button', { name: en['Ops.audit.pagination.next'] }).click();
    await request;
    await expect(page).toHaveURL(/page=2/);
    await expect
      .poll(async () => auditRows(page).first().locator('[data-field="target"]').innerText(), {
        timeout: WAIT,
      })
      .not.toBe(firstTarget);
  });

  test('the action filter is applied by the server, not the browser', async () => {
    await page.goto('/dashboard/ops/audit');
    await expect(auditRows(page).first()).toBeVisible({ timeout: WAIT });
    const unfiltered = await auditRows(page).count();
    const total = Number(
      (await page.locator('[data-slot="ops-directory-pagination"]').getByRole('status').innerText())
        .replace(/[^0-9]+/g, ' ')
        .trim()
        .split(' ')
        .pop(),
    );
    expect(total, 'the pager reports the server total').toBeGreaterThan(0);

    const response = page.waitForResponse(
      (res) => res.url().includes('/api/ops/audit-logs') && res.url().includes('action=invitation'),
    );
    await page.locator('#audit-filter-action').fill('invitation');
    await page.locator('[data-slot="ops-audit-apply"]').click();
    const sent = await response;
    // Proof the browser did not filter a loaded page: the SERVER was asked, and
    // its own meta.total — not the row count — reports the narrowed scope.
    expect(sent.url(), 'the filter is a server query parameter').toContain('action=invitation');
    expect(sent.status()).toBe(200);
    const body = (await sent.json()) as { meta: { pagination: { total: number } } };
    expect(body.meta.pagination.total, 'the server narrowed the whole scope').toBeLessThan(total);
    await expect(page).toHaveURL(/action=invitation/);

    // `keepPreviousData` deliberately holds the previous rows on screen while
    // the filtered page loads, so this POLLS until the rendered set settles.
    // Snapshotting handles with .all() here would race the re-render and hang
    // on a row that no longer exists.
    const actions = page.locator('[data-slot="ops-audit-row"] [data-field="action"]');
    await expect
      .poll(
        async () => {
          const texts = await actions.allInnerTexts();
          return texts.length > 0 && texts.every((value) => value.includes('invitation'));
        },
        { timeout: WAIT },
      )
      .toBe(true);
    expect(await actions.count(), 'the filter returned a narrower set').toBeLessThanOrEqual(
      unfiltered,
    );
  });

  test('revoking the throwaway token removes it, behind a confirmation', async () => {
    await page.goto('/dashboard/ops/audit');
    const row = tokenRow(page, TOKEN_NAME);
    await expect(row, 'the throwaway token is listed before the revoke').toBeVisible({
      timeout: WAIT,
    });
    // The two REAL seeded tokens must be present and are never touched.
    await expect(tokenRow(page, 'Read Only')).toBeVisible();
    await expect(tokenRow(page, 'Full Access')).toBeVisible();

    await row.locator('[data-slot="ops-token-revoke"]').click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(TOKEN_NAME);

    const revoke = page.waitForResponse(
      (res) => res.url().includes(`/api/ops/security/api-tokens/${tokenId}/revoke`),
    );
    await dialog.getByRole('button', { name: en['Ops.audit.tokens.confirmAction'] }).click();
    expect((await revoke).status(), 'the revoke endpoint accepted').toBe(200);

    await expect(row, 'the revoked token is gone from the list').toHaveCount(0, { timeout: WAIT });
    await expect(tokenRow(page, 'Read Only')).toBeVisible();
    await expect(tokenRow(page, 'Full Access')).toBeVisible();
    // Hard delete, confirmed at the source of truth.
    expect(sql(`select count(*) from strapi_api_tokens where id = ${tokenId};`)).toBe('0');
    tokenId = 0;
  });

  test('capture: the audit console at desktop and 375px', async ({}, testInfo) => {
    await mkdir(OUT, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard/ops/audit');
    await expect(auditRows(page).first()).toBeVisible({ timeout: WAIT });
    await page.screenshot({ path: path.join(OUT, 'audit-console-desktop.png') });
    testInfo.attach('audit-console-desktop', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    // The token surface is the console's other half and sits below the fold,
    // so it gets its own frame rather than being cropped out of the proof.
    const tokens = page.locator('[data-slot="ops-api-tokens"]');
    await tokens.scrollIntoViewIfNeeded();
    await expect(tokens.locator('[data-slot="ops-api-token-row"]').first()).toBeVisible();
    await page.screenshot({ path: path.join(OUT, 'audit-console-tokens.png') });
    testInfo.attach('audit-console-tokens', {
      body: await tokens.screenshot(),
      contentType: 'image/png',
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard/ops/audit');
    await expect(auditRows(page).first()).toBeVisible({ timeout: WAIT });
    await page.screenshot({ path: path.join(OUT, 'audit-console-375.png'), fullPage: true });
    testInfo.attach('audit-console-375', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    await page.setViewportSize({ width: 1440, height: 900 });
  });
});
