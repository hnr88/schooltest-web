import path from 'node:path';

import { expect, type Locator, type Page, type Response } from '@playwright/test';

// S8 — locators for the ONE "Start a new session" modal (teacher/components/
// start-session). Its markers are the modal's own data-slot/data-value hooks, so
// a spec never reaches for design copy it cannot derive from the catalog.

export const PROOFS = path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'teacher-v2');

export const modal = (page: Page) => page.locator('[data-surface="start-session-modal"]');

/** A radio card: a "When" mode, a form id, or a Students scope ("whole" | "some"). */
export const choice = (scope: Locator, value: string) =>
  scope.locator(`[data-slot="start-choice"][data-value="${value}"]`);

export const modalTab = (scope: Locator, key: string) => scope.locator(`[role="tab"][data-tab="${key}"]`);

export const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(PROOFS, `${name}.png`), animations: 'disabled' });

/** The modal's own write: C-TS-1 create (POST) or C-TS-5 booking edit (PATCH). */
export function isSessionWrite(response: Response, method: 'POST' | 'PATCH', sittingId?: string): boolean {
  const target = sittingId ? `/api/teacher/test-sessions/${sittingId}` : '/api/teacher/test-sessions';
  return response.request().method() === method && new URL(response.url()).pathname === target;
}

/** Start now lands on the class's Live tab with the new sitting selected. */
export const isLiveTab = (classId: string, sittingId: string) => (url: URL) =>
  url.pathname.endsWith(`/dashboard/results/${classId}`) &&
  url.searchParams.get('tab') === 'live' &&
  url.searchParams.get('session') === sittingId;

/** Opens the modal from the Classes header (a fresh form every time). */
export async function openFromClasses(page: Page, title: string): Promise<void> {
  if ((await modal(page).count()) > 0) return;
  await page.goto('/dashboard/results');
  await page.locator('[data-slot="start-session-button"]').click();
  await expect(modal(page).getByRole('heading', { name: title })).toBeVisible({ timeout: 30_000 });
}

/**
 * "Last session" as the design writes it (`:2602` "31 Aug"): the browser's zone, the app
 * locale's day and short month, the DAY FIRST (P1 parity row 8). Built here from the parts,
 * so the expectation is the design's order and not whatever order the app chose.
 */
export async function lastSessionText(page: Page, openedAt: string | null, noneYet: string): Promise<string> {
  if (openedAt === null) return noneYet;
  const timeZone = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const parts = new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', timeZone }).formatToParts(
    new Date(openedAt),
  );
  const value = (type: 'day' | 'month') => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('day')} ${value('month')}`;
}

/** The drawn height of one box, for the design's exact geometry (P1 parity rows 14, 16). */
export async function boxHeight(target: Locator): Promise<number> {
  return (await target.boundingBox())?.height ?? 0;
}

/** Waits until the modal has read the roster, the busy check and the facts (no "—" left). */
export async function waitForModalData(page: Page): Promise<void> {
  await expect(modal(page).locator('[data-slot="start-session-cta"]')).not.toHaveAttribute('aria-busy', 'true', {
    timeout: 30_000,
  });
  await expect(modal(page).locator('[data-fact="last"] dd')).not.toHaveText('—');
}
