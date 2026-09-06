/**
 * OPS retained tools (web) — pins the CURRENT behaviour of the four ops panels
 * that stay in the portal while the surrounding workflows are rebuilt: the
 * school form window, the section timers, the sitting recovery panel and the
 * platform test email.
 *
 * Each panel is covered on three axes:
 *  1. load-real — the panel renders what the live API serves, signed in with a
 *     REAL JWT seeded into the storage key the app itself writes (one login per
 *     role per file, inside the API's shared 20/minute auth budget);
 *  2. failure — a failed read is named, offers a retry, and the retry really
 *     refetches (the intercept is lifted and the real read succeeds);
 *  3. ops_support — the read-only banner renders and the panel behaves exactly
 *     as it does today for a support session. Where the client leaves a
 *     control ENABLED for support, the test pins that and says so: the write
 *     boundary is the API (tasks 02/31 shipped it — support writes are
 *     rejected server-side), so this spec pins the client surface, not the
 *     enforcement.
 *
 * Every intercepted fixture is validated with the schema its reader uses — the
 * shared ops contract for school detail and capabilities, the web's own
 * platform-settings schema (the shared package's zod build differs, so app
 * code imports the web schema — settings-read.spec.ts does the same) — so a
 * fake payload cannot drift from the real one. The sitting list/monitor shapes
 * have no contract module yet; those fixtures mirror the component's reads.
 *
 * Playwright with no timeout waits forever on a hidden element; every
 * interaction here is explicitly bounded.
 */
import { expect, test, type APIRequestContext, type Page, type Route } from '@playwright/test';
import {
  OPS_PORTAL_VERSION_HEADER,
  capabilitiesResponseSchema,
  schoolDetailResponseSchema,
} from '@schooltest/ops-contracts';

import { platformSettingsSchema } from '@/modules/ops/schemas/platform-settings.schema';

import { cat, icu, loadMessages } from '../helpers/i18n';
import {
  OpsFixturePrerequisiteError,
  fixtureAuthContext,
  fixtureHeaders,
} from '../helpers/ops-portal';

const en = loadMessages('en');

const AUTH_TOKEN_KEY = 'app.auth.token';
const ACTION_TIMEOUT = 20_000;
const SCHOOL_A_NAME = 'SchoolTest Demo School A';

const WINDOW_SURFACE = '[data-surface="ops-form-window"]';
const TIMERS_SURFACE = '[data-surface="ops-section-timers"]';
const TIMERS_ACTIVE = '[data-surface="ops-timers-active"]';
const RECOVERY_SURFACE = '[data-surface="ops-sitting-recovery"]';
const RECOVERY_ERROR = '[data-surface="ops-sitting-recovery-error"]';
const RECOVERY_DETAIL = '[data-surface="ops-sitting-recovery-detail"]';
const SETTINGS_READY = '[data-surface="ops-platform-settings"][data-state="ready"]';
const SETTINGS_RETRY = '[data-ops-action="settings-retry"]';
const CAPABILITIES_BANNER = '[data-slot="ops-capabilities-read-only"][data-ops-role="ops_support"]';

const TIMERS_PATH = '/dashboard/ops/timers';
const SETTINGS_ROUTE_PATH = '/dashboard/ops/settings';

const FORM_WINDOWS_ROUTE = '**/api/form-windows*';
const FORMS_ROUTE = '**/api/forms*';
const CAPABILITIES_ROUTE = '**/api/ops/capabilities*';
const SECTION_TIMERS_ROUTE = '**/api/config/section-timers*';
const CONFIGS_ROUTE = '**/api/configs*';
const PLATFORM_SETTINGS_ROUTE = '**/api/platform-settings*';
const TEST_EMAIL_ROUTE = '**/api/ops/system/test-email*';

