import { readFileSync } from 'node:fs';
import path from 'node:path';

import { defineConfig, devices } from '@playwright/test';

// Load .env.local into the TEST process. Several helpers document overriding
// their defaults there (E2E_PARENT_PASSWORD, API_BASE_URL, MAILPIT_API_URL),
// but Playwright reads no dotenv of its own, so those values only ever reached
// the spawned Next server and every spec silently fell back to a stale default.
// An already-exported variable always wins, so a shell override still works.
function loadEnvLocal(): void {
  try {
    const raw = readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;
      process.env[key] = rawValue.trim().replace(/^(['"])(.*)\1$/, '$2');
    }
  } catch {
    // No .env.local (CI) — defaults and real env vars stand.
  }
}

loadEnvLocal();

// This instance's web app runs on :3101 (see .qa/STACK.json). Ports 3000 and 3100
// belong to NEIGHBOURING stacks and must never be bound by this suite.
//
// The host is `localhost`, not `127.0.0.1`, on purpose: the API matches origins
// by exact string, so a suite driven at 127.0.0.1 gets a CORS preflight failure
// the moment a page calls the API (observed as a silent "You appear to be
// offline" on the sign-in form). Override with E2E_BASE_URL / E2E_PORT when
// targeting another stack.
//
// MEASURED 2026-09-10, because the previous version of this comment named the
// wrong port and would have argued someone back onto a broken default:
//   schooltest-api/.env:49  FRONTEND_ORIGIN=http://localhost:3002,http://localhost:3010
// So CORS allows 3002 and 3010 and EXCLUDES 3101. Keep this comment in step with
// that variable, or delete it — a stale allow-list comment is worse than none.
// DEFAULT IS THE LIVE WEB PORT, NOT 3101 — and 3101 was broken twice over:
// Next refuses a second dev server per DIRECTORY, and the API's CORS allow-list
// excludes 3101, so a run booted there could not talk to :5500 even if it
// started. A default that cannot work is not a default worth preserving.
//
// With the live port as the default, `webServer.reuseExistingServer` (below)
// finds the already-listening dev server and starts NOTHING. Verified: `CI` is
// unset locally so `reuseExistingServer` is true, and :3002 answers 200. Under
// real CI the flag flips to false and Playwright boots on this port itself,
// which is correct there because nothing is pre-running.
//
// This is what makes the MANAGED runner usable: it cannot pass env, so it took
// the old 3101 default and tried to boot a second dev server. `uiUrl` does not
// help — it steers the page/context fixtures, and this config has no reference
// to it, so it can never reach `webServer.url`.
//
// STILL ENV-OVERRIDABLE: E2E_PORT (or E2E_BASE_URL) wins when set, so anything
// that deliberately wants another port keeps working.
const port = Number(process.env.E2E_PORT ?? 3002);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // ADD, never replace: a json report is useful to have, and `html` is kept
  // because the local report workflow depends on it.
  //
  // CORRECTION: an earlier version of this comment blamed the html-only reporter
  // for the managed runner's failures. That was WRONG, and the disproof sits
  // next door — schooltest-api/playwright.config.ts reports `[['list'],['html']]`
  // with NO json at all and its managed runs register fine, because the runner
  // injects its own reporter. The real cause was `reuseExistingServer` (below).
  // The json reporter was never the blocker.
  reporter: [['html'], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Playwright boots the app itself (the only server-run mechanism; CLAUDE.md law 12
  // forbids running dev/build/start manually — `pnpm exec playwright test` is allowed).
  webServer: {
    command: `pnpm exec next dev -p ${port}`,
    url: baseURL,
    // ALWAYS reuse, including under CI. This is the line that makes the MANAGED
    // runner work, and `!process.env.CI` is what broke it: the runner sets CI,
    // so the flag evaluated false, Playwright refused to attach to the live dev
    // server and died BEFORE emitting any report — surfacing as the misleading
    // "did not produce a readable JSON report" after ~350ms. Measured directly:
    //   CI=1 node ./node_modules/@playwright/test/cli.js test … --reporter=list
    //   -> Error: http://localhost:3002 is already used … or set
    //      reuseExistingServer:true in config.webServer.
    //
    // `true` is correct in BOTH environments: Playwright reuses the server when
    // the url responds and starts `command` when it does not, so a clean CI box
    // with nothing listening behaves exactly as before. The only behaviour that
    // changes is the one that was broken — an occupied port is reused instead
    // of fatal.
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
