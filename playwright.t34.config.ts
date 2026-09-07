import { defineConfig, devices } from '@playwright/test';

// THROWAWAY (task 34 verification): the checked-in webServer timeout is 180s,
// and a cold `next dev` boot exceeds it on this loaded shared machine. Same
// suite, same port discipline, longer boot budget. Delete after use.
const port = Number(process.env.E2E_PORT ?? 3101);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'line',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm exec next dev -p ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 540_000,
    stdout: 'pipe',
  },
});
