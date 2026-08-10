import path from 'node:path';

import { expect, type Locator, type Page } from '@playwright/test';

import { apiEnv, runSql } from './auth-db';
import { cat, loadMessages } from './i18n';

// Harness for the A4 rail-scoping spec, split out of teacher-sidebar.spec.ts for
// the 200-line rule. Every credential is read from schooltest-api/.env and every
// role slug from the REAL Postgres — nothing here is fixtured.
export const en = loadMessages('en');
export const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
export const DESKTOP = { width: 1280, height: 800 };

export const TEACHER_NAV = [
  { key: 'Shell.nav.teacherDashboard', href: '/dashboard' },
  { key: 'Shell.nav.testSessions', href: '/dashboard/test-sessions' },
  { key: 'Shell.nav.results', href: '/dashboard/results' },
] as const;

export const PARENT_NAV = [
  { key: 'Shell.nav.overview', href: '/dashboard' },
  { key: 'Shell.nav.myChildren', href: '/dashboard/children' },
  { key: 'Shell.nav.search', href: '/dashboard/search' },
  { key: 'Shell.nav.settings', href: '/dashboard/settings' },
] as const;

export const ACCOUNTS = {
  teacher: { email: 'teacher@schooltest.local', secret: 'SEED_TEACHER_PASSWORD' },
  admin: { email: 'apiadmin@schooltest.local', secret: 'SEED_APIADMIN_PASSWORD' },
  parent: { email: 'parent@schooltest.local', secret: 'SEED_PARENT_PASSWORD' },
} as const;

/** The users-permissions role slug the rail filters on, straight out of Postgres. */
export function roleSlug(email: string): string {
  return runSql(
    `select r.type from up_users u
       join up_users_role_lnk l on l.user_id = u.id
       join up_roles r on r.id = l.role_id
      where u.email = '${email}'`,
  );
}

export function sidebar(page: Page): Locator {
  return page.locator('[data-slot="sidebar"]');
}

export function navLinks(page: Page): Locator {
  return sidebar(page).locator('nav a');
}

export function navLink(page: Page, label: string): Locator {
  return sidebar(page).getByRole('link', { name: label, exact: true });
}

export function groupLabels(page: Page): Locator {
  return sidebar(page).locator('[data-slot="nav-group-label"]');
}

// The API's auth guard allows 20 POST /api/auth/local per minute per IP; the suite
// signs in five times, paced so it can never trip the limiter.
const MIN_LOGIN_INTERVAL_MS = 3100;
let lastLoginAt = 0;

/** Drives the REAL /sign-in form for one seeded account and waits for /dashboard. */
export async function signIn(page: Page, who: keyof typeof ACCOUNTS): Promise<void> {
  const sinceLast = Date.now() - lastLoginAt;
  if (lastLoginAt !== 0 && sinceLast < MIN_LOGIN_INTERVAL_MS) {
    await page.waitForTimeout(MIN_LOGIN_INTERVAL_MS - sinceLast);
  }
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(ACCOUNTS[who].email);
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(apiEnv(ACCOUNTS[who].secret));
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  lastLoginAt = Date.now();
  await page.waitForURL('**/dashboard');
}

/**
 * Samples the rail's link labels once per animation frame, from before the first
 * script runs, so a single wrong-persona frame cannot hide between assertions.
 * Re-installed on every navigation by addInitScript; the buffer resets per load.
 */
export async function installNavSampler(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const samples: string[] = [];
    (window as unknown as { __navSamples: string[] }).__navSamples = samples;
    const tick = () => {
      const nav = document.querySelector('[data-slot="sidebar"] nav');
      const labels = nav
        ? Array.from(nav.querySelectorAll('a'))
            .map((anchor) => anchor.textContent?.trim() ?? '')
            .join('|')
        : '';
      if (labels && samples[samples.length - 1] !== labels) samples.push(labels);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/** Asserts no sampled rail frame ever carried a parent destination. */
export async function assertNoParentFrame(page: Page): Promise<void> {
  const samples = await page.evaluate(
    () => (window as unknown as { __navSamples?: string[] }).__navSamples ?? [],
  );
  expect(samples.length).toBeGreaterThan(0);
  for (const sample of samples) {
    for (const item of PARENT_NAV) {
      expect(sample, `rail frame leaked a parent entry: ${sample}`).not.toContain(
        cat(en, item.key),
      );
    }
  }
}
