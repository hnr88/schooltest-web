import { readFileSync } from 'node:fs';
import path from 'node:path';

import { type APIRequestContext, expect, type Page } from '@playwright/test';

import { apiEnv } from './auth-db';
import { cat } from './i18n';
import { ACCOUNTS, en, navLink, navLinks } from './teacher-rail';

// Harness for the flow 1 / flow 2 rail-scoping spec (task 050), split out of
// teacher-auth-sidebar.spec.ts for the 200-line rule. Nothing here is fixtured:
// the expectations are the brief's own rail definitions, every label is read from
// the shipped en catalog, and the API base is the very URL the browser's axios
// instance uses.

export type RailSpec = readonly { readonly key: string; readonly href: string }[];

/** Flow 1: the brief's teacher rail — "Teachers get three sidebar items". */
export const TEACHER_RAIL: RailSpec = [
  { key: 'Shell.nav.teacherDashboard', href: '/dashboard' },
  { key: 'Shell.nav.testSessions', href: '/dashboard/test-sessions' },
  { key: 'Shell.nav.results', href: '/dashboard/results' },
];

// Flow 2, from .qa/DECISIONS.md A4 verbatim: "Parents and admins keep their nav
// unchanged, which is what e2e flow 2 asserts."
export const ADMIN_RAIL: RailSpec = [
  { key: 'Shell.nav.overview', href: '/dashboard' },
  { key: 'Shell.nav.myChildren', href: '/dashboard/children' },
  { key: 'Shell.nav.search', href: '/dashboard/search' },
  { key: 'Shell.nav.settings', href: '/dashboard/settings' },
];

/** Every label the rail could ever print, read out of the shipped en catalog. */
const ALL_NAV_LABELS = Object.entries(en)
  .filter(([key]) => key.startsWith('Shell.nav.'))
  .map(([, label]) => label);

/** Read one key from the gitignored schooltest-web/.env — never a guessed default. */
function webEnv(key: string): string {
  for (const line of readFileSync(path.resolve(process.cwd(), '.env'), 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && match[1] === key) return match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  throw new Error(`[e2e] ${key} missing from schooltest-web/.env`);
}

/**
 * The base URL `src/lib/axios/strapi.ts` gives the browser's axios instance,
 * loopback pinned to IPv4 for this Node-side client only: Strapi binds
 * `IPv4 *:5500` while Node resolves `localhost` to `::1` first and would get
 * ECONNREFUSED. Browsers do happy-eyeballs and are unaffected.
 */
export const API_BASE = (() => {
  const url = new URL(webEnv('NEXT_PUBLIC_API_BASE_URL'));
  if (url.hostname === 'localhost') url.hostname = '127.0.0.1';
  return url.origin;
})();

// schooltest-api/.env: AUTH_RATELIMIT_MAX=20 POST /api/auth/local per
// AUTH_RATELIMIT_INTERVAL_MS=60000 per IP, and the 21st answers 429 RateLimitError
// (measured). The UI helper paces its own submissions at the same floor; these
// Node-side logins share one so this spec can never out-run the guard. A 429 is
// asserted as a FAILURE, never retried in a loop.
const MIN_LOGIN_INTERVAL_MS = 3_100;
let lastApiLoginAt = 0;

/** One real POST /api/auth/local for a seeded account; returns its JWT. */
export async function apiLogin(
  request: APIRequestContext,
  who: keyof typeof ACCOUNTS,
): Promise<string> {
  const sinceLast = Date.now() - lastApiLoginAt;
  if (lastApiLoginAt !== 0 && sinceLast < MIN_LOGIN_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_LOGIN_INTERVAL_MS - sinceLast));
  }
  const response = await request.post(`${API_BASE}/api/auth/local`, {
    data: { identifier: ACCOUNTS[who].email, password: apiEnv(ACCOUNTS[who].secret) },
  });
  lastApiLoginAt = Date.now();
  expect(response.status(), `POST /api/auth/local as ${ACCOUNTS[who].email}`).toBe(200);
  const { jwt } = (await response.json()) as { jwt: string };
  expect(jwt, 'no JWT on a 200 login').toBeTruthy();
  return jwt;
}

function expectedEntries(rail: RailSpec): string[] {
  return rail.map((item) => `${cat(en, item.key)}|${item.href}`);
}

function forbiddenLabels(rail: RailSpec): string[] {
  const allowed = new Set(rail.map((item) => cat(en, item.key)));
  return ALL_NAV_LABELS.filter((label) => !allowed.has(label));
}

/** The rendered rail as `label|href`, in DOM order. */
export async function railEntries(page: Page): Promise<string[]> {
  return navLinks(page).evaluateAll((nodes) =>
    nodes.map(
      (node) =>
        `${(node.textContent ?? '').replace(/\s+/g, ' ').trim()}|${node.getAttribute('href') ?? ''}`,
    ),
  );
}

/**
 * The EXACT-SET gate — the whole rendered rail compared with `toEqual`, so a
 * fourth entry fails rather than slipping past a containment check. Polls until
 * the rail matches, then re-reads it after a settle window so a rail that
 * *arrives* correct and later gains an entry (a late identity resolution
 * re-running the role filter) still fails. Finally sweeps every OTHER label the
 * catalog can print, so a nav destination added later is covered for free.
 */
export async function expectExactRail(page: Page, rail: RailSpec): Promise<void> {
  const wanted = expectedEntries(rail);
  await expect.poll(() => railEntries(page), { timeout: 20_000 }).toEqual(wanted);
  await page.waitForTimeout(1_000);
  expect(await railEntries(page), 'rail changed after settling').toEqual(wanted);
  for (const label of forbiddenLabels(rail)) {
    await expect(navLink(page, label), `rail leaked the "${label}" destination`).toHaveCount(0);
  }
}
