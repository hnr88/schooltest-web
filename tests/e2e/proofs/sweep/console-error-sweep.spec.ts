/**
 * E2E SWEEP — every ops and school-admin portal route, three traps per route:
 *
 * 1. HARD NAVIGATION + ZERO-ERROR ASSERTION. Each route is loaded with a full
 *    page.goto (never client-side navigate), the app is allowed to settle, and
 *    every console message of type `error`, every `pageerror`, every response
 *    with status >= 400 and every non-abort failed request captured on that
 *    route must be ABSENT. A stale CSS/JS bundle state, a hydration exception
 *    or a dead endpoint all surface here — earlier live measurements showed a
 *    single such fault makes a whole page look broken with dead buttons.
 * 2. BUTTON CENSUS + SINGLE-CLICK SWEEP. Every visible, enabled button on the
 *    settled page is clicked exactly once (index-stable: the route is
 *    re-navigated whenever a click changed the URL, so every original button
 *    is reached on a fresh, identical page). Dialogs a click opens are
 *    dismissed with Escape. The assertion: clicking must not erupt an error.
 * 3. SILENT-HYDRATION FLAG. A route where EVERY click is inert (no navigation,
 *    no dialog, no DOM mutation) AND zero console messages of any type were
 *    emitted is the "hydration never completed" signature — such routes are
 *    logged with `sweep-hydration-flag` for manual follow-up instead of
 *    hard-failed, because the observable is indirect.
 *
 * Runs against the LIVE stack (web :3002, API :5500 — never restarted by this
 * spec; playwright.config reuses the listening server). One UI sign-in per
 * role; the JWT the app itself stored in localStorage (`app.auth.token`) also
 * resolves the dynamic document IDs (class / student / teacher) through the
 * real API, so the sweep survives reseeds without editing IDs.
 */
import { expect, test, type Browser, type Page } from '@playwright/test';

import { loginAs } from '../../helpers/roles';
import {
  attachCapture,
  captureErrors,
  KNOWN_BACKEND_DEFECTS,
  newCaptures,
  SWEEP_INSTRUMENTS,
  sweepRoute,
  type SweepCaptures,
} from './sweep.helpers';

const API = process.env.API_BASE_URL ?? 'http://localhost:5500';
/** Task-designated fixture schools: Demo School A (ops tabs + SA tenancy) and
 * the Seeded Demo School (a second, populated ops school detail). */
const OPS_SCHOOL = 'y71h16mmldmxfecnao4diqd0';
const SEEDED_SCHOOL = 'zb6j30274xnde80mrdqjxxhr';

interface RouteSpec {
  name: string;
  path: string;
}

// Dev-server first-hit compiles dominate the budget: 600s per route slot.
test.describe.configure({ mode: 'serial', timeout: 600_000 });

const cap: SweepCaptures = newCaptures();
let page: Page;
let currentRoute = 'setup';
let activeToken = '';

/** Resolve dynamic IDs through the real API with the app's own JWT. */
async function dataList(path: string): Promise<Record<string, unknown>[]> {
  const res = await page.request.get(`${API}${path}`, {
    headers: { Authorization: `Bearer ${activeToken}` },
  });
  expect(res.status(), `${path}: ${await res.text()}`).toBeLessThan(300);
  const body = (await res.json()) as { data: unknown };
  return Array.isArray(body.data)
    ? (body.data as Record<string, unknown>[])
    : [body.data as Record<string, unknown>];
}

/** Prefer a class that actually has students and is not flagged in its name. */
function pickClass(rows: Record<string, unknown>[]): string {
  const usable = rows.filter(
    (row) =>
      Number(row.student_count ?? 0) > 0 &&
      !String(row.name ?? '').match(/archived|pending|no students/i),
  );
  return String((usable[0] ?? rows[0]).documentId);
}

