import { defineConfig, devices } from '@playwright/test';

// Runs against an already-running stack (docker compose / Coolify / `pnpm dev`).
// Set E2E_BASE_URL to point at the target environment.
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

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
  // To let Playwright boot the app itself, build first then uncomment:
  // webServer: { command: 'pnpm start', url: baseURL, reuseExistingServer: !process.env.CI },
});
