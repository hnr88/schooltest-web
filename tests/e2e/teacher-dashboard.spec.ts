import { expect, test, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { installPersonaSampler, personaFrames } from './helpers/teacher-dashboard-live';
import { signIn } from './helpers/teacher-rail';

// Task 032 / contract C-TD-1 — the teacher landing. A teacher's /dashboard is the
// Classes screen (/dashboard/results, `teacher-results`); what this file pins is the
// path there: signing in never paints or reads as the parent persona. The Classes
// screen itself is proven by teacher-v2/classes.spec.ts and its axe pass by
// teacher-a11y.spec.ts.
const en = loadMessages('en');

const surface = (page: Page) => page.locator('[data-surface="teacher-results"]');

test.describe.configure({ mode: 'serial' });

test.describe('teacher dashboard (C-TD-1)', () => {
  let page: Page;
  const apiCalls: string[] = [];

  test.beforeAll(async ({ browser }) => {
    // Lane recipe (proof/07/14): a cold dev-server compile or an API restart
    // window outlives the 30s hook default; Playwright 1.61 takes the budget
    // from setTimeout INSIDE the hook.
    test.setTimeout(180_000);
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    page = await context.newPage();
    page.on('response', (res) => {
      const { pathname } = new URL(res.url());
      if (pathname.startsWith('/api/')) apiCalls.push(`${res.status()} ${pathname}`);
    });
    await installPersonaSampler(page);
    await signIn(page, 'teacher');
    await expect(surface(page)).toHaveAttribute('data-status', 'ready');
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('the sign-in path never paints or reads as the parent persona', async () => {
    const frames = await personaFrames(page);
    expect(frames.length).toBeGreaterThan(0);
    for (const frame of frames) {
      expect(frame, `wrong persona frame painted: ${frame}`).not.toContain('PARENT');
      expect(frame, `unknown surface painted: ${frame}`).not.toContain('UNKNOWN-MAIN');
    }
    expect(frames[frames.length - 1]).toBe('teacher:ready');

    // The role arrives only with GET /api/users/me — the login payload carries no
    // `role`. Branching before it lands mounted the parent Overview, whose
    // parent-only students read answers 403 for a teacher.
    expect(apiCalls.filter((call) => call.includes('/api/my/students'))).toEqual([]);
    expect(apiCalls.filter((call) => !/^2\d\d /.test(call))).toEqual([]);
    await expect(page.getByText(cat(en, 'Dashboard.studentsError'))).toHaveCount(0);
  });
});
