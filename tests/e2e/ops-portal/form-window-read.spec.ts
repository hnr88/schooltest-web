/**
 * OPS-062 — the ops school detail loads ONE school form window and its real
 * form (C-OPS-PORTAL-052). Signs in as ops through the real form and proves the
 * panel renders what the live API serves, that the read is sent with the
 * contracted query, and that the three stored-data states the task names
 * (no window, duplicate rows, a window whose form is gone) are reported rather
 * than collapsed into `rows[0]`.
 *
 * The contract comes from `@schooltest/ops-contracts`
 * (mvp/contracts/ops/src/form-window-read.ts) — the same module the Strapi
 * projection, the typed client and the API suite read. Every intercepted
 * fixture below is validated with that module's own schema, so a fake payload
 * cannot drift from the real one.
 *
 * Playwright with no timeout waits forever on a hidden element; every
 * interaction here is explicitly bounded.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page, type Route } from '@playwright/test';
import {
  OPS_PORTAL_VERSION,
  OPS_PORTAL_VERSION_HEADER,
  formWindowListSchema,
  formWindowReadParams,
  resolveSchoolFormWindow,
} from '@schooltest/ops-contracts';

import { cat, loadMessages } from '../helpers/i18n';
import { fixtureAuthContext, fixtureHeaders } from '../helpers/ops-portal';
import { loginAs } from '../helpers/roles';

const en = loadMessages('en');
const SURFACE = '[data-surface="ops-form-window"]';
const CURRENT = '[data-surface="ops-form-window-current"]';
const INTEGRITY = '[data-surface="ops-form-window-integrity"]';
const INCOMPLETE = '[data-surface="ops-form-window-incomplete"]';
const API_ROUTE = '**/api/form-windows*';
const ACTION_TIMEOUT = 20_000;
const SCHOOL_A_NAME = 'SchoolTest Demo School A';
const SCHOOL_B_NAME = 'SchoolTest Demo School B';
const OPENS_AT = '2027-03-01T00:00:00.000Z';
const CLOSES_AT = '2027-03-31T23:59:00.000Z';
const CAPTURES = path.resolve(
  __dirname,
  '../../../../.codephant/missions/msn-ab5a6a54-f385-42e1-826a-aeba2bbdbc66/captures',
);

const apiBaseUrl = (): string =>
  process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500';

/**
 * A fulfilled cross-origin response still faces the browser's CORS check, and
 * the portal read carries a custom header, so the preflight is answered too —
 * otherwise every intercept would surface as a generic network failure and
 * "pass" for the wrong reason.
 */
function fulfilling(body: unknown, status = 200, delayMs = 0) {
  return async (route: Route): Promise<void> => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET,OPTIONS',
          'access-control-allow-headers': `authorization,content-type,${OPS_PORTAL_VERSION_HEADER}`,
          'access-control-max-age': '0',
        },
      });
      return;
    }
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fulfill({
      status,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(body),
    });
  };
}

const listBody = (rows: unknown[]) => ({
  data: rows,
  meta: { pagination: { page: 1, pageSize: 25, pageCount: rows.length === 0 ? 0 : 1, total: rows.length } },
});

const windowRow = (
  documentId: string,
  schoolDocumentId: string,
  form: { documentId: string; form_code: string } | null,
) => ({ documentId, school: { documentId: schoolDocumentId }, form, opens_at: OPENS_AT, closes_at: CLOSES_AT });

async function opsHeaders(request: APIRequestContext): Promise<Record<string, string>> {
  const context = await fixtureAuthContext(request, 'ops');
  return fixtureHeaders('ops', context.jwt ?? undefined);
}

const schoolCache = new Map<string, string>();

async function seededSchoolId(request: APIRequestContext, name: string): Promise<string> {
  const cached = schoolCache.get(name);
  if (cached) return cached;
  const res = await request.get(`${apiBaseUrl()}/api/ops/schools`, {
    headers: await opsHeaders(request),
  });
  expect(res.status(), await res.text()).toBe(200);
  const rows = ((await res.json()) as { data: { documentId: string; name: string | null }[] }).data;
  const school = rows.find((row) => row.name === name);
  if (!school) {
    throw new Error(
      `[OPS-062] seeded school "${name}" not found. Present: ${rows.map((row) => row.name).join(', ')}`,
    );
  }
  schoolCache.set(name, school.documentId);
  return school.documentId;
}

