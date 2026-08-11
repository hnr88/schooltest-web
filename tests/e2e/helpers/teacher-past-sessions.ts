import {
  expect,
  type APIRequestContext,
  type Locator,
  type Page,
  type Route,
} from '@playwright/test';

import { PAST_SESSION_STATUS_LABEL_KEY } from '@/modules/teacher/constants/past-sessions.constants';
import { findTestLabel } from '@/modules/teacher/lib/join-code';
import type {
  SittingStatus,
  TeacherTestSession,
} from '@/modules/teacher/types/teacher-session.types';
import type { TeacherTest } from '@/modules/teacher/types/teacher.types';

import { cat } from './i18n';
import { readSessions } from './teacher-past-sessions-api';
import { en, navLink } from './teacher-rail';

// Task 036 — the DOM half of the harness (contract C-TS-2). The expected copy is
// read from the SHIPPED catalog through the SHIPPED status→key map, so renaming
// either fails the spec instead of passing a stale literal.

export const PAST_SESSIONS_NS = 'Teacher.testSessions.pastSessions';

/** The status word the row must print beside its tinted pill (WCAG 2.2 AA 1.4.1). */
export function statusWord(status: SittingStatus): string {
  return cat(en, `${PAST_SESSIONS_NS}.${PAST_SESSION_STATUS_LABEL_KEY[status]}`);
}

/** Opens Test sessions from the rail and waits for the READY history panel. */
export async function openTestSessions(page: Page): Promise<void> {
  if (!page.url().includes('/dashboard/test-sessions')) {
    await navLink(page, cat(en, 'Shell.nav.testSessions')).click();
    await page.waitForURL('**/dashboard/test-sessions');
  }
  await expect(pastSessionsPanel(page)).toHaveAttribute('data-status', 'ready', {
    timeout: 20_000,
  });
}

export function pastSessionsPanel(page: Page): Locator {
  return page.locator('[data-slot="past-sessions"]');
}

export function pastSessionRows(page: Page): Locator {
  return page.locator('[data-slot="past-session-row"]');
}

export interface ScrapedRow {
  status: string;
  className: string;
  code: string;
  test: string;
  date: string;
  dateIso: string;
  statusWord: string;
  completed: string;
  completedAria: string;
  missing: string[];
}

/** The whole rendered table in one pass — 160+ real rows are compared, not a page. */
export async function scrapeRows(page: Page): Promise<ScrapedRow[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-slot="past-session-row"]')).map((row) => {
      const text = (selector: string): string =>
        (row.querySelector(selector)?.textContent ?? '').trim();
      const bar = row.querySelector('[role="progressbar"]');
      const time = row.querySelector('time');
      return {
        status: row.getAttribute('data-status') ?? '',
        className: text('[data-slot="past-session-class"]'),
        code: text('[data-slot="past-session-code"] .tabular-nums'),
        test: text('[data-slot="past-session-test"]'),
        date: (time?.textContent ?? '').trim(),
        dateIso: time?.getAttribute('datetime') ?? '',
        statusWord: text('[data-slot="status-pill"]'),
        completed: bar?.getAttribute('aria-valuetext') ?? '',
        completedAria: bar?.getAttribute('aria-label') ?? '',
        missing: Array.from(
          row.querySelectorAll('[data-slot="session-missing-value"] .sr-only'),
        ).map((node) => (node.textContent ?? '').trim()),
      };
    }),
  );
}

/**
 * The wire and the DOM captured against the SAME server state. Sibling agents
 * open real sittings on this instance while the suite runs, so a body read once
 * in `beforeAll` can legitimately be one row behind the page; this re-reads and
 * re-scrapes until the two agree instead of loosening the assertion to a range.
 */
export async function syncedRows(
  page: Page,
  request: APIRequestContext,
  jwt: string,
): Promise<{ wire: readonly TeacherTestSession[]; rendered: ScrapedRow[] }> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.reload();
    await openTestSessions(page);
    const rendered = await scrapeRows(page);
    const wire = await readSessions(request, jwt);
    if (wire.length === rendered.length) return { wire, rendered };
  }
  throw new Error('[e2e] C-TS-2 kept changing under the page; could not capture one state');
}

/** What `format.dateTime(..., { dateStyle: 'medium' })` renders for the 'en' catalog. */
export function mediumDate(iso: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(iso));
}

/**
 * Compares the WHOLE rendered table against the WHOLE C-TS-2 body, row by row and
 * field by field, and reports how many rows exercised each nullable branch so the
 * caller can prove those branches were not dead code on this instance.
 */
export function expectRowsMatchWire(
  rendered: readonly ScrapedRow[],
  wire: readonly TeacherTestSession[],
  tests: readonly TeacherTest[],
): { nullCodes: number; nullVariants: number } {
  let nullCodes = 0;
  let nullVariants = 0;

  rendered.forEach((row, index) => {
    const sitting = wire[index];
    const at = (field: string): string => `row ${index} ${field}`;
    expect(row.className, at('class')).toBe(sitting.class.name);
    expect(row.status, at('status')).toBe(sitting.status);
    expect(row.statusWord, at('status word')).toBe(statusWord(sitting.status));
    expect(row.completed, at('completion')).toBe(`${sitting.completed} / ${sitting.expected}`);
    expect(row.completedAria, at('completion label')).toContain(sitting.class.name);

    // NULLABLE `code`: an em dash plus a screen-reader sentence, never a blank
    // cell and never an invented code.
    if (sitting.code === null) {
      nullCodes += 1;
      expect(row.code, at('code')).toBe('');
      expect(row.missing, at('code marker')).toContain(cat(en, `${PAST_SESSIONS_NS}.noCode`));
    } else {
      expect(row.code, at('code')).toBe(sitting.code);
    }

    // NULLABLE `opened_at`.
    if (sitting.opened_at === null) {
      expect(row.missing, at('date marker')).toContain(cat(en, `${PAST_SESSIONS_NS}.noDate`));
    } else {
      expect(row.dateIso, at('date iso')).toBe(sitting.opened_at);
      expect(row.date, at('date')).toBe(mediumDate(sitting.opened_at));
    }

    // The Test column prints C-TD-2's OWN label; a variant outside the A|B pair
    // has no label to print and says so.
    const label = findTestLabel(tests, sitting.variant);
    if (label === null) {
      nullVariants += 1;
      expect(row.missing, at('test marker')).toContain(cat(en, `${PAST_SESSIONS_NS}.noTest`));
    } else {
      expect(row.test, at('test')).toBe(label);
    }
  });

  return { nullCodes, nullVariants };
}

/**
 * Perturbs STRAPI'S OWN C-TS-2 answer in flight — the real request goes out, the
 * real body comes back, and only the named field changes on the way through.
 * The datastore holds no sitting with a NULL `opened_at`, yet the contract pins
 * it nullable, so this is how the null branch is proven without inventing a row.
 */
export async function withSessionsWire(
  page: Page,
  mutate: (sessions: TeacherTestSession[]) => void,
): Promise<void> {
  await page.route('**/api/teacher/test-sessions', async (route: Route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }
    const response = await route.fetch();
    const body = (await response.json()) as { sessions: TeacherTestSession[] };
    mutate(body.sessions);
    await route.fulfill({ response, json: body });
  });
  await page.reload();
}
