/**
 * Real per-role sign-in through the app's own UI (mission task 212).
 *
 * Accounts come from the Strapi bootstrap seed ONLY — this helper drives the
 * real /sign-in form against them and never creates an account. Credentials are
 * read from the environment (E2E_<ROLE>_EMAIL / _PASSWORD) with the documented
 * dev-seed identities as the defaults, mirroring the existing parent helper.
 *
 * The API's brute-force guard allows 20 POST /api/auth/local per minute per IP,
 * so submissions are paced exactly as `auth.ts` does. Run role-heavy suites with
 * --workers=1.
 */
import { expect, type Page } from '@playwright/test';

import { cat, loadMessages } from './i18n';

export type AppRole = 'ops' | 'schoolAdmin' | 'teacher';

interface Credential {
  readonly email: string;
  readonly password: string;
}

export const ROLE_CREDENTIALS: Record<AppRole, Credential> = {
  ops: {
    email: process.env.E2E_OPS_EMAIL ?? 'admin@schooltest.local',
    password: process.env.E2E_OPS_PASSWORD ?? 'TBUaS2yS6D9FJMZP!A1',
  },
  schoolAdmin: {
    email: process.env.E2E_SCHOOL_ADMIN_EMAIL ?? 'schooladmin-a@schooltest.local',
    password: process.env.E2E_SCHOOL_ADMIN_PASSWORD ?? 'pEbjxVnJ4PPYiv8D!A1',
  },
  teacher: {
    // The default MUST be a seeded account. It was `verify21@schooltest.local`
    // with password `Verify21!pw` — a hand-made QA persona from a task
    // verification session that the seeder has never created. E2E_TEACHER_EMAIL
    // is set nowhere, so that default always won and every spec signing in as a
    // teacher failed at the login form. Measured 2026-08-19: POST /api/auth/local
    // returns 400 ValidationError "Invalid identifier or password" for the old
    // pair and a real JWT for this one.
    email: process.env.E2E_TEACHER_EMAIL ?? 'teacher@schooltest.local',
    password: process.env.E2E_TEACHER_PASSWORD ?? 'Teacher1234!',
  },
};

const MIN_LOGIN_INTERVAL_MS = 3100;
let lastLoginSubmittedAt = 0;

/**
 * Sign in through the REAL form. A failed login is a root-cause defect (a wrong
 * seed credential or role), never something to retry in a loop: this throws with
 * the landing URL so the cause is fixed once, at the seed.
 */
export async function loginAs(page: Page, role: AppRole): Promise<void> {
  const en = loadMessages('en');
  const { email, password } = ROLE_CREDENTIALS[role];

  const sinceLast = Date.now() - lastLoginSubmittedAt;
  if (lastLoginSubmittedAt !== 0 && sinceLast < MIN_LOGIN_INTERVAL_MS) {
    await page.waitForTimeout(MIN_LOGIN_INTERVAL_MS - sinceLast);
  }

  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  lastLoginSubmittedAt = Date.now();

  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 20_000 }).catch(() => {
    throw new Error(
      `[e2e] sign-in as ${role} (${email}) did not reach the dashboard — landed on ${page.url()}. ` +
        'Fix the seeded credential/role via the Strapi seed; do NOT retry the form.',
    );
  });
  expect(page.url()).toContain('/dashboard');
}
