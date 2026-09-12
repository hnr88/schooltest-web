import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import {
  expect,
  type APIRequestContext,
  type Browser,
  type Page,
  type PlaywrightWorkerArgs,
} from '@playwright/test';

import { classRosterResponseSchema } from '@/modules/results/schemas/roster.schema';
import { teacherDashboardResponseSchema } from '@/modules/teacher/schemas/teacher.schema';

import { API_BASE, bearer } from './teacher-results-live';
import { signIn } from './teacher-rail';
import { waitForAnimationsSettled } from './ui';

// Task 047 harness — the axe leg for /dashboard and /dashboard/results at both
// widths. Deliberately the SAME shape a11y-auth.spec.ts / a11y-responsive.spec.ts /
// shell-a11y.spec.ts already use (serious+critical FAIL, moderate/minor logged,
// documented exemptions logged LOUDLY by name) so there is one axe convention on
// this repo, not two. Every route argument is a LIVE document id read from
// C-TD-1/C-TR-1 — there is no class id or student id literal in this lane.
//
// R1 PART B: the teacher's `/dashboard` no longer has a surface of its own (the
// rail lands on the Classes list) and the live monitor is retired, so the audited
// set is the three v2 pages: Classes, the class detail, and the student page.

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
  /**
   * A student whose latest result carries EXACTLY ONE sitting — the first-sitting
   * render, which draws no growth and no comparison. It is `null` when the live
   * seed happens to carry none: every audited student has sat twice. The legs that
   * need that shape say so out loud and skip it rather than audit a second
   * two-sitting student under the wrong name (this really happens — a journey run
   * on the same database gives its students their second sitting).
   */
  oneTestStudentId: string | null;
}

async function readJson(
  request: APIRequestContext,
  jwt: string,
  url: string,
): Promise<{ status: number; body: unknown }> {
  // The runner-level request context inherits the config's :3002 baseURL, and
  // the Next app serves no /api routes — a relative path 404s against it, so
  // these reads must name the Strapi origin explicitly.
  const response = await request.get(url.startsWith('http') ? url : `${API_BASE}${url}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  return { status: response.status(), body: await response.json().catch(() => null) };
}

/**
 * teacher/15 — RE-POINTED to the SURVIVING student reads (orchestrator ruling,
 * chat-26560d5a): C-TD-1 for the classes, `GET /api/my/students/results?class=`
 * for the roster. The retired C-TR-1/2 reads answer 410 and are NEVER called
 * again — not directly, not via a fallback, not behind a flag.
 *
 * The two shapes come from the v2 view's own `history[]`: a result carrying two
 * or more sittings is the "comparison" shape, exactly one is the first-sitting
 * shape. The comparison STRIP itself retired with R-03, so history length is
 * the honest split — the a11y assertions target the rendered drill-down, which
 * the surviving reads serve completely.
 */
export async function readA11ySurface(
  playwright: PlaywrightWorkerArgs['playwright'],
): Promise<A11ySurface> {
  const request = await playwright.request.newContext();
  try {
    const jwt = await bearer(request);
    const dash = await readJson(request, jwt, '/api/teacher/dashboard');
    if (dash.status !== 200) throw new Error(`[e2e] C-TD-1 answered ${dash.status}`);
    const classes = teacherDashboardResponseSchema.parse(dash.body).classes;

    const seen: string[] = [];
    let fallback: A11ySurface | null = null;
    for (const klass of classes) {
      const roster = await readJson(
        request,
        jwt,
        `/api/my/students/results?class=${klass.class_document_id}`,
      );
      if (roster.status !== 200) {
        throw new Error(`[e2e] the roster read answered ${roster.status} for ${klass.name}`);
      }
      const rows = classRosterResponseSchema.parse(roster.body);
      const sittingsOf = (row: (typeof rows)[number]): number => row.result?.history?.length ?? 0;
      const two = rows.find((row) => sittingsOf(row) >= 2);
      const one = rows.find((row) => sittingsOf(row) === 1);
      seen.push(
        `${klass.name}: ${rows.length} rows, ${rows.filter((row) => sittingsOf(row) >= 2).length} with two+ sittings, ${rows.filter((row) => sittingsOf(row) === 1).length} with one`,
      );
      if (two === undefined) continue;
      const surface: A11ySurface = {
        classDocumentId: klass.class_document_id,
        twoTestStudentId: two.student.document_id,
        oneTestStudentId: one?.student.document_id ?? null,
      };
      if (one !== undefined) return surface;
      fallback ??= surface;
    }
    if (fallback !== null) {
      console.log(
        `[a11y surface] no student with exactly ONE sitting on the seed — the first-sitting legs are skipped. Inspected: ${seen.join(' | ')}`,
      );
      return fallback;
    }
    throw new Error(
      `[e2e] no seeded class carries a student with a scored sitting. Inspected: ${seen.join(' | ')}`,
    );
  } finally {
    await request.dispose();
  }
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

/**
 * TB-30: the v2 student page (`StudentDrillDownScreen`, chunk S10) publishes the
 * TanStack query's own status, so its settled frame is `success` — never the
 * `ready` word the other three surfaces use. Both a11y legs waited on `ready`
 * here and timed out; this is the one place that difference is spelled out.
 */
export async function openStudentReady(
  page: Page,
  classDocumentId: string,
  studentDocumentId: string,
): Promise<void> {
  await page.goto(`/dashboard/results/${classDocumentId}/students/${studentDocumentId}`);
  await expect(page.locator('[data-surface="teacher-student-drill-down"]')).toHaveAttribute(
    'data-status',
    'success',
    { timeout: 20_000 },
  );
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
        const box = el.getBoundingClientRect();
        // WCAG 2.4.7 asks whether the focus indicator is VISIBLE, not where it is
        // drawn. Reading `outline`/`box-shadow` off the focused element alone misses
        // two shapes this design uses constantly: a ring painted on the element's own
        // `::after` (the stretched row link) and a border the WRAPPER changes on
        // `:focus-within` (the pill search field). So the indicator is measured as a
        // DIFFERENCE: snapshot the element, its pseudo-elements and three ancestors
        // while focused, blur, snapshot again, then restore focus. Anything that
        // changes is an indicator; nothing changing is a real failure. A static
        // box-shadow (a card) no longer counts as a ring, which makes this stricter
        // than the check it replaces, not looser.
        const snapshot = (node: Element): string => {
          const own = getComputedStyle(node);
          const after = getComputedStyle(node, '::after');
          const before = getComputedStyle(node, '::before');
          return [own, after, before]
            .map((style) =>
              [
                style.outlineWidth,
                style.outlineStyle,
                style.outlineColor,
                style.outlineOffset,
                style.boxShadow,
                style.borderColor,
                style.borderWidth,
                style.backgroundColor,
                style.textDecorationLine,
                style.content,
              ].join(','),
            )
            .join('|');
        };
        const chain: Element[] = [];
        for (let node: Element | null = el; node !== null && chain.length < 4; node = node.parentElement) {
          chain.push(node);
        }
        const focused = chain.map(snapshot);
        el.blur();
        const blurred = chain.map(snapshot);
        el.focus({ preventScroll: true });
        return {
          tag: el.tagName.toLowerCase(),
          name: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40),
          hasRing: focused.some((value, position) => value !== blurred[position]),
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
