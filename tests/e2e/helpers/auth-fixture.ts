/**
 * Per-role authenticated-page fixture (mission task 005).
 *
 * Every later e2e flow in this mission builds on this fixture instead of
 * re-implementing login: declare `test.use({ role: 'teacher' })` and receive
 * an `authPage` that has already signed in through the REAL /sign-in form —
 * the same single path `roles.ts` drives, with the same brute-force pacing.
 *
 * The page is created fresh per test and closed afterwards; the JWT the app
 * itself stored (localStorage `app.auth.token`, set by the login mutation via
 * writeClientToken) is whatever the live API returned — nothing is forged,
 * seeded into storage, or mocked.
 */
import { test as base, type Page } from '@playwright/test';

import { loginAs, type AppRole } from './roles';

export const test = base.extend<{ role: AppRole; authPage: Page }>({
  role: ['ops', { option: true }],
  // Named `run`, not Playwright docs' `use`: this repo's react-hooks ESLint
  // plugin flags any call to a function named `use` outside a component.
  authPage: async ({ browser, role }, run) => {
    const page = await browser.newPage();
    await loginAs(page, role);
    await run(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';
export type { AppRole } from './roles';
