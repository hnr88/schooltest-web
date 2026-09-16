/**
 * F10 cross-cutting "idiot-proofing" sweep — shared harness.
 *
 * Fleet-agent F10 owns the HORIZONTAL sweep: route matrix per role, refresh /
 * back / forward, double submits, direct-URL abuse, i18n switching, offline /
 * failure behaviour and a whole-app console-error sweep. This file holds the
 * machinery every fleet10-*.spec.ts reuses. Scratch-only: nothing in src/**
 * may be touched for this work, and findings are REPORTED, never fixed here.
 *
 * The route universe is BUILT FROM THE TREE at load time (src/app/[locale]/**
 * /page.tsx), never hand-listed, so the sweep walks what the app actually
 * ships. Parenthesised route groups ((portal), (teacher)) never appear in URLs
 * and are dropped; [param] segments become :param tokens that the sweep fills
 * with a bogus documentId — direct-URL abuse IS the subject under test.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect, type Browser, type BrowserContext, type Page, type TestInfo } from '@playwright/test';

// ---------------------------------------------------------------------------
// Route universe — generated from the real file tree
// ---------------------------------------------------------------------------

export interface F10Route {
  /** URL path with :param tokens, relative to the web root (en is unprefixed). */
  path: string;
  /** Segment names to fill, e.g. ['documentId']. */
  params: string[];
}

function buildRoutes(): F10Route[] {
  const root = path.resolve(process.cwd(), 'src/app/[locale]');
  if (!existsSync(root)) throw new Error(`[f10] route tree missing: ${root}`);
  const out = new Map<string, F10Route>();
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (entry.name !== 'page.tsx') continue;
      const rel = path.relative(root, path.dirname(full));
      const parts = rel === '.' ? [] : rel.split(path.sep);
      let url = '';
      const params: string[] = [];
      let catchAll = false;
      for (const part of parts) {
        if (part.startsWith('(')) continue; // route group — never in the URL
        if (part.startsWith('[...')) {
          catchAll = true;
          continue;
        }
        if (part.startsWith('[')) {
          const name = part.slice(1, -1);
          params.push(name);
          url += `/:${name}`;
        } else {
          url += `/${part}`;
        }
      }
      if (catchAll) url = '/__f10_catchall__';
      out.set(url || '/', { path: url || '/', params });
    }
  };
  walk(root);
  return [...out.values()].sort((a, b) => a.path.localeCompare(b.path));
}

export const F10_ROUTES: F10Route[] = buildRoutes();

/** A documentId-shaped value that cannot exist (direct-URL abuse probe). */
export const BOGUS_ID = 'zzf10notreal0000000000';

export function fillRoute(route: F10Route, bogus = BOGUS_ID): string {
  return route.params.reduce<string>((acc) => acc.replace(/:[^/]+/, bogus), route.path);
}

// ---------------------------------------------------------------------------
// Role model — the seeded identities the sweep signs in as
// ---------------------------------------------------------------------------

export type F10Role = 'ops' | 'schoolAdmin' | 'teacher' | 'parent';

export const F10_ACCOUNTS: Record<F10Role, { email: string; password: string }> = {
  ops: { email: 'admin@schooltest.local', password: 'Admin1234!' },
  // NOTE: the seeded email is schooladmin-a@… (no second hyphen). Verified
  // against the live API: school-admin-a@schooltest.local is INVALID.
  schoolAdmin: { email: 'schooladmin-a@schooltest.local', password: 'Schooladmin1234!' },
  teacher: { email: 't2@schooltest.local', password: 'Teacher1234!' },
  parent: { email: 'parent@schooltest.local', password: 'Parent1234!' },
};

export const F10_ROLES: F10Role[] = ['ops', 'schoolAdmin', 'teacher', 'parent'];

/** Which URL prefixes each role OWNS (its allowed section). */
export const F10_SECTION: Record<F10Role, string[]> = {
  ops: ['/dashboard/ops'],
  schoolAdmin: ['/dashboard/school'],
  teacher: ['/dashboard/results', '/dashboard/test-sessions', '/dashboard/teach', '/dashboard/teacher'],
  // Parent owns only /dashboard itself; every other portal route is MASKED
  // (parent views flag off) — the mask IS the expected clean refusal.
  parent: ['/dashboard'],
};