/** Read the school's window straight from the API, through the shared contract. */
async function servedWindow(request: APIRequestContext, schoolDocumentId: string) {
  const params = new URLSearchParams(
    Object.entries(formWindowReadParams(schoolDocumentId)).map(([key, value]) => [
      key,
      String(value),
    ]),
  );
  const res = await request.get(`${apiBaseUrl()}/api/form-windows?${params.toString()}`, {
    headers: await opsHeaders(request),
  });
  expect(res.status(), await res.text()).toBe(200);
  return resolveSchoolFormWindow(formWindowListSchema.parse(await res.json()).data);
}

/**
 * The active reading form the window points at. A seeded form is always
 * preferred; when the stack carries none (this environment's `forms` table is
 * empty — the form/item seed has not run) ONE real fixture form is created
 * through the real core route, because a window cannot exist without a form and
 * a fabricated row would prove nothing. Idempotent: the next run finds it.
 */
const FIXTURE_FORM_CODE = 'ops062-fixture-reading';

async function activeReadingForm(
  request: APIRequestContext,
  headers: Record<string, string>,
): Promise<{ documentId: string; form_code: string }> {
  const listed = await request.get(
    `${apiBaseUrl()}/api/forms?filters[skill][$eq]=reading&filters[active][$eq]=true&fields[0]=form_code&sort[0]=form_code:asc&pagination[pageSize]=1`,
    { headers },
  );
  expect(listed.status(), await listed.text()).toBe(200);
  const rows = ((await listed.json()) as { data: { documentId: string; form_code: string }[] }).data;
  if (rows.length > 0) return rows[0];

  const created = await request.post(`${apiBaseUrl()}/api/forms`, {
    headers,
    data: {
      data: {
        form_code: FIXTURE_FORM_CODE,
        skill: 'reading',
        mode: 'placement',
        year_band: '7_9',
        active: true,
      },
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  return ((await created.json()) as { data: { documentId: string; form_code: string } }).data;
}

/**
 * Precondition, written with the real C-WIN-01 replace: School A has exactly
 * one window. Its CURRENT form is reused when set, so the FORM_LOCKED guard
 * (which only fires on a form change for an overlapping period) cannot make
 * this flaky.
 */
async function ensureSchoolAWindow(request: APIRequestContext, schoolA: string): Promise<string> {
  const headers = await opsHeaders(request);
  const current = await servedWindow(request, schoolA);
  const form =
    current.kind === 'one' ? current.window.form : await activeReadingForm(request, headers);
  const put = await request.put(`${apiBaseUrl()}/api/schools/${schoolA}/form-window`, {
    headers,
    data: { form_documentId: form.documentId, opens_at: OPENS_AT, closes_at: CLOSES_AT },
  });
  expect(put.status(), await put.text()).toBe(200);
  return form.form_code;
}

/**
 * The app keeps its JWT in localStorage under `app.auth.token`
 * (src/lib/axios/strapi.ts). Seeding a REAL token obtained from the real
 * /api/auth/local is exactly what the sign-in form does, and it keeps the suite
 * inside the API's brute-force budget (20 logins per minute per IP, shared with
 * every other suite on this stack). The FIRST test still drives the real form,
 * so the sign-in path itself is proven rather than assumed.
 */
const AUTH_TOKEN_KEY = 'app.auth.token';

async function signedIn(page: Page, request: APIRequestContext): Promise<void> {
  const context = await fixtureAuthContext(request, 'ops');
  const token = context.jwt;
  if (!token) throw new Error('[OPS-062] no ops JWT for the seeded session');
  await page.addInitScript(
    ([key, value]) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* a browser blocking site data fails the assertions, not this helper */
      }
    },
    [AUTH_TOKEN_KEY, token] as const,
  );
}

async function openSchool(page: Page, documentId: string): Promise<void> {
  await page.goto(`/dashboard/ops/schools/${documentId}`);
  await expect(page.locator(SURFACE)).toBeVisible({ timeout: ACTION_TIMEOUT });
}

// The default 30s test timeout does not cover a real sign-in plus the shared-IP
// rate-limit pacing in helpers/roles.ts; every interaction inside is still
// bounded explicitly.
test.describe.configure({ mode: 'serial', timeout: 150_000 });

test.describe('OPS-062 the ops school detail reads one form window', () => {
  test.beforeAll(async () => {
    await mkdir(CAPTURES, { recursive: true });
  });

  test('renders the window the API serves, requested with the contract query', async ({
    page,
    request,
  }) => {
    const schoolA = await seededSchoolId(request, SCHOOL_A_NAME);
    const formCode = await ensureSchoolAWindow(request, schoolA);

    const sent: { url: string; version: string | undefined }[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/form-windows')) {
        sent.push({ url: req.url(), version: req.headers()[OPS_PORTAL_VERSION_HEADER.toLowerCase()] });
      }
    });

    await loginAs(page, 'ops');
    await openSchool(page, schoolA);

    await expect(page.locator(CURRENT)).toContainText(formCode, { timeout: ACTION_TIMEOUT });
    await expect(page.locator(INTEGRITY)).toHaveCount(0);
    await expect(page.locator(INCOMPLETE)).toHaveCount(0);

    const served = await servedWindow(request, schoolA);
    expect(served.kind).toBe('one');
    if (served.kind === 'one') {
      expect(served.window.school.documentId).toBe(schoolA);
      expect(served.window.form.form_code).toBe(formCode);
    }

    // The screen asked for exactly the contracted query: school-scoped filter,
    // explicit school AND form population, bounded core pagination.
    const read = sent.find((entry) => entry.url.includes('filters%5Bschool%5D'));
    expect(read, `no /api/form-windows read observed: ${JSON.stringify(sent)}`).toBeTruthy();
    const url = decodeURIComponent(read?.url ?? '');
    expect(url).toContain(`filters[school][documentId][$eq]=${schoolA}`);
    expect(url).toContain('populate[school][fields][0]=documentId');
    expect(url).toContain('populate[form][fields][0]=form_code');
    expect(url).toContain('pagination[page]=1');
    expect(url).toContain('pagination[pageSize]=25');
    expect(read?.version).toBe(OPS_PORTAL_VERSION);
  });

  test('a school with no window shows the no-window copy, not an empty row', async ({
    page,
    request,
  }) => {
    const schoolB = await seededSchoolId(request, SCHOOL_B_NAME);
    expect((await servedWindow(request, schoolB)).kind).toBe('none');

    await signedIn(page, request);
    await openSchool(page, schoolB);

    await expect(
      page.locator(SURFACE).getByText(cat(en, 'Ops.window.currentNone'), { exact: true }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.locator(CURRENT)).toHaveCount(0);
    await expect(page.locator(INTEGRITY)).toHaveCount(0);
  });

  test('duplicate rows are an integrity error, never silently the first row', async ({
    page,
    request,
  }) => {
    const schoolA = await seededSchoolId(request, SCHOOL_A_NAME);
    const rows = [
      windowRow('winoneoneoneoneoneoneone', schoolA, { documentId: 'formaaaaaaaaaaaaaaaaaaaa', form_code: 'RDG-DUP-A' }),
      windowRow('wintwotwotwotwotwotwotwo', schoolA, { documentId: 'formbbbbbbbbbbbbbbbbbbbb', form_code: 'RDG-DUP-B' }),
    ];
    const body = listBody(rows);
    // The fixture is the contract's own shape, not an invented one.
    expect(formWindowListSchema.parse(body).data).toHaveLength(2);

    await signedIn(page, request);
    await page.route(API_ROUTE, fulfilling(body));
    await openSchool(page, schoolA);

    await expect(page.locator(INTEGRITY)).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.locator(CURRENT)).toHaveCount(0);
    await expect(page.locator(SURFACE)).not.toContainText('RDG-DUP-A');
    await page.unroute(API_ROUTE);
  });

  test('a window whose form is gone is reported, not rendered as live', async ({
    page,
    request,
  }) => {
    const schoolA = await seededSchoolId(request, SCHOOL_A_NAME);
    const body = listBody([windowRow('winorphanorphanorphanor', schoolA, null)]);
    expect(formWindowListSchema.parse(body).data).toHaveLength(1);

    await signedIn(page, request);
    await page.route(API_ROUTE, fulfilling(body));
    await openSchool(page, schoolA);

    await expect(page.locator(INCOMPLETE)).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.locator(CURRENT)).toHaveCount(0);
    await page.unroute(API_ROUTE);
  });

  test('a failed read shows the error state with a retry affordance', async ({ page, request }) => {
    const schoolA = await seededSchoolId(request, SCHOOL_A_NAME);
    await signedIn(page, request);
    await page.route(
      API_ROUTE,
      fulfilling(
        {
          data: null,
          error: { status: 500, name: 'ApplicationError', message: 'boom', details: {} },
        },
        500,
      ),
    );
    await page.goto(`/dashboard/ops/schools/${schoolA}`);

    await expect(
      page.getByText(cat(en, 'Ops.window.loadErrorTitle'), { exact: true }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(
      page.getByRole('button', { name: cat(en, 'Ops.window.retry'), exact: true }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
    await page.unroute(API_ROUTE);
  });

  test('the read is keyed by school, so a stale school never lands on the next one', async ({
    page,
    request,
  }) => {
    const schoolA = await seededSchoolId(request, SCHOOL_A_NAME);
    const schoolB = await seededSchoolId(request, SCHOOL_B_NAME);
    const stale = listBody([
      windowRow('winstalestalestalestale', schoolA, {
        documentId: 'formstalestalestalestal',
        form_code: 'RDG-STALE-A',
      }),
    ]);

    await signedIn(page, request);
    // School A's read is held open; School B's answers immediately. Navigating
    // away cancels the in-flight request, and the key is per school, so A's
    // answer can never be shown on B.
    await page.route(API_ROUTE, async (route) => {
      const url = route.request().url();
      if (url.includes(schoolA)) return fulfilling(stale, 200, 4000)(route);
      return fulfilling(listBody([]))(route);
    });

    await page.goto(`/dashboard/ops/schools/${schoolA}`);
    await page.goto(`/dashboard/ops/schools/${schoolB}`);
    await expect(page.locator(SURFACE)).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(
      page.locator(SURFACE).getByText(cat(en, 'Ops.window.currentNone'), { exact: true }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
    await page.waitForTimeout(5000);
    await expect(page.locator(SURFACE)).not.toContainText('RDG-STALE-A');
    await page.unroute(API_ROUTE);
  });

  test('captures the panel at the reference desktop viewport, 375px and 200% zoom', async ({
    page,
    request,
  }) => {
    const schoolA = await seededSchoolId(request, SCHOOL_A_NAME);
    await ensureSchoolAWindow(request, schoolA);
    await signedIn(page, request);

    for (const [name, size] of [
      ['062-form-window-desktop-1440.png', { width: 1440, height: 1000 }],
      ['062-form-window-mobile-375.png', { width: 375, height: 812 }],
      // 200% browser zoom halves the CSS viewport (WCAG 1.4.10 reflow).
      ['062-form-window-zoom-200.png', { width: 720, height: 500 }],
    ] as const) {
      await page.setViewportSize(size);
      await openSchool(page, schoolA);
      const panel = page.locator(SURFACE);
      await panel.scrollIntoViewIfNeeded({ timeout: ACTION_TIMEOUT });
      await expect(page.locator(CURRENT)).toBeVisible({ timeout: ACTION_TIMEOUT });
      await page.screenshot({ path: path.join(CAPTURES, name) });
      // Scoped to this panel: a shell-level overflow belongs to another owner.
      const overflow = await panel.evaluate(
        (node) => node.scrollWidth - node.clientWidth,
      );
      expect(overflow, `${name} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
    }
  });
});
