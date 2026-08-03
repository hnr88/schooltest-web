import { defineConfig, devices } from '@playwright/test';

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
