import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { bridgeApiCors } from './helpers/api-cors-bridge';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';

// BUG-007 — the school admin's MANAGE rail reads School, Teachers, Classes,
// Students, so a new admin reaches Teachers before Classes. Only that order moves:
// every entry still lights up on its own route, and the teacher rail is untouched.
const en = loadMessages('en');
const PROOF = path.join(process.env.E2E_PROOF_DIR ?? path.resolve('tests/e2e/proofs'), 'BUG-007');

const MANAGE = [
  { key: 'school', href: '/dashboard/school' },
  { key: 'teachers', href: '/dashboard/school/teachers' },
  { key: 'classes', href: '/dashboard/school/classes' },
  { key: 'students', href: '/dashboard/school/students' },
] as const;
const TEACHER_RAIL = ['results', 'testSessions'] as const;

const label = (key: string) => cat(en, `Shell.nav.${key}`);
const railLinks = (page: Page) => page.locator('[data-slot="sidebar-content"] nav a[data-sidebar="menu-button"]');
const railLink = (page: Page, key: string) =>
  page.locator(`[data-slot="sidebar-content"] a[data-sidebar="menu-button"][aria-label="${label(key)}"]`);
async function shot(page: Page, name: string): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
  await page.screenshot({ path: path.join(PROOF, `${name}.png`), animations: 'disabled' });
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(() => mkdirSync(PROOF, { recursive: true }));
test.beforeEach(async ({ context }) => bridgeApiCors(context));

test('school admin: MANAGE reads School, Teachers, Classes, Students and each lights up on its route', async ({
  page,
}) => {
  await loginAs(page, 'schoolAdmin');
  await expect(railLink(page, 'school')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-slot="sidebar-content"]')).toContainText(cat(en, 'Shell.sidebar.groups.manage'));

  await expect(railLinks(page)).toHaveCount(MANAGE.length);
  const order = await railLinks(page).evaluateAll((links) => links.map((link) => link.getAttribute('aria-label')));
  expect(order).toEqual(MANAGE.map((item) => label(item.key)));
  await shot(page, '01-school-admin-rail-order');

  for (const [index, item] of MANAGE.entries()) {
    await railLink(page, item.key).click();
    await page.waitForURL((url) => url.pathname.endsWith(item.href), { timeout: 30_000 });
    await expect(railLink(page, item.key)).toHaveAttribute('data-active', /.*/);
    for (const other of MANAGE.filter((entry) => entry.key !== item.key)) {
      await expect(railLink(page, other.key)).not.toHaveAttribute('data-active', /.*/);
    }
    await shot(page, `0${index + 2}-active-${item.key}`);
  }

  const footer = page.locator('[data-slot="sidebar-footer"]');
  await expect(footer.locator(`a[aria-label="${label('account')}"]`)).toBeVisible();
});

test('teacher: the rail is still Classes then Live sessions, with no school-admin entry', async ({ page }) => {
  await loginAs(page, 'teacher');
  await expect(railLink(page, 'results')).toBeVisible({ timeout: 30_000 });

  const order = await railLinks(page).evaluateAll((links) => links.map((link) => link.getAttribute('aria-label')));
  expect(order).toEqual(TEACHER_RAIL.map(label));
  for (const key of ['school', 'teachers', 'students']) {
    await expect(railLink(page, key)).toHaveCount(0);
  }
  await shot(page, '06-teacher-rail-unchanged');
});