/** The one sweep body, shared by every route slot of both roles. */
async function runRouteSweep(spec: RouteSpec, role: 'ops' | 'schoolAdmin'): Promise<void> {
  const errorsBefore = captureErrors(cap).length;
  const consoleBefore = cap.allConsole.length;
  currentRoute = spec.name;

  const result = await sweepRoute(page, spec.path, {
    onReauth: () => loginAs(page, role),
    enterTeardown: (label) => {
      cap.suppressing = true;
      cap.suppressed.push(`--- teardown window opened by "${label}" on ${spec.name} ---`);
    },
    exitTeardown: () => {
      cap.suppressing = false;
    },
    onFullyInert: (r) => {
      if (cap.allConsole.length === consoleBefore) {
        console.log(
          `[sweep-hydration-flag] ${spec.name}: ${r.clicked} clicks all inert with zero ` +
            'console output — buttons exist but hydration may never have completed. ' +
            'MANUAL FOLLOW-UP REQUIRED.',
        );
      }
    },
  });

  console.log(
    `[sweep] ${spec.name}: buttons=${result.buttons} clicked=${result.clicked}` +
      (result.unvisited > 0 ? ` unvisited=${result.unvisited} (walk budget)` : '') +
      (cap.suppressed.length > 0
        ? ` teardownSuppressed=${cap.suppressed.length} (sign-out window, see log)`
        : '') +
      (result.inert.length > 0
        ? ` inert=${JSON.stringify(result.inert)} (inert alone is not a failure)`
        : ''),
  );
  if (cap.suppressed.length > 0) {
    console.log(`[sweep-teardown] ${spec.name} suppressed:\n${cap.suppressed.slice(0, 8).join('\n')}`);
    cap.suppressed.length = 0;
  }
  const found = captureErrors(cap).slice(errorsBefore);
  // Strict zero for everything the web owns. The only tolerated entries are
  // exact, cited cross-repo defects (KNOWN_BACKEND_DEFECTS) — each one is
  // still printed loudly so it cannot decay into accepted background noise.
  const allowed = KNOWN_BACKEND_DEFECTS.filter(
    (known) =>
      known.route.test(spec.name) &&
      found.some((error) => known.pattern.test(error)),
  );
  for (const known of allowed) {
    console.log(
      `[sweep-known-backend-defect] ${spec.name}: ${known.pattern.source} — OWNING REPO: ${known.cite}`,
    );
  }
  const unexpected = found.filter(
    (error) => !allowed.some((known) => known.pattern.test(error)),
  );
  expect(
    unexpected,
    `${spec.name} erupted ${unexpected.length} error(s):\n${unexpected.join('\n')}`,
  ).toEqual([]);
}

function resetCapturesAfterLogin(): void {
  cap.consoleErrors.length = 0;
  cap.pageErrors.length = 0;
  cap.badResponses.length = 0;
  cap.failedRequests.length = 0;
  cap.allConsole.length = 0;
}

async function openSweptPage(browser: Browser, role: 'ops' | 'schoolAdmin'): Promise<void> {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(SWEEP_INSTRUMENTS);
  page = await context.newPage();
  attachCapture(page, () => currentRoute, cap);
  await loginAs(page, role);
  activeToken = (await page.evaluate(() => localStorage.getItem('app.auth.token'))) ?? '';
}

