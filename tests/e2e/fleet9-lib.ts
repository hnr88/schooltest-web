import { expect, type APIRequestContext, type Page } from '@playwright/test';

import { roleCredentials, type AppRole } from './helpers/credentials';
import { fetchConfirmationLink, API_BASE_URL } from './helpers/mailpit';

/**
 * F9 shared scratch helpers (fleet agent F9, parent-surface live pass).
 *
 * WHY THIS EXISTS INSTEAD OF helpers/throwaway-parent.ts: that helper polls the
 * parent-role grant through helpers/auth-db.ts `runSql`, and on THIS host the
 * psql CLI is absent so the fallback reads `schooltest-api-st1-postgres` — a
 * container whose `schooltest` DB is a DIFFERENT dataset (206 users) from the
 * live dev DB the API writes (127.0.0.1:5540, 433+ users). The poll therefore
 * never sees the grant and every runSql-reliant spec fails spuriously (measured
 * on 028/051). F9 specs must not depend on that broken plumbing, so role
 * confirmation here polls the REAL authenticated API (`GET /api/users/me`)
 * instead of any database.
 */

/** Screenshot staging dir; copied into tests/e2e/captures/fleet9 after the run
 *  (inotify pressure: the live Turbopack dev server panics when a globbed dir
 *  inside the repo gains files mid-run — see fleet9-probe.spec.ts). */
export const SHOTS = '/tmp/fleet9-shots';

export const MASK_TITLE = 'Not part of this release';
export const MASK_SLOT = '[data-slot="parent-views-unavailable"]';

/** Paced API login — 20 POST /api/auth/local per minute per IP (AUTH_RATELIMIT_MAX).
 *  Retries through dev-restart windows (the shared API hot-reloads when any lane
 *  edits src/ — measured: a ~5 min outage on 2026-09-16 mid-fleet). */
const MIN_LOGIN_INTERVAL_MS = 3200;
let lastLoginAt = 0;

export async function loginJwt(
  request: APIRequestContext,
  role: AppRole,
): Promise<string> {
  const since = Date.now() - lastLoginAt;
  if (lastLoginAt !== 0 && since < MIN_LOGIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_LOGIN_INTERVAL_MS - since));
  }
  const { email, password } = roleCredentials(role);
  let lastErr = '';
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      const res = await request.post(`${API_BASE_URL}/api/auth/local`, {
        data: { identifier: email, password },
      });
      lastLoginAt = Date.now();
      if (res.ok()) {
        const body = (await res.json()) as { jwt: string };
        return body.jwt;
      }
      lastErr = `${res.status()} ${await res.text()}`;
      if (res.status() >= 400 && res.status() < 500 && res.status() !== 429) break;
    } catch (err) {
      lastErr = (err as Error).message;
    }
    await new Promise((r) => setTimeout(r, 5_000));
  }
  throw new Error(`[f9] login as ${email} never succeeded: ${lastErr}`);
}

/** Seed the web session the way a real sign-in leaves it. */
export async function setAuth(page: Page, jwt: string): Promise<void> {
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
}

/** Patient navigation — on-demand dev compiles can stall past the default goto. */
export async function patientGoto(page: Page, path: string): Promise<void> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      break;
    } catch {
      if (attempt >= 4) throw new Error(`[f9] navigation to ${path} never settled`);
      await page.waitForTimeout(4_000);
    }
  }
}

export async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}

/** The one masked-portal state: same card wherever a parent lands. The guard
 *  renders client-side after auth hydration; under fleet load that can outlive
 *  one paint, so retry with one patient reload (a carer refreshes). */
export async function expectMasked(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await expect(page.locator(MASK_SLOT)).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(MASK_TITLE, { exact: true })).toBeVisible();
      return;
    } catch {
      if (attempt === 2) throw new Error(`[f9] mask never rendered at ${page.url()}`);
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => undefined);
    }
  }
}

/** Run an API call through dev-restart windows (shared API hot-reloads when any
 *  lane edits src/ — measured outages of ~5 min; a 4xx is NEVER retried). */
async function withApiRetries<T>(call: () => Promise<T>): Promise<T> {
  let lastErr = '';
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      return await call();
    } catch (err) {
      lastErr = (err as Error).message ?? String(err);
      await new Promise((r) => setTimeout(r, 5_000));
    }
  }
  throw new Error(`[f9] API never came back: ${lastErr}`);
}
void withApiRetries;

/**
 * Register → confirm (real Mailpit link) → confirm the parent role through the
 * REAL `GET /api/users/me` read. No database probes anywhere (see file header).
 */
