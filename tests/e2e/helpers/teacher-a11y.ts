import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, type Browser, type Page, type PlaywrightWorkerArgs } from '@playwright/test';

import type { ClassStudentRow } from '@/modules/teacher/types/teacher-result.types';

import { signIn } from './teacher-rail';
import { readClassStudentsLive, readLiveResults } from './teacher-results-live';
import { waitForAnimationsSettled } from './ui';

// Task 047 harness — the axe leg for /dashboard and /dashboard/results at both
// widths. Deliberately the SAME shape a11y-auth.spec.ts / a11y-responsive.spec.ts /
// shell-a11y.spec.ts already use (serious+critical FAIL, moderate/minor logged,
// documented exemptions logged LOUDLY by name) so there is one axe convention on
// this repo, not two. Every route argument is a LIVE document id read from
// C-TD-1/C-TR-1 — there is no class id or student id literal in this lane.
//
// /dashboard/test-sessions and the live monitor are NOT covered here: task 053
// owns them, and task 047's own file records them as deferred.

export const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
export const DESKTOP = { width: 1280, height: 900 } as const;
export const MOBILE = { width: 375, height: 812 } as const;

/**
 * `src/components/ui/table.tsx` wraps every table in
 * `<div data-slot="table-container" class="…overflow-x-auto">`. At 375px the
 * Progress tab's mastery-shift table overflows it, and axe asks for the wrapper to
 * be focusable — unreachable from any caller without editing a read-only primitive
 * (Law 11), which is why shell-a11y.spec.ts and a11y-auth.spec.ts already carry it.
 * Task 047 re-confirmed the call rather than inheriting it silently: it is logged by
 * name on every run and never dropped.
 */
export const TABLE_SCROLL_EXEMPTION = ['scrollable-region-focusable'] as const;

const describe = (violation: { impact?: string | null; id: string; nodes: { target: unknown[] }[] }) =>
  `${violation.impact}:${violation.id} → ${violation.nodes.map((node) => node.target.join(' ')).join(' | ')}`;

/**
 * Zero serious/critical axe violations, with the mid-animation trap closed first.
 *
 * The shell runs a one-shot `animate-in fade-in slide-in-from-left-3` on the rail
 * card. Scanning before it finishes makes axe blend the mid-fade opacity into its
 * contrast maths and report the rail labels, the user-role line, the breadcrumb and
 * the notification badge — all of which pass at rest (measured both ways on the
 * same URL). Settling first scans the state a teacher actually sees; it relaxes no
 * rule and skips no node.
 */
export async function expectTeacherAxeClean(
  page: Page,
  label: string,
  exemptions: readonly string[] = TABLE_SCROLL_EXEMPTION,
): Promise<void> {
  await page.waitForLoadState('networkidle');
  await waitForAnimationsSettled(page);
  const results = await new AxeBuilder({ page }).analyze();
  const severe = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  const exempted = severe.filter((violation) => exemptions.includes(violation.id));
  const advisories = results.violations.filter(
    (violation) => violation.impact === 'moderate' || violation.impact === 'minor',
  );
  if (exempted.length > 0) {
    console.log(
      `[axe ${label}] KNOWN NON-BLOCKING (read-only ui/ primitive, task 047 re-confirmed):`,
      exempted.map(describe).join(', '),
    );
  }
  if (advisories.length > 0) {
    console.log(`[axe ${label}] moderate/minor:`, advisories.map(describe).join(', '));
  }
  expect(
    severe.filter((violation) => !exemptions.includes(violation.id)).map(describe),
    label,
  ).toEqual([]);
}

/** No horizontal scrollbar on the document at the current viewport. */
export async function expectNoHorizontalScroll(page: Page, label: string): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow, `${label}: document overflowed its viewport by ${overflow}px`).toBeLessThanOrEqual(1);
}

export interface A11ySurface {
  classDocumentId: string;
  twoTestStudentId: string;
  oneTestStudentId: string;
}

const isDone = (cell: { state: string }): boolean => cell.state === 'done';

/**
 * The live surface this pass needs, resolved from C-TD-1 + C-TR-1: the first class
 * the seeded teacher owns, a student with BOTH tests complete (the only shape that
 * can show a comparison strip + a collapsed older test) and a student with exactly
 * one. A class that cannot supply both shapes throws instead of quietly narrowing
 * the audit.
 */
export async function readA11ySurface(
  playwright: PlaywrightWorkerArgs['playwright'],
): Promise<A11ySurface> {
  const live = await readLiveResults(playwright);
  for (const klass of live.classes) {
    const detail = await readClassStudentsLive(playwright, klass.class_document_id);
    const two = detail.students.find(
      (row: ClassStudentRow) => isDone(row.test_a) && isDone(row.test_b),
    );
    const one = detail.students.find(
      (row: ClassStudentRow) => isDone(row.test_a) !== isDone(row.test_b),
    );
    if (two && one) {
      return {
        classDocumentId: klass.class_document_id,
        twoTestStudentId: two.student_document_id,
        oneTestStudentId: one.student_document_id,
      };
    }
  }
  throw new Error('[e2e] no seeded class carries both a two-test and a one-test student');
}

/**
 * ONE signed-in teacher page per spec file, created through `browser.newContext()`.
 *
 * `signedInTeacherPage` in teacher-results-live.ts uses `browser.newPage()`, and
 * `@axe-core/playwright` REFUSES such a page outright ("Please use
 * browser.newContext()") because it needs the context to add its init script. Rather
 * than change a helper four other specs already depend on, the axe lanes get their
 * own bootstrap — same real /sign-in form, same one-login-per-file pacing (the API
 * rate-limits POST /api/auth/local per IP).
 */
export async function signedInTeacherContextPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ viewport: { ...DESKTOP } });
  const page = await context.newPage();
  await signIn(page, 'teacher');
  return page;
}

/** Navigates to one in-scope route and waits for its READY frame — never a skeleton. */
export async function openReady(page: Page, url: string, surface: string): Promise<void> {
  await page.goto(url);
  await expect(page.locator(`[data-surface="${surface}"]`)).toHaveAttribute('data-status', 'ready', {
    timeout: 20_000,
  });
}

/** Every focusable element the browser's own tab order visits, with its focus indicator. */
export interface FocusStop {
  tag: string;
  name: string;
  hasRing: boolean;
  width: number;
  height: number;
  isDevChrome: boolean;
}

export async function tabStops(page: Page, steps: number): Promise<FocusStop[]> {
  await page.locator('body').press('Tab');
  const stops: FocusStop[] = [];
  for (let index = 0; index < steps; index += 1) {
    stops.push(
      await page.evaluate(() => {
        const el = document.activeElement;
        if (!(el instanceof HTMLElement)) {
          return { tag: 'none', name: '', hasRing: false, width: 0, height: 0, isDevChrome: true };
        }
        const style = getComputedStyle(el);
        const box = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          name: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40),
          hasRing:
            (Number.parseFloat(style.outlineWidth) > 0 && style.outlineStyle !== 'none') ||
            style.boxShadow !== 'none',
          width: Math.round(box.width),
          height: Math.round(box.height),
          // Dev-server chrome only, none of which exists in a production build: the
          // TanStack Query devtools trigger, the Next.js dev overlay's custom element,
          // and BODY (where the tab order lands once it wraps past the last stop).
          isDevChrome:
            el.closest('.tsqd-parent-container') !== null ||
            el.tagName === 'BODY' ||
            el.tagName === 'NEXTJS-PORTAL',
        };
      }),
    );
    await page.keyboard.press('Tab');
  }
  return stops;
}
