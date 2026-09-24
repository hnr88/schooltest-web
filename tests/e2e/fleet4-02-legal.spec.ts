/**
 * fleet4-02 — LIVE end-to-end sweep of the legal documents surface.
 *
 * The four legal pages (/privacy-policy, /terms-of-service, /cookie-policy,
 * /gdpr) render from the Strapi CMS (`page` collection, pageType `legal`), so
 * the write half is a CMS edit: a Strapi admin edits and publishes the page
 * through the content-manager API (the same calls the admin panel makes), the
 * web cache is dropped with the `cms-content` tag, and the change is asserted
 * ON the public page. Every edit is reverted and re-published.
 *
 * The ops C-LEG-03 endpoint (PUT /api/ops/legal-documents/:slug) still exists
 * and its gates are still pinned here, but it NO LONGER drives the public
 * site: nothing it writes reaches these pages.
 *
 * Screenshots: tests/e2e/captures/fleet4/.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { roleCredentials } from './helpers/credentials';
import { fetchLegalDocument, LEGAL_PAGES } from './helpers/legal';

const CAPTURES = path.resolve(__dirname, 'captures/fleet4');
const API = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:5500';
const WEB = process.env.E2E_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? '3000'}`;
const PAGE_UID = 'api::page.page';

/** The web's revalidate secret: the shell wins, else this repo's .env (never logged). */
function revalidateSecret(): string {
  if (process.env.REVALIDATE_SECRET) return process.env.REVALIDATE_SECRET;
  try {
    const raw = readFileSync(path.resolve(__dirname, '../../.env'), 'utf8');
    return raw.match(/^REVALIDATE_SECRET=(.*)$/m)?.[1]?.trim().replace(/^(['"])(.*)\1$/, '$2') ?? '';
  } catch {
    return '';
  }
}

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

interface CmsLegalPage {
  documentId: string;
  title: string;
  version: string | null;
  publishedDate: string | null;
  sections: unknown[];
}

/** The published page exactly as the web reads it (public CMS surface). */
async function fetchCmsPage(slug: string): Promise<CmsLegalPage> {
  const res = await fetch(`${API}/api/pages/slug/${slug}?locale=en`);
  if (!res.ok) throw new Error(`[f4] GET /api/pages/slug/${slug} failed: ${res.status}`);
  return ((await res.json()) as { data: CmsLegalPage }).data;
}

let adminToken: string | null = null;

/** Strapi admin-panel session (the seeded super-admin), as the admin UI signs in. */
async function adminJwt(): Promise<string> {
  if (adminToken) return adminToken;
  const { email, password } = roleCredentials('ops');
  const res = await fetch(`${API}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`[f4] admin login failed: ${res.status}`);
  adminToken = ((await res.json()) as { data: { token: string } }).data.token;
  return adminToken;
}

/** Save the draft then publish it — the admin panel's "Save" + "Publish". */
async function cmsEditAndPublish(documentId: string, patch: Record<string, unknown>): Promise<void> {
  const base = `${API}/content-manager/collection-types/${PAGE_UID}/${documentId}`;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${await adminJwt()}` };
  const save = await fetch(`${base}?locale=en`, { method: 'PUT', headers, body: JSON.stringify(patch) });
  expect(save.status, `CMS save ${JSON.stringify(patch)}`).toBe(200);
  const publish = await fetch(`${base}/actions/publish?locale=en`, { method: 'POST', headers, body: '{}' });
  expect(publish.status, 'CMS publish').toBe(200);
}

/** Drop the web's cached CMS reads (the request the API sends on publish). */
async function revalidateCms(): Promise<void> {
  const res = await fetch(`${WEB}/api/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': revalidateSecret() },
    body: JSON.stringify({ tags: ['cms-content'] }),
  });
  if (!res.ok) throw new Error(`[f4] revalidate failed: ${res.status}`);
}

/** Load a page until `check` passes: the first read after a tag drop can still be stale. */
async function gotoFresh(page: Page, target: string, check: () => Promise<void>): Promise<void> {
  await expect(async () => {
    await page.goto(target);
    await check();
  }).toPass({ timeout: 30_000, intervals: [500, 1_000, 2_000] });
}

let opsApiToken: string | null = null;

/** Users-permissions JWT for the ops role (C-LEG-03 gate tests only). */
async function opsJwt(): Promise<string> {
  if (opsApiToken) return opsApiToken;
  const { email, password } = roleCredentials('ops');
  const res = await fetch(`${API}/api/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password }),
  });
  if (!res.ok) throw new Error(`[f4] ops login failed: ${res.status}`);
  opsApiToken = ((await res.json()) as { jwt: string }).jwt;
  return opsApiToken;
}