export async function registerFreshParent(
  request: APIRequestContext,
  flow: string,
): Promise<{ email: string; password: string; jwt: string }> {
  const password = 'E2eParent1234!';
  const email = `e2e-f9-${flow}-${Date.now().toString(36)}@schooltest.test`;
  const username = `e2e${Date.now().toString(36)}${flow}`.slice(0, 20);
  let regBody = '';
  for (let attempt = 0; ; attempt += 1) {
    try {
      const res = await request.post(`${API_BASE_URL}/api/auth/local/register`, {
        data: { username, email, password },
      });
      regBody = await res.text();
      expect(res.ok(), `[f9] register: ${res.status()} ${regBody}`).toBeTruthy();
      break;
    } catch (err) {
      // A 4xx surfaces as an expect failure — never retried. Network errors and
      // 5xx are dev-restart windows: retry patiently.
      const message = (err as Error).message ?? '';
      if (message.includes('register: 4') || attempt >= 11) throw err;
      await new Promise((r) => setTimeout(r, 5_000));
    }
  }

  const link = await fetchConfirmationLink(request, email);
  let redeemStatus = 0;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      const redeem = await request.get(link, { maxRedirects: 0 });
      redeemStatus = redeem.status();
      expect(redeemStatus, `[f9] confirm ${email}`).toBe(302);
      break;
    } catch (err) {
      if (attempt >= 11) throw err;
      await new Promise((r) => setTimeout(r, 5_000));
    }
  }

  // Login works the moment confirmation lands; the parent ROLE grant is the
  // thing this poll actually waits for (D20) — observed live via /users/me.
  // PACED: the API allows 20 POST /api/auth/local per minute PER IP, and a
  // combined F9 run registers several parents — poll every 3.5s and back off
  // hard on a 429 so the register flow never eats the whole budget.
  let jwt = '';
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await new Promise((r) => setTimeout(r, 3_500));
    const login = await request.post(`${API_BASE_URL}/api/auth/local`, {
      data: { identifier: email, password },
    });
    if (login.status() === 429) {
      await new Promise((r) => setTimeout(r, 15_000));
      continue;
    }
    if (!login.ok()) continue;
    jwt = ((await login.json()) as { jwt: string }).jwt;
    const me = await request.get(`${API_BASE_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (!me.ok()) continue;
    const meBody = (await me.json()) as { role?: { type?: string } | null };
    if (meBody.role?.type === 'parent') return { email, password, jwt };
  }
  throw new Error(`[f9] parent role never landed for ${email}`);
}

/** UI sign-in through the real form, paced like loginJwt. Retries once after a
 *  backoff when the brute-force limiter (20/min/IP) refuses the attempt — the
 *  form shows its error card instead of redirecting. */
export async function uiSignIn(page: Page, email: string, password: string): Promise<void> {
  const since = Date.now() - lastLoginAt;
  if (lastLoginAt !== 0 && since < MIN_LOGIN_INTERVAL_MS) {
    await page.waitForTimeout(MIN_LOGIN_INTERVAL_MS - since);
  }
  for (let attempt = 0; ; attempt += 1) {
    await patientGoto(page, '/sign-in');
    await page.getByLabel('Email address', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    lastLoginAt = Date.now();
    // Redirect inside 8s = success. Otherwise either a wrong-password card or a
    // rate-limit card is showing: retry after a pause, give up on the third.
    try {
      await page.waitForURL(/(^|\/)(dashboard|onboarding)/, { timeout: 8_000 });
      return;
    } catch {
      if (attempt >= 2) {
        throw new Error(`[f9] UI sign-in as ${email} never redirected (last url ${page.url()})`);
      }
      await page.waitForTimeout(20_000);
    }
  }
}

/** Unique stamp for every piece of created data. F9B = the finisher re-run. */
export function f9stamp(): string {
  return `F9B-${Date.now()}`;
}

/** Full wizard-whitelist student payload (C-STUDENT-CREATE) with F9 markers. */
export function studentPayload(suffix: string): Record<string, unknown> {
  return {
    given_name: 'F9Probe',
    family_name: suffix,
    email: `f9-probe-${suffix.toLowerCase()}@example.com`,
    date_of_birth: '2014-01-15',
    gender: 'female',
    nationality: 'Australian',
    passport_number: `P${suffix.replace(/[^0-9]/g, '').padStart(7, '1').slice(0, 8)}`,
    current_school: 'F9 Probe Primary',
    current_year_level: 'Year 7',
    year_level: 7,
    target_entry_year: '2027',
    target_entry_term: 'Term 1',
    parent_guardian_name: 'F9 Probe Parent',
    parent_guardian_email: 'f9-guardian@example.com',
    parent_guardian_phone: '0400000000',
    preferred_contact_channel: 'email',
  };
}
