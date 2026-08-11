import { defineConfig, devices } from '@playwright/test';

// Port 3000 is THIS instance's web port (.qa/STACK.json `ports.web`), and Strapi's
// CORS allow-list is exactly `http://localhost:3000` (`FRONTEND_URL` in the local
// api `.env`), so a suite pointed anywhere else cannot sign anyone in.
//
// The default used to be 3100. That is Codephant's port on this machine
// (.qa/STACK.json `neighbors_to_avoid`), and with `reuseExistingServer` Playwright
// treats a live listener as "the app is already up" — so an unqualified run
// silently drove the whole suite against a NEIGHBOUR'S app instead of failing.
// Override with E2E_BASE_URL / E2E_PORT only to target a genuinely different stack.
const port = Number(process.env.E2E_PORT ?? 3000);
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
