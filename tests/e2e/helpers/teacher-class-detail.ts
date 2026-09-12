import { expect, test, type Page, type Response } from '@playwright/test';

import { cat } from './i18n';
import { en } from './teacher-rail';
import { CLASS_STATUS_KEY } from '@/modules/teacher/constants/teacher-kit.constants';
import { classBadgeCode } from '@/modules/teacher/lib/teacher-kit';
import { teacherDashboardResponseSchema } from '@/modules/teacher/schemas/teacher.schema';
import type { DashboardClass, TeacherDashboardResponse } from '@/modules/teacher/types/teacher.types';

// Page helpers for the Teacher Portal v2 class-detail frame (teacher-v2/class-detail.spec.ts).
// Every expectation is built from the en catalog and the dashboard response the page received.

export const READY = /^(ready|empty)$/;
export const TABS = ['students', 'progress', 'insights', 'exit', 'reports', 'live'] as const;

/** The element each tab body renders once it has settled (Family reports has no body yet). */
export const TAB_BODIES: Partial<Record<(typeof TABS)[number], string>> = {
  progress: '[data-slot="class-progress"]',
  insights: '[data-slot="teaching-insights"]',
  reports: '[data-slot="family-reports"]',
  exit: '[data-slot="exit-predictions-panel"]',
  live: '[data-surface="teacher-test-day"]',
};

export const label = (key: string) => cat(en, `TeacherPortal.classDetail.${key}`);
export const param = (page: Page, key: string) => new URL(page.url()).searchParams.get(key);
export const frame = (page: Page) => page.locator('[data-surface="teacher-class-results"]');
export const header = (page: Page) => page.locator('[data-slot="class-results-header"]');
export const sectionTabs = (page: Page) => page.getByRole('tablist', { name: label('tabs.listLabel') });
export const sectionTab = (page: Page, key: string) =>
  sectionTabs(page).getByRole('tab', { name: label(`tabs.${key}`), exact: true });
export const skillTab = (page: Page, skill: string) =>
  page.getByRole('tablist', { name: label('skillsLabel') }).locator(`[data-skill="${skill}"]`);

/**
 * The GET /api/teacher/dashboard body the page itself received. A response whose body the
 * browser already discarded (the sign-in redirect navigates away) is skipped, and the next
 * one — the Classes screen refetches on mount — is read instead.
 */
export async function waitForDashboard(page: Page): Promise<TeacherDashboardResponse> {
  let body: unknown;
  await page.waitForResponse(async (response: Response) => {
    if (!response.url().includes('/api/teacher/dashboard')) return false;
    if (response.request().method() !== 'GET' || !response.ok()) return false;
    try {
      body = await response.json();
      return true;
    } catch {
      return false;
    }
  });
  return teacherDashboardResponseSchema.parse(body);
}

/** The en catalog's own meta ICU, resolved for one card ("Year 8 · 20 students"). */
export function metaText(card: DashboardClass): string {
  const template = label(card.year_level == null ? 'metaStudents' : 'metaYearStudents');
  return template
    .replace(/\{count, plural, one \{([^}]*)\} other \{([^}]*)\}\}/, (_all, one: string, other: string) =>
      (card.student_count === 1 ? one : other).replace('#', String(card.student_count)),
    )
    .replace('{year}', String(card.year_level ?? ''));
}

export async function expectHeader(page: Page, card: DashboardClass, classes: readonly DashboardClass[]) {
  const head = header(page);
  await expect(head.getByRole('heading', { level: 1 })).toHaveText(card.name);
  await expect(head.locator('[data-slot="class-meta"]')).toHaveText(metaText(card));
  await expect(head.locator('[data-slot="class-badge"]')).toHaveText(classBadgeCode(card.name));
  await expect(head.locator('[data-slot="status-pill"]')).toHaveText(
    cat(en, `TeacherPortal.kit.status.${CLASS_STATUS_KEY[card.status]}`),
  );
  const crumbs = head.locator('[data-slot="breadcrumb"]');
  await expect(crumbs.getByRole('link', { name: cat(en, 'TeacherPortal.kit.back') })).toHaveAttribute(
    'href',
    /\/dashboard\/results$/,
  );
  await expect(crumbs.getByRole('link', { name: label('crumbClasses'), exact: true })).toHaveAttribute(
    'href',
    /\/dashboard\/results$/,
  );
  await expect(crumbs.locator('[aria-current="page"]')).toHaveText(card.name);
  await expect(head.getByRole('button', { name: label('reports') })).toBeVisible();
  // TB-31: no class Ask AI that opens nothing. Until S11 mounts the class drawer the header
  // renders no Ask AI button at all; S11 replaces this with "the button opens the drawer".
  await expect(
    head.getByRole('button', { name: label('askAi') }),
    'TB-31: no dead class Ask AI',
  ).toHaveCount(0);
  await expect(
    head.locator('[data-slot="class-ask-ai-button"]'),
    'TB-31: no dead class Ask AI',
  ).toHaveCount(0);
  const switcher = head.getByRole('combobox', { name: label('switcherLabel') });
  await expect(switcher).toHaveValue(card.class_document_id);
  await expect(switcher.locator('option')).toHaveText(classes.map((entry) => entry.name));
}

/** Records (without asserting) errors raised by a surface outside this frame. */
export function setAsideErrors(errors: string[], surface: string): void {
  for (const message of errors.splice(0)) {
    test.info().annotations.push({ type: `outside-frame:${surface}`, description: message.slice(0, 400) });
  }
}

/** Drains the console/page errors seen since the last call; none may come from the frame. */
export function expectNoNewErrors(errors: string[], step: string) {
  expect(errors.splice(0), `console/page errors at: ${step}`).toEqual([]);
}
