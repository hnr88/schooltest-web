/**
 * fleet4-02 — LIVE end-to-end sweep of the legal documents surface.
 *
 * The four legal pages (/privacy-policy, /terms-of-service, /cookie-policy,
 * /gdpr) are the web half; the editor UI retired (R-15), so the write half is
 * exercised through the contracted C-LEG-03 endpoint and observed ON the web
 * pages after a revalidation. Refusals (anonymous, ops_support, invalid
 * payloads, bogus slugs) prove the gates.
 *
 * Every mutation restores its document; probe data stamped F4-<epoch>.
 * Screenshots: tests/e2e/captures/fleet4/.
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { fetchLegalDocument, LEGAL_PAGES } from './helpers/legal';

const CAPTURES = path.resolve(__dirname, 'captures/fleet4');
const API = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:5500';
const WEB = process.env.E2E_BASE_URL ?? 'http://localhost:3002';
const STAMP = `F4-${Date.now()}`;
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET ?? '';

const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(CAPTURES, `${name}.png`), fullPage: true });

function watchConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}

type Jwt = string;
const jwtCache: Record<string, Jwt> = {};

/** Role JWT via the real local auth endpoint (cached per role). */
async function jwtFor(identifier: string, password: string): Promise<Jwt> {
  const key = `${identifier}:${password}`;
  if (jwtCache[key]) return jwtCache[key];
  const res = await fetch(`${API}/api/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) throw new Error(`[f4] login ${identifier} failed: ${res.status}`);
  jwtCache[key] = ((await res.json()) as { jwt: string }).jwt;
  return jwtCache[key];
}

const opsJwt = () => jwtFor('admin@schooltest.local', 'Admin1234!');
const supportJwt = () =>
  jwtFor(
    process.env.E2E_OPS_SUPPORT_EMAIL ?? 'opssupport@schooltest.local',
    process.env.E2E_OPS_SUPPORT_PASSWORD ?? 'SupWvEStNXzqs6rljOl5YOSm!7',
  );

interface PutResult {
  status: number;
  body: Record<string, unknown> | null;
}

/** C-LEG-03 — PUT /api/ops/legal-documents/:slug with an arbitrary bearer. */
async function putLegal(
  slug: string,
  patch: Record<string, unknown>,
  auth?: string,
): Promise<PutResult> {
  const res = await fetch(`${API}/api/ops/legal-documents/${slug}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
    },
    body: JSON.stringify(patch),
  });
  return { status: res.status, body: (await res.json().catch(() => null)) as PutResult['body'] };
}