// The recovery list and its monitor share a prefix, so both are scoped by
// pathname predicates (kept as module constants: unroute needs the same
// reference it was registered with). Globbing '/api/sittings*' would swallow
// the monitor read too.
const isSittingsList = (url: URL): boolean => url.pathname === '/api/sittings';
const isSittingMonitor = (url: URL): boolean =>
  /^\/api\/sittings\/[^/]+\/monitor$/.test(url.pathname);

const apiBaseUrl = (): string =>
  process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500';

/**
 * A fulfilled cross-origin response still faces the browser's CORS check, and
 * the portal reads carry a custom header, so the preflight is answered too —
 * otherwise every intercept would surface as a generic network failure and
 * "pass" for the wrong reason. Unlike the read-only sibling suites, this copy
 * allows POST: the test-email intercept must answer its preflight as well.
 */
function fulfilling(body: unknown, status = 200) {
  return async (route: Route): Promise<void> => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET,POST,OPTIONS',
          'access-control-allow-headers': `authorization,content-type,${OPS_PORTAL_VERSION_HEADER}`,
          'access-control-max-age': '0',
        },
      });
      return;
    }
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

const errorBody = (status: number) => ({
  data: null,
  error: { status, name: 'ApplicationError', message: 'probe', details: {} },
});

// One live login per role for the whole file. A Strapi dev reload answers
// ECONNREFUSED for tens of seconds; the login window has to outlast one.
let opsJwt: string | null = null;

async function opsToken(request: APIRequestContext): Promise<string> {
  if (opsJwt) return opsJwt;
  let lastError: unknown;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      const context = await fixtureAuthContext(request, 'ops');
      if (!context.jwt) throw new Error('[retained-tools] the ops login returned no jwt');
      opsJwt = context.jwt;
      return opsJwt;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 8000));
    }
  }
  throw lastError ?? new Error('[retained-tools] could not obtain an ops jwt');
}

async function opsHeaders(request: APIRequestContext): Promise<Record<string, string>> {
  return fixtureHeaders('ops', await opsToken(request));
}

/** Seeds a REAL JWT into the storage key the app itself writes. */
async function seedToken(page: Page, token: string): Promise<void> {
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

async function signedIn(page: Page, request: APIRequestContext): Promise<void> {
  await seedToken(page, await opsToken(request));
}

/**
 * The support fixture account is optional on this stack: when its credentials
 * are not configured the support axes skip rather than fail.
 */
async function supportSignedIn(page: Page, request: APIRequestContext): Promise<void> {
  try {
    const context = await fixtureAuthContext(request, 'ops_support');
    if (!context.jwt) throw new Error('[retained-tools] the ops_support login returned no jwt');
    await seedToken(page, context.jwt);
  } catch (error) {
    if (error instanceof OpsFixturePrerequisiteError) {
      test.skip(true, error.message);
    }
    throw error;
  }
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
      `[retained-tools] seeded school "${name}" not found. Present: ${rows.map((row) => row.name).join(', ')}`,
    );
  }
  schoolCache.set(name, school.documentId);
  return school.documentId;
}

const gotoSchool = (page: Page, documentId: string): Promise<void> =>
  page.goto(`/dashboard/ops/schools/${documentId}`).then(() => undefined);

/** A school detail row the shared contract itself accepts. */
function schoolFixtureBody(documentId: string) {
  return schoolDetailResponseSchema.parse({
    data: {
      documentId,
      name: 'Demo School',
      account_status: 'active',
      onboarding_status: 'complete',
      plan: null,
      portal_plan: null,
      portal_status: null,
      billing_status: null,
      trial_ends_at: null,
      retention_until: null,
      suspended_at: null,
      teacher_count: 0,
      portal_teacher_count: 0,
      admin_count: 0,
      class_count: 0,
      student_count: 0,
      results_count: 0,
      suburb: null,
      state: null,
      sector: null,
      postcode: null,
      schoolType: null,
      contact_email: null,
      contact_first_name: null,
      contact_last_name: null,
      contact_name: null,
      phone: null,
      createdAt: null,
      updatedAt: '2026-01-01T00:00:00.000Z',
      last_active_at: null,
      cover_image_url: null,
    },
  });
}