test.describe('ops portal sweep', () => {
  let routes: RouteSpec[] = [];

  test.beforeAll(async ({ browser }) => {
    await openSweptPage(browser, 'ops');
    const classId = pickClass(await dataList(`/api/ops/schools/${OPS_SCHOOL}/classes`));
    const tabs = ['overview', 'admins', 'teachers', 'classes', 'students'] as const;
    routes = [
      { name: 'ops home', path: '/dashboard/ops' },
      { name: 'ops schools list', path: '/dashboard/ops/schools' },
      ...tabs.map(
        (tab): RouteSpec => ({
          name: `ops school A detail ${tab}`,
          path: `/dashboard/ops/schools/${OPS_SCHOOL}?tab=${tab}`,
        }),
      ),
      ...tabs.map(
        (tab): RouteSpec => ({
          name: `ops school seeded detail ${tab}`,
          path: `/dashboard/ops/schools/${SEEDED_SCHOOL}?tab=${tab}`,
        }),
      ),
      { name: 'ops class detail', path: `/dashboard/ops/schools/${OPS_SCHOOL}/classes/${classId}` },
      { name: 'ops settings', path: '/dashboard/ops/settings' },
    ];
    resetCapturesAfterLogin();
  });

  // Route slots are static (Playwright collects titles before beforeAll runs);
  // the resolved path comes from module state at run time.
  const opsSlots: RouteSpec[] = [
    { name: 'ops home', path: '' },
    { name: 'ops schools list', path: '' },
    ...(['overview', 'admins', 'teachers', 'classes', 'students'] as const).flatMap((school) =>
      (['A', 'seeded'] as const).map(
        (which): RouteSpec => ({ name: `ops school ${which} detail ${school}`, path: '' }),
      ),
    ),
    { name: 'ops class detail', path: '' },
    { name: 'ops settings', path: '' },
  ];

  for (const slot of opsSlots) {
    test(`sweep ${slot.name}`, async () => {
      const spec = routes.find((route) => route.name === slot.name);
      expect(spec, `beforeAll must resolve "${slot.name}"`).toBeTruthy();
      await runRouteSweep(spec as RouteSpec, 'ops');
    });
  }
});

test.describe('school-admin portal sweep', () => {
  let routes: RouteSpec[] = [];

  test.beforeAll(async ({ browser }) => {
    await openSweptPage(browser, 'schoolAdmin');
    const classes = await dataList('/api/schools/me/classes');
    const classId = pickClass(classes);
    const students = await dataList('/api/schools/me/children');
    const active =
      students.some((row) => row.status === 'active')
        ? students.filter((row) => row.status === 'active')
        : students;
    const studentId = String(active[0].documentId);
    const teachers = await dataList('/api/schools/me/teachers');
    const usable = teachers.filter((row) => row.blocked !== true && row.role === 'teacher');
    const teacherId = String((usable[0] ?? teachers[0]).documentId);

    routes = [
      { name: 'sa home', path: '/dashboard/school' },
      { name: 'sa classes', path: '/dashboard/school/classes' },
      { name: 'sa class detail', path: `/dashboard/school/classes/${classId}` },
      { name: 'sa students', path: '/dashboard/school/students' },
      { name: 'sa student drill-down', path: `/dashboard/school/students/${studentId}` },
      { name: 'sa teachers', path: '/dashboard/school/teachers' },
      { name: 'sa teacher detail', path: `/dashboard/school/teachers/${teacherId}` },
      { name: 'sa account', path: '/dashboard/school/account' },
      { name: 'sa participation', path: '/dashboard/school/participation' },
      { name: 'sa analytics', path: '/dashboard/school/analytics' },
    ];
    resetCapturesAfterLogin();
  });

  const saSlots: RouteSpec[] = [
    { name: 'sa home', path: '' },
    { name: 'sa classes', path: '' },
    { name: 'sa class detail', path: '' },
    { name: 'sa students', path: '' },
    { name: 'sa student drill-down', path: '' },
    { name: 'sa teachers', path: '' },
    { name: 'sa teacher detail', path: '' },
    { name: 'sa account', path: '' },
    { name: 'sa participation', path: '' },
    { name: 'sa analytics', path: '' },
  ];

  for (const slot of saSlots) {
    test(`sweep ${slot.name}`, async () => {
      const spec = routes.find((route) => route.name === slot.name);
      expect(spec, `beforeAll must resolve "${slot.name}"`).toBeTruthy();
      await runRouteSweep(spec as RouteSpec, 'schoolAdmin');
    });
  }
});
