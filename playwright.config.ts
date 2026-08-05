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
// The host is `localhost`, not `127.0.0.1`, on purpose: the API's CORS allow-list
// is FRONTEND_ORIGIN=http://localhost:3101, so a suite driven at 127.0.0.1 gets a
// CORS preflight failure the moment a page calls the API (observed as a silent
// "You appear to be offline" on the sign-in form). Override with
// E2E_BASE_URL / E2E_PORT when targeting another stack.
const port = Number(process.env.E2E_PORT ?? 3101);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
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
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
