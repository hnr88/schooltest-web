import { closeSync, existsSync, mkdirSync, openSync, renameSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';

import { test, type Browser, type BrowserContext, type Page } from '@playwright/test';

import { ACCOUNTS, signIn } from './teacher-rail';

/**
 * ONE FORM SIGN-IN PER IDENTITY PER RUN, reused as Playwright storage state.
 *
 * WHY THIS EXISTS. Every signed-in spec drives the REAL `/sign-in` form, and the
 * API allows 20 `POST /api/auth/local` per minute per IP. The existing mitigation
 * is a 3.1s pacing constant in `teacher-rail.ts` — but `lastLoginAt` there is
 * MODULE state, so the pace is per worker PROCESS. It cannot coordinate across
 * concurrent runs, and the web and api suites share that one limiter. That is
 * why an overlap produces a cluster of reds that are all sign-in paths and none
 * of them product faults.
 *
 * This is ADDITIVE and OPT-IN. `signIn`/`signInAccount` keep their exact
 * behaviour for every existing caller — a helper change with 127 consuming spec
 * files is the largest blast radius on this repo, and a big-bang migration is
 * not worth the risk. Specs adopt this one at a time.
 *
 * PRECEDENT, AND THE BUG IN IT. `ops-portal/settings-read.helpers.ts`,
 * `ops-portal/settings.spec.ts` and `ops-portal/schools-export.spec.ts` already
 * save and re-attach storage state — so the mechanism is proven here, not
 * invented. But all three hard-code a FIXED filename under `os.tmpdir()`
 * (`schooltest-ops-077-state.json`, `ops-019-schools-export-state.json`). With
 * runs now going in parallel that is two real hazards: two runs race the same
 * path, and a state file OUTLIVES the run that made it, so a later run can
 * attach credentials minted against a database that has since been reseeded.
 * This helper scopes the path to the RUN's own output directory and takes an
 * exclusive lock, which is the part the precedent is missing.
 */

/** Bounded wait for a peer worker that is mid-login. */
const LOCK_TIMEOUT_MS = 45_000;
const LOCK_POLL_MS = 200;

/** A state file older than this is treated as untrustworthy and re-minted. */
const STATE_MAX_AGE_MS = 15 * 60_000;

export type AuthIdentity = keyof typeof ACCOUNTS;

/**
 * How many times this worker has driven the REAL sign-in form.
 *
 * Exported so a migrating spec can ASSERT the saving rather than trust it: the
 * whole value of this helper is a number, and a number nothing checks decays
 * the first time someone reintroduces a per-test login. A spec that adopts the
 * fixture should assert this is 1 for the whole file.
 */
let formSignIns = 0;
export function formSignInCount(): number {
  return formSignIns;
}

/**
 * Per-RUN, per-identity path. `project.outputDir` is distinct whenever the run
 * is launched with its own `--output`, which is how two concurrent runs stay
 * out of each other's way — deliberately NOT `os.tmpdir()` with a fixed name.
 */
function statePath(who: AuthIdentity): string {
  const dir = path.join(test.info().project.outputDir, '.auth-state');
  mkdirSync(dir, { recursive: true });
  return path.join(dir, `${who}.json`);
}

/** Exclusive create; returns false if another worker holds it. */
function tryLock(lock: string): boolean {
  try {
    closeSync(openSync(lock, 'wx'));
    return true;
  } catch {
    return false;
  }
}

async function withLock<T>(lock: string, body: () => Promise<T>): Promise<T> {
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  while (!tryLock(lock)) {
    if (Date.now() > deadline) {
      // A stale lock is more likely than a 45s login, so break it rather than
      // failing the whole file — but say so, because silence here would read as
      // a mysterious hang to whoever runs this next.
      console.warn(`[auth-state] breaking a stale lock after ${LOCK_TIMEOUT_MS}ms: ${lock}`);
      rmSync(lock, { force: true });
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, LOCK_POLL_MS));
  }
  try {
    return await body();
  } finally {
    rmSync(lock, { force: true });
  }
}

function isFresh(file: string): boolean {
  if (!existsSync(file)) return false;
  try {
    return Date.now() - statSync(file).mtimeMs < STATE_MAX_AGE_MS;
  } catch {
    return false;
  }
}

/**
 * Mint the state by driving the real form ONCE, then persist it atomically
 * (write to a sibling, then rename) so a reader can never observe a
 * half-written file.
 */
async function mintState(browser: Browser, who: AuthIdentity, file: string): Promise<void> {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  try {
    await signIn(page, who);
    formSignIns += 1;
    const staging = `${file}.staging`;
    await context.storageState({ path: staging });
    renameSync(staging, file);
  } finally {
    await context.close();
  }
}

/**
 * A context already signed in as `who`, minting the state on first use in this
 * run and reusing it thereafter.
 *
 * INVALIDATION IS EXPLICIT, because the failure it prevents is the nastiest one
 * available here: attaching dead auth state produces a redirect to `/sign-in`
 * and every subsequent assertion fails looking exactly like a product defect.
 * So the state is proved before it is handed out — one navigation, and if we
 * land on the sign-in form the state is discarded and re-minted ONCE. A second
 * failure throws with the identity named rather than proceeding.
 */
export async function signedInContext(
  browser: Browser,
  who: AuthIdentity,
  options: { viewport?: { width: number; height: number } } = {},
): Promise<{ context: BrowserContext; page: Page }> {
  const file = statePath(who);

  await withLock(`${file}.lock`, async () => {
    if (!isFresh(file)) await mintState(browser, who, file);
  });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const context = await browser.newContext({ storageState: file, ...options });
    const page = await context.newPage();
    await page.goto('/dashboard');
    if (!/\/sign-in(\?|$)/.test(new URL(page.url()).pathname + new URL(page.url()).search)) {
      return { context, page };
    }
    await context.close();
    if (attempt === 0) {
      rmSync(file, { force: true });
      await withLock(`${file}.lock`, async () => {
        if (!isFresh(file)) await mintState(browser, who, file);
      });
    }
  }

  throw new Error(
    `[auth-state] saved state for "${who}" does not authenticate after a re-mint — ` +
      'the seed may have been reset mid-run. Failing loudly rather than reporting ' +
      'a sign-in bounce as a product failure.',
  );
}

/**
 * A genuinely UNAUTHENTICATED context, for the specs whose subject IS the
 * signed-out bounce.
 *
 * This is not a convenience: `browser.newContext()` inherits the file's
 * `contextOptions`, so a spec that declares `storageState` at file level and
 * then opens a "fresh" context gets an AUTHENTICATED one and its signed-out
 * assertion inverts silently. Stating the empty state explicitly is the only
 * form that cannot do that — the same idiom `settings-read.spec.ts` already
 * uses for the same reason.
 */
export async function signedOutContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({ storageState: { cookies: [], origins: [] } });
}