/** The capabilities payload of a read-only support session, contract-checked. */
function capabilitiesSupportBody() {
  return capabilitiesResponseSchema.parse({
    data: {
      actor: {
        documentId: 'supdoc1',
        first_name: null,
        last_name: null,
        email: 'support@example.com',
        role: 'ops_support',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      capabilities: { read: true, write: false, export: true, view_as_teacher: false, edit_self: true },
      status_page_url: null,
    },
  });
}

/** A platform settings row the web's own reader schema accepts. */
function settingsFixtureBody() {
  return {
    data: platformSettingsSchema.parse({
      documentId: 'platformsettings1',
      site_name: 'SchoolTest',
      site_tagline: null,
      seo_default_title: null,
      seo_default_description: null,
      seo_default_og_image: null,
      maintenance_mode: false,
      maintenance_message: null,
      announcement_enabled: false,
      announcement_message: null,
      announcement_level: 'info',
      session_timeout_minutes: 30,
      upload_max_size_mb: 10,
      pagination_default_page_size: 25,
      pagination_max_page_size: 100,
      email_provider: 'console',
      email_from_name: null,
      email_from_address: 'ops@example.com',
      email_reply_to: null,
      rate_limit_auth_max: 20,
      rate_limit_auth_window_ms: 60000,
      feature_flags: null,
      sitemap_generated_at: null,
      last_backup_at: null,
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
  };
}

const TIMERS_FIXTURE = {
  data: {
    sections: [
      { stage: 1, duration_seconds: 60 },
      { stage: 2, duration_seconds: 900 },
      { stage: 3, duration_seconds: 3600 },
    ],
  },
};

const SITTING_ROW = {
  documentId: 'sittingretainedtools01',
  code: 'R-1',
  status: 'open',
  skill: 'reading',
  createdAt: '2026-01-01T00:00:00.000Z',
  class: { documentId: 'cls1', name: 'Year 7' },
};

const MONITOR_BODY = {
  data: {
    sitting: { documentId: SITTING_ROW.documentId, code: 'R-1', status: 'open' },
    students: [
      {
        documentId: 'stu1',
        given_name: 'Ada',
        family_name: 'Lovelace',
        email: null,
        state: 'joined',
        session_documentId: null,
      },
    ],
  },
};

const testEmailBody = (to: string) => ({
  data: { sent: true, to, subject: 'Test email', provider: 'console' },
});

// The default 30s test timeout does not cover the shared-IP rate-limit pacing
// around the one login per role; every interaction inside is bounded anyway.
test.describe.configure({ mode: 'serial', timeout: 150_000 });

test.describe('ops retained tools — school form window', () => {
  test('loads the live form window panel for a seeded school', async ({ page, request }) => {
    await signedIn(page, request);
    await gotoSchool(page, await seededSchoolId(request, SCHOOL_A_NAME));

    await expect(page.locator(WINDOW_SURFACE)).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(
      page.getByRole('heading', { name: cat(en, 'Ops.window.title'), exact: true }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('reports when no window has been set for the school', async ({ page, request }) => {
    const school = await seededSchoolId(request, SCHOOL_A_NAME);
    await page.route(FORM_WINDOWS_ROUTE, fulfilling(listBody([])));
    await page.route(FORMS_ROUTE, fulfilling(listBody([])));
    await signedIn(page, request);
    await gotoSchool(page, school);

    await expect(page.locator(WINDOW_SURFACE)).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(
      page.getByText(cat(en, 'Ops.window.currentNone'), { exact: true }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('a failed window read is named and retryable', async ({ page, request }) => {
    const school = await seededSchoolId(request, SCHOOL_A_NAME);
    await page.route(FORM_WINDOWS_ROUTE, fulfilling(errorBody(500), 500));
    await signedIn(page, request);
    await gotoSchool(page, school);

    await expect(
      page.getByText(cat(en, 'Ops.window.loadErrorTitle'), { exact: true }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
    const retry = page.getByRole('button', { name: cat(en, 'Ops.window.retry'), exact: true });
    await expect(retry).toBeVisible({ timeout: ACTION_TIMEOUT });
    // A failure must NOT render the panel: an empty editor reads as "no window
    // is set", which is a different and untrue statement.
    await expect(page.locator(WINDOW_SURFACE)).toHaveCount(0);

    await page.unroute(FORM_WINDOWS_ROUTE);
    await retry.click({ timeout: ACTION_TIMEOUT });
    await expect(page.locator(WINDOW_SURFACE)).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('support sees the school error state, not the window editor', async ({ page, request }) => {
    const school = await seededSchoolId(request, SCHOOL_A_NAME);
    await supportSignedIn(page, request);
    await page.route(`**/api/ops/schools/${school}`, fulfilling(errorBody(403), 403));
    await gotoSchool(page, school);

    await expect(
      page.getByText(cat(en, 'Ops.detail.errorTitle'), { exact: true }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.locator(WINDOW_SURFACE)).toHaveCount(0);
  });

  test('support reads the window panel; the client leaves its editor enabled today', async ({
    page,
    request,
  }) => {
    const school = await seededSchoolId(request, SCHOOL_A_NAME);
    await supportSignedIn(page, request);
    await page.route(`**/api/ops/schools/${school}`, fulfilling(schoolFixtureBody(school)));
    await page.route(CAPABILITIES_ROUTE, fulfilling(capabilitiesSupportBody()));
    await page.route(FORM_WINDOWS_ROUTE, fulfilling(listBody([])));
    await page.route(FORMS_ROUTE, fulfilling(listBody([])));
    await gotoSchool(page, school);

    await expect(page.locator(CAPABILITIES_BANNER)).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.locator(WINDOW_SURFACE)).toBeVisible({ timeout: ACTION_TIMEOUT });
    // Pinned client behaviour: the write boundary is the API (tasks 02/31
    // shipped it), not disabled controls — support keeps these enabled.
    await expect(page.locator('#ops-window-form')).toBeEnabled({ timeout: ACTION_TIMEOUT });
    await expect(
      page.getByRole('button', { name: cat(en, 'Ops.window.saveButton'), exact: true }),
    ).toBeEnabled({ timeout: ACTION_TIMEOUT });
  });
});

test.describe('ops retained tools — section timers', () => {
  test('loads the live timer editor', async ({ page, request }) => {
    await signedIn(page, request);
    await page.goto(TIMERS_PATH);

    await expect(page.locator(TIMERS_SURFACE)).toBeVisible({ timeout: ACTION_TIMEOUT });
    for (const stage of [1, 2, 3]) {
      await expect(page.locator(`#ops-timer-section-${stage}`)).toBeVisible({
        timeout: ACTION_TIMEOUT,
      });
    }
  });

  test('a failed timers read is named and retryable', async ({ page, request }) => {
    await signedIn(page, request);
    await page.route(SECTION_TIMERS_ROUTE, fulfilling(errorBody(500), 500));
    await page.goto(TIMERS_PATH);

    await expect(
      page.getByText(cat(en, 'Ops.timers.loadErrorTitle'), { exact: true }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
    const retry = page.getByRole('button', { name: cat(en, 'Ops.timers.retry'), exact: true });
    await expect(retry).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.locator(TIMERS_ACTIVE)).toHaveCount(0);

    await page.unroute(SECTION_TIMERS_ROUTE);
    await retry.click({ timeout: ACTION_TIMEOUT });
    await expect(page.locator(TIMERS_ACTIVE)).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('support sees the failure named, behind the read-only banner', async ({
    page,
    request,
  }) => {
    await supportSignedIn(page, request);
    await page.route(CAPABILITIES_ROUTE, fulfilling(capabilitiesSupportBody()));
    await page.route(SECTION_TIMERS_ROUTE, fulfilling(errorBody(403), 403));
    await page.goto(TIMERS_PATH);

    await expect(page.locator(CAPABILITIES_BANNER)).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(
      page.getByText(cat(en, 'Ops.timers.loadErrorTitle'), { exact: true }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(
      page.getByRole('button', { name: cat(en, 'Ops.timers.retry'), exact: true }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.locator(TIMERS_ACTIVE)).toHaveCount(0);
  });

  test('support reads the timers; the client leaves the editor enabled today', async ({
    page,
    request,
  }) => {
    await supportSignedIn(page, request);
    await page.route(CAPABILITIES_ROUTE, fulfilling(capabilitiesSupportBody()));
    await page.route(SECTION_TIMERS_ROUTE, fulfilling(TIMERS_FIXTURE));
    await page.route(CONFIGS_ROUTE, fulfilling(listBody([])));
    await page.goto(TIMERS_PATH);

    await expect(page.locator(CAPABILITIES_BANNER)).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.locator(`${TIMERS_ACTIVE} [data-timer-stage]`)).toHaveCount(3, {
      timeout: ACTION_TIMEOUT,
    });
    // Whole stored minutes are what the editor shows.
    await expect(page.locator('#ops-timer-section-1')).toHaveValue('1');
    await expect(page.locator('#ops-timer-section-2')).toHaveValue('15');
    await expect(page.locator('#ops-timer-section-3')).toHaveValue('60');
    // Pinned client behaviour, as on the form window: the write boundary is
    // the API (tasks 02/31 shipped it); these controls stay enabled for
    // ops_support.
    for (const stage of [1, 2, 3]) {
      await expect(page.locator(`#ops-timer-section-${stage}`)).toBeEnabled({
        timeout: ACTION_TIMEOUT,
      });
    }
    await expect(
      page.getByRole('button', { name: cat(en, 'Ops.timers.saveButton'), exact: true }),
    ).toBeEnabled({ timeout: ACTION_TIMEOUT });
  });
});

test.describe('ops retained tools — sitting recovery', () => {
  test('reports a school with no sittings instead of a broken picker', async ({
    page,
    request,
  }) => {
    const school = await seededSchoolId(request, SCHOOL_A_NAME);
    await page.route(isSittingsList, fulfilling(listBody([])));
    await signedIn(page, request);
    await gotoSchool(page, school);

    await expect(page.locator(RECOVERY_SURFACE)).toBeVisible({ timeout: ACTION_TIMEOUT });
    const picker = page
      .locator(RECOVERY_SURFACE)
      .getByLabel(cat(en, 'Ops.recovery.pickerLabel'), { exact: true });
    await expect(picker).toBeDisabled({ timeout: ACTION_TIMEOUT });
    await expect(
      page.getByText(cat(en, 'Ops.recovery.empty'), { exact: true }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('a failed sitting list is named and retryable', async ({ page, request }) => {
    const school = await seededSchoolId(request, SCHOOL_A_NAME);
    await page.route(isSittingsList, fulfilling(errorBody(500), 500));
    await signedIn(page, request);
    await gotoSchool(page, school);

    const failure = page.locator(RECOVERY_ERROR);
    await expect(failure).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(
      failure.getByText(cat(en, 'Ops.recovery.loadErrorTitle'), { exact: true }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
    const retry = failure.getByRole('button', { name: cat(en, 'Ops.recovery.retry'), exact: true });
    await expect(retry).toBeVisible({ timeout: ACTION_TIMEOUT });

    await page.unroute(isSittingsList);
    await retry.click({ timeout: ACTION_TIMEOUT });
    await expect(page.locator(RECOVERY_ERROR)).toHaveCount(0);
    await expect(
      page.locator(RECOVERY_SURFACE).getByLabel(cat(en, 'Ops.recovery.pickerLabel'), { exact: true }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('the invalidate action stays behind its confirmation dialog', async ({ page, request }) => {
    const school = await seededSchoolId(request, SCHOOL_A_NAME);
    await page.route(isSittingsList, fulfilling(listBody([SITTING_ROW])));
    await page.route(isSittingMonitor, fulfilling(MONITOR_BODY));

    const writes: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/sittings')) writes.push(req.url());
    });

    await signedIn(page, request);
    await gotoSchool(page, school);

    const panel = page.locator(RECOVERY_SURFACE);
    await expect(panel).toBeVisible({ timeout: ACTION_TIMEOUT });
    await panel
      .getByLabel(cat(en, 'Ops.recovery.pickerLabel'), { exact: true })
      .click({ timeout: ACTION_TIMEOUT });
    await page
      .getByRole('option', { name: 'R-1 - Year 7 (open)', exact: true })
      .click({ timeout: ACTION_TIMEOUT });

    const detail = panel.locator(RECOVERY_DETAIL);
    await expect(detail).toBeVisible({ timeout: ACTION_TIMEOUT });
    const invalidate = detail.getByRole('button', {
      name: cat(en, 'Ops.recovery.invalidateButton'),
      exact: true,
    });
    await expect(invalidate).toBeEnabled({ timeout: ACTION_TIMEOUT });

    await invalidate.click({ timeout: ACTION_TIMEOUT });
    const confirmBody = page.getByText(cat(en, 'Ops.recovery.confirmBody'), { exact: true });
    await expect(confirmBody).toBeVisible({ timeout: ACTION_TIMEOUT });
    await page
      .getByRole('button', { name: cat(en, 'Ops.recovery.cancel'), exact: true })
      .click({ timeout: ACTION_TIMEOUT });
    await expect(confirmBody).toBeHidden({ timeout: ACTION_TIMEOUT });

    // Cancelling the dialog wrote nothing: no POST left the page.
    expect(writes).toEqual([]);
  });

  test('support sees the school error state, not the recovery panel', async ({ page, request }) => {
    const school = await seededSchoolId(request, SCHOOL_A_NAME);
    await supportSignedIn(page, request);
    await page.route(`**/api/ops/schools/${school}`, fulfilling(errorBody(403), 403));
    await gotoSchool(page, school);

    await expect(
      page.getByText(cat(en, 'Ops.detail.errorTitle'), { exact: true }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.locator(RECOVERY_SURFACE)).toHaveCount(0);
  });

  test('support reads the recovery panel; the client leaves its picker enabled today', async ({
    page,
    request,
  }) => {
    const school = await seededSchoolId(request, SCHOOL_A_NAME);
    await supportSignedIn(page, request);
    await page.route(`**/api/ops/schools/${school}`, fulfilling(schoolFixtureBody(school)));
    await page.route(CAPABILITIES_ROUTE, fulfilling(capabilitiesSupportBody()));
    await page.route(isSittingsList, fulfilling(listBody([SITTING_ROW])));
    await gotoSchool(page, school);

    await expect(page.locator(CAPABILITIES_BANNER)).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.locator(RECOVERY_SURFACE)).toBeVisible({ timeout: ACTION_TIMEOUT });
    // Pinned client behaviour, as on the form window: the write boundary is
    // the API (tasks 02/31 shipped it); the picker stays enabled for
    // ops_support.
    await expect(
      page.locator(RECOVERY_SURFACE).getByLabel(cat(en, 'Ops.recovery.pickerLabel'), { exact: true }),
    ).toBeEnabled({ timeout: ACTION_TIMEOUT });
  });
});

test.describe('ops retained tools — platform test email', () => {
  test('loads the settings form and gates sending on a recipient', async ({ page, request }) => {
    await signedIn(page, request);
    await page.goto(SETTINGS_ROUTE_PATH);

    await expect(page.locator(SETTINGS_READY)).toBeVisible({ timeout: ACTION_TIMEOUT });
    const recipient = page.locator('#test-email-to');
    await expect(recipient).toBeVisible({ timeout: ACTION_TIMEOUT });
    const send = page.getByRole('button', {
      name: cat(en, 'Ops.settings.testEmail.send'),
      exact: true,
    });
    await expect(send).toBeDisabled({ timeout: ACTION_TIMEOUT });
    await recipient.fill('ops@example.com');
    await expect(send).toBeEnabled({ timeout: ACTION_TIMEOUT });
  });

  test('a rejected send names the provider failure', async ({ page, request }) => {
    await signedIn(page, request);
    // No error key on purpose: the panel falls back to its catalog copy when
    // the API does not name the failure, and that fallback is what is pinned.
    await page.route(TEST_EMAIL_ROUTE, fulfilling({ data: null }, 500));
    await page.goto(SETTINGS_ROUTE_PATH);

    await expect(page.locator(SETTINGS_READY)).toBeVisible({ timeout: ACTION_TIMEOUT });
    await page.locator('#test-email-to').fill('ops@example.com');
    await page
      .getByRole('button', { name: cat(en, 'Ops.settings.testEmail.send'), exact: true })
      .click({ timeout: ACTION_TIMEOUT });
    await expect(
      page.getByText(cat(en, 'Ops.settings.testEmail.errorToast'), { exact: true }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('a successful send confirms recipient and provider', async ({ page, request }) => {
    await signedIn(page, request);
    await page.route(TEST_EMAIL_ROUTE, fulfilling(testEmailBody('ops@example.com')));
    await page.goto(SETTINGS_ROUTE_PATH);

    await expect(page.locator(SETTINGS_READY)).toBeVisible({ timeout: ACTION_TIMEOUT });
    await page.locator('#test-email-to').fill('ops@example.com');
    await page
      .getByRole('button', { name: cat(en, 'Ops.settings.testEmail.send'), exact: true })
      .click({ timeout: ACTION_TIMEOUT });
    await expect(
      page.getByText(
        icu(cat(en, 'Ops.settings.testEmail.sentToast'), { to: 'ops@example.com', provider: 'console' }),
        { exact: true },
      ),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('support sees the settings error state, not the test email panel', async ({
    page,
    request,
  }) => {
    await supportSignedIn(page, request);
    await page.route(PLATFORM_SETTINGS_ROUTE, fulfilling(errorBody(403), 403));
    await page.goto(SETTINGS_ROUTE_PATH);

    await expect(
      page.getByText(cat(en, 'Ops.settings.errorTitle'), { exact: true }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.locator(SETTINGS_RETRY)).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.locator(SETTINGS_READY)).toHaveCount(0);
    await expect(page.locator('#test-email-to')).toHaveCount(0);
  });

  test('support reads the settings; the client leaves the test email send enabled today', async ({
    page,
    request,
  }) => {
    await supportSignedIn(page, request);
    await page.route(PLATFORM_SETTINGS_ROUTE, fulfilling(settingsFixtureBody()));
    await page.route(CAPABILITIES_ROUTE, fulfilling(capabilitiesSupportBody()));
    await page.route(TEST_EMAIL_ROUTE, fulfilling(testEmailBody('support@example.com')));
    await page.goto(SETTINGS_ROUTE_PATH);

    await expect(page.locator(CAPABILITIES_BANNER)).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.locator(SETTINGS_READY)).toBeVisible({ timeout: ACTION_TIMEOUT });
    // Pinned client behaviour, as on the form window: the write boundary is
    // the API (tasks 02/31 shipped it); the send control stays enabled for
    // ops_support.
    const recipient = page.locator('#test-email-to');
    await recipient.fill('support@example.com');
    const send = page.getByRole('button', {
      name: cat(en, 'Ops.settings.testEmail.send'),
      exact: true,
    });
    await expect(send).toBeEnabled({ timeout: ACTION_TIMEOUT });
    await send.click({ timeout: ACTION_TIMEOUT });
    await expect(
      page.getByText(
        icu(cat(en, 'Ops.settings.testEmail.sentToast'), {
          to: 'support@example.com',
          provider: 'console',
        }),
        { exact: true },
      ),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
  });
});