export function ownsRoute(role: F10Role, path: string): boolean {
  return F10_SECTION[role].some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

// ---------------------------------------------------------------------------
// Console-error store — every sweep feeds it, the runner dumps one JSON
// ---------------------------------------------------------------------------

export interface F10ConsoleRow {
  page: string;
  kind: 'console.error' | 'pageerror' | 'requestfailed' | 'http5xx';
  text: string;
}

const consoleRows: F10ConsoleRow[] = [];

export function consoleRowsSoFar(): F10ConsoleRow[] {
  return consoleRows;
}

/** Attach console.error / pageerror / requestfailed capture to a page. */
export function watchF10(page: Page, label?: string): void {
  const describe = (): string => label ?? page.url();
  page.on('pageerror', (error) => {
    consoleRows.push({ page: describe(), kind: 'pageerror', text: error.message.slice(0, 500) });
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleRows.push({ page: describe(), kind: 'console.error', text: message.text().slice(0, 500) });
    }
  });
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText ?? 'failed';
    // Aborted prefetches / font / devtools chunk loads are browser-normal
    // noise on every navigation; keep them out of the findings table.
    if (failure === 'net::ERR_ABORTED') return;
    consoleRows.push({
      page: describe(),
      kind: 'requestfailed',
      text: `${request.method()} ${request.url().slice(0, 160)} → ${failure}`,
    });
  });
  page.on('response', (response) => {
    if (response.status() >= 500) {
      consoleRows.push({
        page: describe(),
        kind: 'http5xx',
        text: `${response.status()} ${response.request().method()} ${response.url().slice(0, 200)}`,
      });
    }
  });
}

/** Append this spec's rows to the shared JSON and print a compact table. */
export function dumpF10Console(testInfo: TestInfo): void {
  const dir = capturesDir();
  const file = path.join(dir, 'console-errors.jsonl');
  writeFileSync(file, `${consoleRows.map((r) => JSON.stringify(r)).join('\n')}\n`, { flag: 'a' });
  const grouped = new Map<string, Set<string>>();
  for (const row of consoleRows) {
    const key = `${row.kind} ${row.text.split('\n')[0].slice(0, 140)}`;
    if (!grouped.has(key)) grouped.set(key, new Set());
    grouped.get(key)!.add(row.page);
  }
  console.log(`\n[f10 console sweep — ${testInfo.file.split('/').pop()}] ${consoleRows.length} rows`);
  for (const [key, pages] of [...grouped].sort((a, b) => b[1].size - a[1].size)) {
    console.log(`  (${pages.size} pages) ${key}  e.g. ${[...pages][0].slice(0, 90)}`);
  }
}

export function capturesDir(): string {
  const dir = path.resolve(process.cwd(), 'tests/e2e/captures/fleet10');
  mkdirSync(dir, { recursive: true });
  return dir;
}

