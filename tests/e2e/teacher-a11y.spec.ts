import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import {
  DESKTOP,
  MOBILE,
  SCREENSHOTS,
  expectNoHorizontalScroll,
  expectTeacherAxeClean,
  openReady,
  openStudentReady,
  readA11ySurface,
  signedInTeacherContextPage,
  type A11ySurface,
} from './helpers/teacher-a11y';
import { TABS, sectionTabs } from './helpers/teacher-class-detail';
import { watchErrors } from './helpers/ui';

// TASK 047 — the axe leg of the WCAG 2.2 AA pass over the teacher's Classes pages
// (Teacher Portal v2): the Classes list (a teacher's /dashboard lands there), the class
// detail's six section tabs, and the student page (one- and two-test), at 1280×900 AND
// 375×812, plus the REAL error frame of the class detail (an unknown class id, which
// the live reads refuse — a real failure, never an injected one).
//
// /dashboard/test-sessions and the live monitor are DEFERRED (task 053 owns them):
// this file must not be read as whole-surface coverage.
//
// One sign-in per file, navigating in-session: the API rate-limits POST
// /api/auth/local per IP, and a login per test trips it (see teacher-results-live).
test.describe.configure({ mode: 'serial' });

let page: Page;
let surface: A11ySurface;
let errors: string[];

const UNKNOWN_CLASS = 'zzzzzzzzzzzzzzzzzzzzzzzz';

test.beforeAll(async ({ browser, playwright }) => {
  surface = await readA11ySurface(playwright);
  page = await signedInTeacherContextPage(browser);
  errors = watchErrors(page);
});

test.afterAll(async () => {
  await page.context().close();
});

async function auditTabs(width: number): Promise<void> {
  const tabs = sectionTabs(page).getByRole('tab');
  await expect(tabs).toHaveCount(TABS.length);
  for (let index = 0; index < TABS.length; index += 1) {
    const tab = tabs.nth(index);
    const name = ((await tab.textContent()) ?? '').trim();
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expectTeacherAxeClean(page, `results tab "${name}" @ ${width}px`);
    await expectNoHorizontalScroll(page, `results tab "${name}" @ ${width}px`);
  }
}

for (const viewport of [DESKTOP, MOBILE]) {
  const width = viewport.width;

  test(`AXE: the Classes landing + the six section tabs are clean @ ${width}px`, async () => {
    await page.setViewportSize(viewport);
    // /dashboard hands a teacher to the Classes list; audit it where it lands.
    await openReady(page, '/dashboard', 'teacher-results');
    await expect(page).toHaveURL(/\/dashboard\/results$/);
    await expectTeacherAxeClean(page, `/dashboard/results @ ${width}px`);
    await expectNoHorizontalScroll(page, `/dashboard/results @ ${width}px`);
    await page.screenshot({
      path: path.join(SCREENSHOTS, `047-teacher-results-list-${width}.png`),
      fullPage: true,
    });

    await openReady(
      page,
      `/dashboard/results/${surface.classDocumentId}`,
      'teacher-class-results',
    );
    await auditTabs(width);
    await page.screenshot({
      path: path.join(SCREENSHOTS, `047-teacher-class-detail-${width}.png`),
      fullPage: true,
    });
  });

  test(`AXE: the student drill-down is clean for one AND two tests @ ${width}px`, async () => {
    await page.setViewportSize(viewport);
    const shapes: ReadonlyArray<readonly [string, string]> = [
      ['two-test', surface.twoTestStudentId],
      ...(surface.oneTestStudentId === null
        ? []
        : ([['one-test', surface.oneTestStudentId]] as const)),
    ];
    for (const [label, studentDocumentId] of shapes) {
      await openStudentReady(page, surface.classDocumentId, studentDocumentId);
      await expectTeacherAxeClean(page, `drill-down ${label} @ ${width}px`);
      await expectNoHorizontalScroll(page, `drill-down ${label} @ ${width}px`);
      await page.screenshot({
        path: path.join(SCREENSHOTS, `047-teacher-drilldown-${label}-${width}.png`),
        fullPage: true,
      });
    }
  });

  test(`AXE: the class-detail ERROR frame is clean and keeps ONE h1 @ ${width}px`, async () => {
    await page.setViewportSize(viewport);
    await page.goto(`/dashboard/results/${UNKNOWN_CLASS}`);
    // A class id outside the teacher's own classes — a real refusal from the live
    // reads, not a stubbed response, and the reason the READY h1 cannot render.
    await expect(page.locator('[data-surface="teacher-class-results"]')).toHaveAttribute(
      'data-status',
      'error',
      { timeout: 20_000 },
    );
    await expect(page.locator('h1')).toHaveCount(1);
    await expectTeacherAxeClean(page, `class-detail error @ ${width}px`);
    await expectNoHorizontalScroll(page, `class-detail error @ ${width}px`);
  });
}

test('no console errors were raised on any audited frame', async () => {
  // The deliberate 404 above is a real network failure the browser logs; every other
  // console error would be a defect, so it is the one tolerated line.
  const unexpected = errors.filter((entry) => !entry.includes('404'));
  expect(unexpected, unexpected.join('\n')).toEqual([]);
});