async function supportJwt(): Promise<string> {
  const res = await fetch(`${API}/api/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: process.env.E2E_OPS_SUPPORT_EMAIL ?? 'ops-support@schooltest.local',
      password: process.env.E2E_OPS_SUPPORT_PASSWORD ?? process.env.SEED_OPS_SUPPORT_PASSWORD ?? '',
    }),
  });
  if (!res.ok) throw new Error(`[f4] ops_support login failed: ${res.status}`);
  return ((await res.json()) as { jwt: string }).jwt;
}

interface PutResult {
  status: number;
  body: Record<string, unknown> | null;
}

/** C-LEG-03 — PUT /api/ops/legal-documents/:slug (kept; no longer drives the public pages). */
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

test.describe.configure({ mode: 'serial' });
test.describe.configure({ timeout: 120_000 });

test.describe('fleet4 legal documents', () => {
  test.beforeAll(() => {
    mkdirSync(CAPTURES, { recursive: true });
  });

  for (const { slug, path } of LEGAL_PAGES) {
    test(`view: ${path} renders the published CMS page with clean console`, async ({ page }) => {
      const document = await fetchCmsPage(slug);
      const errors = watchConsole(page);

      const response = await page.goto(path);
      expect(response?.status(), `${path} status`).toBe(200);
      await expect(page.getByRole('heading', { level: 1, name: document.title })).toBeVisible({
        timeout: 20_000,
      });
      if (document.version) {
        await expect(
          page.getByRole('definition').filter({ hasText: document.version }).first(),
        ).toBeVisible();
      }
      if (document.publishedDate) {
        await expect(page.locator(`time[datetime="${document.publishedDate}"]`)).toBeVisible();
      }
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

    const apiRes = await fetch(`${API}/api/pages/slug/privacy-policy-bogus?locale=en`);
    expect(apiRes.status).toBe(404);
    const legacyRes = await fetch(`${API}/api/legal-documents/privacy-policy-bogus`);
    expect(legacyRes.status).toBe(404);

    // A path-traversal-ish slug must not leak anything either.
    const traversal = await fetch(
      `${API}/api/legal-documents/${encodeURIComponent('../../platform-settings')}`,
    );
    expect(traversal.status).toBe(404);
    expect(errors, `console errors on bogus slug: ${errors.join(' | ')}`).toEqual([]);
  });

  test('edit happy path: a CMS rename reaches the public page after revalidation, then reverts', async ({
    page,
  }) => {
    const slug = 'cookie-policy';
    const original = await fetchCmsPage(slug);
    const probe = `${original.title} F4-${Date.now() % 100_000}`;
    try {
      await cmsEditAndPublish(original.documentId, { title: probe });
      expect((await fetchCmsPage(slug)).title, 'published CMS title').toBe(probe);
      await revalidateCms();

      const errors = watchConsole(page);
      await gotoFresh(page, `/${slug}`, () =>
        expect(page.getByRole('heading', { level: 1, name: probe })).toBeVisible({ timeout: 2_000 }),
      );
      await shot(page, '24-legal-cms-edit-live');
      expect(errors, `console errors after edit: ${errors.join(' | ')}`).toEqual([]);
    } finally {
      await cmsEditAndPublish(original.documentId, { title: original.title });
      await revalidateCms();
    }
    await gotoFresh(page, `/${slug}`, () =>
      expect(page.getByRole('heading', { level: 1, name: original.title })).toBeVisible({ timeout: 2_000 }),
    );
    const restored = await fetchCmsPage(slug);
    expect(restored.sections.length, 'the edit must not touch the page body').toBe(original.sections.length);
    await shot(page, '25-legal-cms-edit-reverted');
  });

  test('the ops legal-document endpoint no longer drives the public page', async ({ page }) => {
    const slug = 'cookie-policy';
    const legacy = await fetchLegalDocument(slug);
    const cms = await fetchCmsPage(slug);
    const probe = `${legacy.title} OPS-${Date.now() % 100_000}`;
    try {
      const put = await putLegal(slug, { title: probe }, await opsJwt());
      expect(put.status, `PUT title must still succeed: ${JSON.stringify(put.body)}`).toBe(200);
      await revalidateCms();
      await page.goto(`/${slug}`);
      await page.reload();
      await expect(page.getByRole('heading', { level: 1, name: cms.title })).toBeVisible({ timeout: 20_000 });
      await expect(page.getByRole('heading', { level: 1, name: probe })).toHaveCount(0);
    } finally {
      await putLegal(slug, { title: legacy.title }, await opsJwt());
    }
  });

  // C-LEG-03 gates: the ops endpoint is kept (and still guarded) even though
  // the public legal pages now render from the CMS.
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

  test('version controls: a CMS version and effective date change reach the page', async ({
    page,
  }) => {
    const slug = 'privacy-policy';
    const original = await fetchCmsPage(slug);
    const newVersion = '9.9-F4';
    const newDate = '2026-12-31';
    try {
      await cmsEditAndPublish(original.documentId, { version: newVersion, publishedDate: newDate });
      await revalidateCms();
      await gotoFresh(page, `/${slug}`, async () => {
        await expect(page.getByRole('definition').filter({ hasText: newVersion }).first()).toBeVisible({ timeout: 2_000 });
        await expect(page.locator(`time[datetime="${newDate}"]`)).toBeVisible({ timeout: 2_000 });
      });
      await shot(page, '26-legal-cms-version-bumped');
    } finally {
      await cmsEditAndPublish(original.documentId, {
        version: original.version,
        publishedDate: original.publishedDate,
      });
      await revalidateCms();
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
