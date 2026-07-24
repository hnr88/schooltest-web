import type { Page } from '@playwright/test';

// The API's GLOBAL rate limiter allows 120 req/min per IP (RATE_LIMIT_MAX=120,
// RATE_LIMIT_WINDOW_MS=60000 — distinct from the 20/min auth-route guard paced in
// helpers/auth.ts). Every search-spec test renders the 12-cover grid from a FRESH
// browser context (~25 API requests per test, images included), so a warmed
// ~6-tests/min suite exceeds the window; once tripped, every request — auth
// included — 429s and the client amplifies the trip into a retry storm (task 008
// evidence: ~1900 requests in one minute, cascading into later tests). A fixed
// per-test pace caps the suite at ~4 tests/min (~95 req/min) so the limiter never
// trips. No route interception, no mocks — just pacing.
export const SEARCH_SUITE_PACE_MS = 10_000;

/** Sleeps the fixed per-test pace; call from a `test.beforeEach` in search suites. */
export async function paceRateWindow(page: Page): Promise<void> {
  await page.waitForTimeout(SEARCH_SUITE_PACE_MS);
}