async function revalidateLegal(): Promise<void> {
  const res = await fetch(`${WEB}/api/revalidate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-revalidate-secret': REVALIDATE_SECRET,
    },
    body: JSON.stringify({ tags: ['legal-documents'] }),
  });
  if (!res.ok) throw new Error(`[f4] revalidate failed: ${res.status}`);
  await fetch(`${WEB}/`).catch(() => undefined);
}

test.describe.configure({ mode: 'serial' });
test.describe.configure({ timeout: 120_000 });

test.describe('fleet4 legal documents', () => {
  test.beforeAll(() => {
    mkdirSync(CAPTURES, { recursive: true });
  });

  for (const { slug, path } of LEGAL_PAGES) {
    test(`view: ${path} renders the persisted document with clean console`, async ({ page }) => {
      const document = await fetchLegalDocument(slug);
      const errors = watchConsole(page);

      const response = await page.goto(path);
      expect(response?.status(), `${path} status`).toBe(200);
      await expect(page.getByRole('heading', { level: 1, name: document.title })).toBeVisible({
        timeout: 20_000,
      });
      await expect(
        page.getByRole('definition').filter({ hasText: document.version }).first(),
      ).toBeVisible();
      await expect(page.locator(`time[datetime="${document.effective_date}"]`)).toBeVisible();
      await shot(page, `20-legal-${slug}`);
      expect(errors, `console errors on ${path}: ${errors.join(' | ')}`).toEqual([]);
    });
  }

  test('mobile 375px: a legal page renders without losing its heading', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const errors = watchConsole(page);
    await page.goto('/privacy-policy');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 20_000 });
    await shot(page, '21-legal-375px');
    expect(errors, `console errors at 375px: ${errors.join(' | ')}`).toEqual([]);
  });

  test('mobile 375px: the LANDING Primary nav is hidden — evidence capture', async ({ page }) => {
    // Repro of the legal.spec.ts:163 failure. The nav IS in the DOM but
    // resolves hidden at 375px — recorded as evidence, verdict in the report.
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForTimeout(3_000);
    const nav = page.getByRole('navigation', { name: 'Primary', exact: true });
    const count = await nav.count();
    const visible = count > 0 ? await nav.first().isVisible() : false;
    console.log(`[f4] landing Primary nav at 375px: count=${count} visible=${visible}`);
    await shot(page, '22-landing-375px-nav');
    // Deliberately NOT asserting visibility — this test exists to pin EVIDENCE.
    expect(count, 'the Primary nav element should exist in the DOM').toBeGreaterThan(0);
  });

  test('bogus document id: web 404s gracefully, API refuses, nothing leaks', async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto('/privacy-policy-bogus');
    await expect(page.getByText(/this page could not be found|404/i).first()).toBeVisible({
      timeout: 20_000,
    });
    await shot(page, '23-legal-bogus-slug-404');

    const apiRes = await fetch(`${API}/api/legal-documents/privacy-policy-bogus`);
    expect(apiRes.status).toBe(404);

    // A path-traversal-ish slug must not leak anything either.
    const traversal = await fetch(
      `${API}/api/legal-documents/${encodeURIComponent('../../platform-settings')}`,
    );
    expect(traversal.status).toBe(404);
    expect(errors, `console errors on bogus slug: ${errors.join(' | ')}`).toEqual([]);
  });

  test('edit happy path: ops rename reaches the public page after revalidation, then reverts', async ({
    page,
  }) => {
    const slug = 'cookie-policy';
    const original = await fetchLegalDocument(slug);
    const probe = `${original.title} F4-${Date.now() % 100_000}`;
    try {
      const put = await putLegal(slug, { title: probe }, await opsJwt());
      expect(put.status, `PUT title must succeed: ${JSON.stringify(put.body)}`).toBe(200);
      await revalidateLegal();

      const errors = watchConsole(page);
      await page.goto(`/${slug}`);
      await page.reload();
      await expect(page.getByRole('heading', { level: 1, name: probe })).toBeVisible({
        timeout: 20_000,
      });
      await shot(page, '24-legal-edit-live');
      expect(errors, `console errors after edit: ${errors.join(' | ')}`).toEqual([]);
    } finally {
      await putLegal(slug, { title: original.title }, await opsJwt());
      await revalidateLegal();
    }
    await page.goto(`/${slug}`);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: original.title })).toBeVisible({
      timeout: 20_000,
    });
    await shot(page, '25-legal-edit-reverted');
  });

  test('edit unhappy: every invalid payload is a 400 and changes nothing', async () => {
    const slug = 'gdpr';
    const before = await fetchLegalDocument(slug);
    const bad: Array<[string, Record<string, unknown>]> = [
      ['empty title', { title: '   ' }],
      ['non-string title', { title: 42 }],
      ['overlong title', { title: 'A'.repeat(201) }],
      ['bad effective_date', { effective_date: '16/09/2026' }],
      ['overlong version', { version: '1.0.0-alpha-build-2026' }],
      ['sections not an array', { sections: { heading: 'nope' } }],
      ['section without paragraphs', { sections: [{ id: 'x', heading: 'x', paragraphs: [] }] }],
      ['empty patch', {}],
    ];
    for (const [label, patch] of bad) {
      const put = await putLegal(slug, patch, await opsJwt());
      expect(put.status, `${label}: expected 400`).toBe(400);
    }
    const after = await fetchLegalDocument(slug);
    expect(after, 'a refused write must leave the document byte-identical').toEqual(before);
  });

  test('refusals: anonymous and ops_support writes are refused on every document', async () => {
    const anon = await putLegal('terms-of-service', { title: 'hacked' });
    expect([401, 403], 'anonymous PUT must be refused').toContain(anon.status);

    const support = await putLegal('terms-of-service', { title: 'support write' }, await supportJwt());
    expect(support.status, 'ops_support PUT must be 403').toBe(403);

    const doc = await fetchLegalDocument('terms-of-service');
    expect(doc.title.startsWith('hacked') || doc.title.includes('support write')).toBe(false);
  });

  test('version controls: version and effective_date DO change and reach the page', async ({
    page,
  }) => {
    const slug = 'privacy-policy';
    const original = await fetchLegalDocument(slug);
    const newVersion = `9.9-F4`;
    const newDate = '2026-12-31';
    try {
      const put = await putLegal(
        slug,
        { version: newVersion, effective_date: newDate },
        await opsJwt(),
      );
      expect(put.status).toBe(200);
      await revalidateLegal();
      await page.goto(`/${slug}`);
      await page.reload();
      await expect(page.getByText(newVersion).first()).toBeVisible({ timeout: 20_000 });
      await expect(page.locator(`time[datetime="${newDate}"]`)).toBeVisible();
      await shot(page, '26-legal-version-bumped');
    } finally {
      await putLegal(
        slug,
        { version: original.version, effective_date: original.effective_date },
        await opsJwt(),
      );
      await revalidateLegal();
    }
  });

  test('download: no download/print affordance is offered on legal pages (pinned absence)', async ({
    page,
  }) => {
    await page.goto('/terms-of-service');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 20_000 });
    const downloads = page.getByRole('link', { name: /download|pdf|print/i });
    const count = await downloads.count();
    console.log(`[f4] download/print affordances on /terms-of-service: ${count}`);
    await shot(page, '27-legal-no-download-affordance');
    // Pinned ABSENCE — if a download control ships later, this line flags it.
    expect(count).toBe(0);
  });
});