export async function shot(page: Page, name: string): Promise<string> {
  const file = path.join(capturesDir(), `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

// ---------------------------------------------------------------------------
// Signed-in contexts — one real form sign-in per role, reused as storage state
// ---------------------------------------------------------------------------

const MIN_LOGIN_INTERVAL_MS = 3100;
let lastLoginAt = 0;

function statePath(testInfo: TestInfo, who: F10Role): string {
  // NOT the Playwright outputDir: test-results/ is wiped by ANY concurrent
  // playwright run on this machine (the fleet runs several), which deletes
  // minted states mid-sweep. Live under F10's own captures tree instead.
  const dir = path.join(capturesDir(), 'state');
  mkdirSync(dir, { recursive: true });
  return path.join(dir, `${who}.json`);
}

async function mintState(browser: Browser, who: F10Role, file: string): Promise<void> {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  try {
    const sinceLast = Date.now() - lastLoginAt;
    if (lastLoginAt !== 0 && sinceLast < MIN_LOGIN_INTERVAL_MS) {
      await page.waitForTimeout(MIN_LOGIN_INTERVAL_MS - sinceLast);
    }
    const { email, password } = F10_ACCOUNTS[who];
    await page.goto('/sign-in');
    await page.getByLabel('Email address', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    lastLoginAt = Date.now();
    await page.waitForURL('**/dashboard', { timeout: 30_000 });
    const staging = `${file}.staging`;
    await context.storageState({ path: staging });
    renameSync(staging, file);
  } finally {
    await context.close();
  }
}

/** A context signed in as `who`, state proved by one real navigation. */
export async function signedInAs(
  browser: Browser,
  who: F10Role,
  testInfo: TestInfo,
): Promise<{ context: BrowserContext; page: Page }> {
  const file = statePath(testInfo, who);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (!existsSync(file)) await mintState(browser, who, file);
    const context = await browser.newContext({ storageState: file });
    const page = await context.newPage();
    await page.goto('/dashboard');
    if (!/\/sign-in(\?|$)/.test(new URL(page.url()).pathname + new URL(page.url()).search)) {
      return { context, page };
    }
    await context.close();
    rmSync(file, { force: true });
  }
  throw new Error(`[f10] storage state for "${who}" does not authenticate after a re-mint`);
}

// ---------------------------------------------------------------------------
// Settle + classify — what did that navigation actually land on?
// ---------------------------------------------------------------------------

export type F10Outcome =
  | 'signin' // bounced to the sign-in form
  | 'redirect-role' // redirected to a dashboard route (role home / mask target)
  | 'unavailable' // ParentViewsUnavailable-style masked state
  | 'notfound' // branded 404 / detail "not found" card
  | 'rendered' // a full page rendered
  | 'white' // no visible text at all
  | 'crash'; // dev overlay / runtime error text visible

const CRASH_TEXT = [
  'Application error',
  'Unhandled Runtime Error',
  'Internal Server Error',
  'Missing getServerSnapshot',
  'Minified React error',
];

const NOTFOUND_TEXT = [
  'This page hopped away',
  'School not found',
  'Class not found',
  'We could not find this class',
  'We could not find that student',
  'Teacher not found',
  'not found',
];

/** Wait for the client guards to finish: quiet network + stable URL + a beat. */
export async function settle(page: Page, budgetMs = 25_000): Promise<void> {
  const deadline = Date.now() + budgetMs;
  let lastUrl = '';
  let quietSince = 0;
  while (Date.now() < deadline) {
    const url = page.url();
    let inflight = -1;
    try {
      inflight = await page.evaluate(
        () =>
          (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).filter(
            (entry) => entry.responseEnd === 0,
          ).length,
      );
    } catch {
      // A late client-guard navigation destroyed the execution context mid
      // probe — that navigation IS the signal that the page moved on.
      return;
    }
    if (url !== lastUrl) {
      lastUrl = url;
      quietSince = 0;
    } else if (inflight === 0) {
      if (quietSince === 0) quietSince = Date.now();
      else if (Date.now() - quietSince >= 900) return;
    } else {
      quietSince = 0;
    }
    await page.waitForTimeout(250);
  }
}

/** Read the page's own story: where did it land, what does it say? */
export async function classify(page: Page, requestedPath?: string): Promise<F10Outcome> {
  const url = new URL(page.url());
  if (/\/sign-in(\?|$)/.test(url.pathname + url.search)) return 'signin';

  let info: { text: string; dash: boolean; notice: string };
  try {
    info = await page.evaluate(() => {
      const body = document.body;
      const text = (body?.innerText ?? '').trim();
      const dash = Boolean(document.querySelector('[data-slot="dashboard-content"], [data-slot="sidebar"]'));
      const notice = document.querySelector('[data-slot="empty-state"], [role="alert"]');
      return { text, dash, notice: notice ? (notice.textContent ?? '').slice(0, 200) : '' };
    });
  } catch {
    // The context was destroyed by a guard navigation racing the probe; the
    // page is mid-redirect, which is itself the classification.
    return 'redirect-role';
  }

  const haystack = `${info.text}\n${info.notice}`;
  if (CRASH_TEXT.some((needle) => info.text.includes(needle))) return 'crash';
  if (info.text.length === 0 && !info.dash) return 'white';

  // A client-guard redirect: the URL no longer names the requested route.
  const finalPath = url.pathname.replace(/\/$/, '') || '/';
  if (requestedPath) {
    const wanted = requestedPath.replace(/\/$/, '') || '/';
    if (finalPath !== wanted) return 'redirect-role';
  }

  if (NOTFOUND_TEXT.some((needle) => haystack.toLowerCase().includes(needle.toLowerCase()))) {
    return 'notfound';
  }
  // A masked parent-views card carries the "not available" copy; the parent
  // portal query-error card is the other clean refusal a wrong role meets.
  if (
    info.text.includes('The parent portal is not available') ||
    info.text.includes('This page needs a parent account')
  ) {
    return 'unavailable';
  }
  return 'rendered';
}

/**
 * Scan visible text for RAW i18n key slugs (e.g. "Ops.import.card.ready.title")
 * — a translated app must never show its catalog keys.
 */
export async function rawKeySlugs(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const text = document.body?.innerText ?? '';
    const matches = text.match(/\b[A-Z][A-Za-z]+(?:\.[A-Za-z0-9_]+){2,}\b/g) ?? [];
    return [...new Set(matches)].slice(0, 20);
  });
}

/** Horizontal overflow probe: does the document scroll sideways at this width? */
export async function horizontalOverflow(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const offenders: string[] = [];
    if (doc.scrollWidth > doc.clientWidth + 1) offenders.push(`document ${doc.scrollWidth}>${doc.clientWidth}`);
    for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*')).slice(0, 4000)) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 1 && rect.right > doc.clientWidth + 8) {
        const id = el.hasAttribute('data-slot')
          ? el.getAttribute('data-slot')
          : `${el.tagName.toLowerCase()}.${(el.className || '').toString().slice(0, 40)}`;
        offenders.push(`${id} right=${Math.round(rect.right)}`);
        if (offenders.length >= 6) break;
      }
    }
    return offenders;
  });
}

/**
 * Wait out a still-pending client guard. The role guards render a SKELETON
 * while the JWT hydrates and /api/users/me resolves — under a Next dev server
 * compiling routes on demand that window can stretch past 30s on a first hit.
 * A wrong role must END at a redirect/refusal, so while a guard skeleton is
 * up we give the URL up to `budgetMs` to move; a real render (real words on
 * screen) returns immediately and pays nothing.
 */
export async function waitOutGuard(page: Page, targetPath: string, budgetMs = 45_000): Promise<void> {
  const deadline = Date.now() + budgetMs;
  while (Date.now() < deadline) {
    const state = await page
      .evaluate(() => {
        const text = (document.body?.innerText ?? '').trim();
        const pending = document.querySelector(
          '[data-slot="ops-guard-pending"], [data-slot="school-admin-guard-pending"], [data-slot="skeleton"], .animate-pulse',
        );
        return { words: text.length, pending: Boolean(pending) };
      })
      .catch(() => ({ words: -1, pending: false }));
    if (state.words < 0) return; // context destroyed — a navigation happened
    const moved = new URL(page.url()).pathname.replace(/\/$/, '') !== targetPath.replace(/\/$/, '');
    if (moved || !state.pending || state.words > 220) return;
    await page.waitForTimeout(500);
  }
}

// ---------------------------------------------------------------------------
// Real documentId harvest — the matrix also wants real-data renders
// ---------------------------------------------------------------------------

export interface F10RealIds {
  opsSchool?: string;
  opsSchoolClass?: string;
  saClass?: string;
  saTeacher?: string;
  teacherClassResults?: string;
  teacherClassTeach?: string;
  sitting?: string;
}

const IDS_FILE = path.join(capturesDir(), 'real-ids.json');

export function readRealIds(): F10RealIds {
  if (!existsSync(IDS_FILE)) return {};
  return JSON.parse(readFileSync(IDS_FILE, 'utf8')) as F10RealIds;
}

export function writeRealIds(ids: F10RealIds): void {
  writeFileSync(IDS_FILE, JSON.stringify(ids, null, 2));
}

/** First detail href on a list page matching `needle` in the link target. */
export async function firstHref(page: Page, needle: string): Promise<string | undefined> {
  const links = page.locator('a[href]');
  const count = await links.count();
  for (let i = 0; i < count; i += 1) {
    const href = await links.nth(i).getAttribute('href');
    if (href && href.includes(needle)) return href;
  }
  return undefined;
}

export { expect };
