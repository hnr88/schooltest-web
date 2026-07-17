import { defineConfig, devices } from '@playwright/test';

// Port 3100 is allocated to this instance (port 3000 belongs to a neighbor — see
// .qa/STACK.json). Override with E2E_BASE_URL / E2E_PORT when targeting another stack.
const port = Number(process.env.E2E_PORT ?? 3100);
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
