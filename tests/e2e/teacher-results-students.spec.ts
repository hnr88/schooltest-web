import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type APIRequestContext, type BrowserContext, type Locator, type Page } from '@playwright/test';

import { classRosterResponseSchema } from '@/modules/results/schemas/roster.schema';
import { ACARA_PHASES } from '@/modules/classes/schemas/class-detail.schema';
import { teacherDashboardResponseSchema } from '@/modules/teacher/schemas/teacher.schema';

import { cat } from './helpers/i18n';
import { apiEnv } from './helpers/auth-db';
import { roleCredentials } from './helpers/credentials';
import { API_BASE, bearer } from './helpers/teacher-results-live';
import { SCREENSHOTS, en } from './helpers/teacher-rail';
import { studentRow, studentsLabel } from './helpers/teacher-students-table';

// Task 14 — the Students tab proven against the RUNNING app and the REAL Strapi.
// The data source is the SURVIVING roster read (`GET /api/my/students/results?class=`,
// the task-23 contract ClassResultsScreen itself uses) parsed through the shipped
// mirror — the retired C-TR-1 answers 410 and is never called. There is no
// expected-value literal: the rendered order, scores, phases and counts are
// compared against the live body, so a contract drift fails this file.
//
// Task 14 behaviour under test: the kit table's six columns, search + the
// FILTERED count label, the design's four sorts (Name A–Z · Highest score ·
// Lowest score · ACARA phase — the default stays the attention order), the
// score head's asc/desc toggle with `aria-sort` reporting both values, the
// sticky head inside ONE focusable scroll region (U-17), the split empty
// (no-matches + Clear filters; empty-none when an empty roster exists), and axe
// reporting no `scrollable-region-focusable` at 1440×900 and 375.

test.describe.configure({ mode: 'serial' });

// The shared lane flaps while peers restart the API (strapi develop watches their
// in-flight API edits); each test may need a retry pass over a restart window.
test.setTimeout(120_000);

type RosterRows = ReturnType<typeof classRosterResponseSchema.parse>;
type RosterRow = RosterRows[number];

const classDetailPath = (documentId: string) => `/dashboard/results/${documentId}`;
const drillDownPath = (classId: string, studentId: string) =>
  `${classDetailPath(classId)}/students/${studentId}`;

const DESKTOP_1440 = { width: 1440, height: 900 } as const;
const MOBILE_375 = { width: 375, height: 812 } as const;

/** The toolbar controls of the kit table. */
const searchBox = (page: Page) =>
  page.getByRole('searchbox', { name: studentsLabel('searchLabel') });
const sortSelect = (page: Page) =>
  page.getByRole('combobox', { name: studentsLabel('sortLabel') });
const countLabel = (page: Page) =>
  page.locator('[data-slot="students-tab-panel"] [data-slot="directory-toolbar"] [role="status"]');
const scrollRegion = (page: Page) =>
  page.locator('[data-slot="students-tab-panel"] .scroll-region');
const rows = (page: Page) => page.locator('[data-slot="student-results-row"]');

/** The catalogue string with its ICU slots filled — the exact words the UI must print. */
function interpolate(pattern: string, slots: Record<string, string | number>): string {
  return Object.entries(slots).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    pattern,
  );
}

/** The score cell's three honest arms: no result yet · a present result with no score · the score. */
async function expectScoreCell(tableRow: Locator, row: RosterRow): Promise<void> {
  const scoreCell = tableRow.locator('[data-slot="roster-score"]');
  if (row.result === null) {
    await expect(scoreCell).toHaveText(studentsLabel('noResultYet'));
    return;
  }
  const score = row.result.overall.domain_score;
  if (score === null) {
    // A present result with an unscored overall is NOT a score — the cell is
    // the em dash WITH its readable words, never a 0.
    await expect(scoreCell).toContainText(studentsLabel('noValueLabel'));
    await expect(scoreCell).toContainText(studentsLabel('noValue'));
    return;
  }
  await expect(scoreCell).toHaveText(String(score));
}

/**
 * Drives the REAL /sign-in form with the portal labels the form renders today.
 * The shared `teacher-rail.ts` helper still reads the PRE-redesign copy
 * (`Auth.emailLabel` — "Email") and cannot find the field while the auth
 * redesign sits uncommitted in the shared tree; the redesign's own migrated
 * specs (parent-auth.spec.ts, same tree) drive the form directly with
 * `Auth.portal.*`, and this is that same pattern: same real form, same seeded
 * accounts, no shortcut and no assertion relaxed.
 */
const MIN_LOGIN_INTERVAL_MS = 3_100;
let lastLoginAt = 0;

/**
 * Bounded retry for the shared lane's restart windows — the API flaps while
 * peers restart it (measured twice in one window this run: ECONNREFUSED for
 * 2–8 minutes, then clean 204). Reads retry inside a 90-second per-step cap
 * (proof/07's approved shape); a 4xx/5xx answer is NOT retried — it is the
 * server's own verdict.
 */
async function withRestartWindow<T>(step: () => Promise<T>, label: string): Promise<T> {
  const deadline = Date.now() + 90_000;
  for (;;) {
    try {
      return await step();
    } catch (error) {
      const transient = /ECONNREFUSED|ECONNRESET|socket hang up|fetch failed/i.test(String(error));
      if (!transient || Date.now() > deadline) throw error;
      console.warn(`[e2e] ${label} hit a lane restart window; retrying within 90s`);
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
  }
}

async function signInOnForm(page: Page, email: string): Promise<void> {
  const deadline = Date.now() + 90_000;
  for (;;) {
    const sinceLast = Date.now() - lastLoginAt;
    if (lastLoginAt !== 0 && sinceLast < MIN_LOGIN_INTERVAL_MS) {
      await page.waitForTimeout(MIN_LOGIN_INTERVAL_MS - sinceLast);
    }
    try {
      await page.goto('/sign-in');
      await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(email);
      await page
        .getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true })
        .fill(apiEnv('SEED_TEACHER_PASSWORD'));
      await page
        .getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true })
        .click();
      lastLoginAt = Date.now();
      // The submit posts to the API, which flaps while peers restart it; a
      // network-error alert keeps us on /sign-in, so a timeout here is a RETRY,
      // never a pass.
      await page.waitForURL('**/dashboard', { timeout: 20_000 });
      return;
    } catch (error) {
      if (Date.now() > deadline) throw error;
      console.warn(`[e2e] sign-in hit a lane restart window; retrying within 90s`);
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
  }
}

/**
 * Opens the class detail and waits for READY. A lane restart window under a
 * navigation leaves the surface in its error branch, so the READY wait is
 * retried with a fresh goto inside the 90-second step cap — a surface that
 * never reaches ready throws, it never silently passes.
 */
async function openDetailFlapTolerant(target: Page, documentId: string): Promise<void> {
  const deadline = Date.now() + 90_000;
  for (;;) {
    try {
      await target.goto(classDetailPath(documentId));
      await expect(
        target.locator('[data-surface="teacher-class-results"]'),
      ).toHaveAttribute('data-status', 'ready', { timeout: 30_000 });
      return;
    } catch (error) {
      if (Date.now() > deadline) throw error;
      console.warn('[e2e] class detail hit a lane restart window; re-navigating within 90s');
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
  }
}

/**
 * The task-14 comparators, mirrored from the live body. `score:asc` IS the
 * attention order (lowest first, unscored LAST — never a zero, ties by name);
 * an unscored student stays last in BOTH score directions and in the phase sort
 * (no measured phase is unmeasured, not a zero).
 */
const scoreOf = (row: RosterRow): number | null => row.result?.overall.domain_score ?? null;
const phaseRankOf = (row: RosterRow): number | null => {
  const phase = row.result?.acara_phase ?? null;
  if (phase === null) return null;
  const index = ACARA_PHASES.findIndex(
    (candidate) => candidate.toLowerCase() === phase.toLowerCase(),
  );
  return index === -1 ? null : index;
};

function expectedOrder(rowset: RosterRows, by: 'score:asc' | 'score:desc' | 'name:asc' | 'acara_phase:asc'): RosterRows {
  const byName = (a: RosterRow, b: RosterRow) => a.student.name.localeCompare(b.student.name);
  const scored = (a: RosterRow, b: RosterRow, dir: 1 | -1) => {
    const aScore = scoreOf(a);
    const bScore = scoreOf(b);
    if (aScore === null && bScore === null) return byName(a, b);
    if (aScore === null) return 1;
    if (bScore === null) return -1;
    return aScore !== bScore ? (aScore - bScore) * dir : byName(a, b);
  };
  return [...rowset].sort((a, b) => {
    if (by === 'name:asc') return byName(a, b);
    if (by === 'score:asc') return scored(a, b, 1);
    if (by === 'score:desc') return scored(a, b, -1);
    const aRank = phaseRankOf(a);
    const bRank = phaseRankOf(b);
    if (aRank === null && bRank === null) return byName(a, b);
    if (aRank === null) return 1;
    if (bRank === null) return -1;
    return aRank !== bRank ? aRank - bRank : byName(a, b);
  });
}

/** The names as the table renders them, in order. */
async function renderedNames(page: Page): Promise<string[]> {
  return page.locator('[data-slot="student-results-row"] a[data-row-href]').allInnerTexts();
}

/** The rendered order, retried — a sort lands after its own URL round-trip render. */
async function expectRenderedOrder(page: Page, expected: RosterRows): Promise<void> {
  await expect
    .poll(() => renderedNames(page), { timeout: 10_000 })
    .toEqual(expected.map((row) => row.student.name));
}

async function readRoster(
  request: APIRequestContext,
  jwt: string,
  classDocumentId: string,
  teacherEmail?: string,
): Promise<RosterRows> {
  const response = await request.get(`${API_BASE}/api/my/students/results?class=${classDocumentId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (response.status() !== 200) {
    throw new Error(`[e2e] the roster read answered ${response.status()} for ${teacherEmail ?? 'the teacher'}`);
  }
  return classRosterResponseSchema.parse(await response.json());
}

let context: BrowserContext;
let page: Page;
let classDocumentId: string;
let roster: RosterRows = [];
let emptyClassId: string | null = null;

test.beforeAll(async ({ browser, playwright }) => {
  // proof/07's approved restart-tolerant budget — :3002 cold-compiles /sign-in
  // and the class detail on a shared lane; 175s of work < this 180s ceiling.
  test.setTimeout(180_000);
  // The classes come from C-TD-1, the rosters from the surviving v2 read. Every
  // class is scanned once so an EMPTY roster (the empty-none arm) is used
  // genuinely when the seed provides one — never faked when it does not.
  const request = await playwright.request.newContext();
  try {
    const jwt = await withRestartWindow(() => bearer(request), 'teacher sign-in');
    const dash = await withRestartWindow(
      () =>
        request.get(`${API_BASE}/api/teacher/dashboard`, {
          headers: { Authorization: `Bearer ${jwt}` },
        }),
      'C-TD-1',
    );
    if (dash.status() !== 200) throw new Error(`[e2e] C-TD-1 answered ${dash.status()}`);
    const classes = teacherDashboardResponseSchema.parse(await dash.json()).classes;
    if (classes.length === 0) throw new Error('[e2e] the seeded teacher owns no class');
    for (const klass of classes) {
      const parsed = await withRestartWindow(
        () => readRoster(request, jwt, klass.class_document_id),
        `roster of ${klass.class_document_id}`,
      );
      if (parsed.length === 0) {
        emptyClassId ??= klass.class_document_id;
      } else if (roster.length === 0) {
        classDocumentId = klass.class_document_id;
        roster = parsed;
      }
    }
    if (roster.length === 0) throw new Error('[e2e] the seeded teacher owns no populated class');
  } finally {
    await request.dispose();
  }

  // 1440×900 from the first frame — the proof shots' exact viewport — and a
  // CONTEXT page, because the axe leg refuses `browser.newPage()`.
  context = await browser.newContext({ viewport: { ...DESKTOP_1440 } });
  page = await context.newPage();
  await signInOnForm(page, roleCredentials('teacher').email);
  await openDetailFlapTolerant(page, classDocumentId);
});

test.afterAll(async () => {
  await context?.close();
});

async function openClassDetail(): Promise<void> {
  await openDetailFlapTolerant(page, classDocumentId);
}

test.describe('Students tab (the kit table)', () => {
  test('six columns, the score head sortable and `aria-sort`ed by the default sort', async () => {
    const heads = page
      .locator('[data-slot="students-tab-panel"] table thead th');
    await expect(heads).toHaveCount(7); // six data columns + the row-menu head

    for (const [index, key] of [
      [0, 'student'],
      [1, 'score'],
      [2, 'growth'],
      [3, 'weakest'],
      [4, 'acara'],
      [5, 'confidence'],
    ] as const) {
      await expect(heads.nth(index)).toContainText(studentsLabel(key));
    }

    const scoreHead = heads.nth(1);
    await expect(scoreHead).toHaveAttribute('aria-sort', 'ascending'); // score:asc IS the default
    await expect(scoreHead.getByRole('button')).toBeVisible();
    for (const index of [0, 2, 3, 4, 5]) {
      await expect(heads.nth(index)).not.toHaveAttribute('aria-sort');
    }
  });

  test('every roster row renders against the live read, in the attention order, as a whole-row target', async () => {
    await expect(rows(page)).toHaveCount(roster.length);

    // The default order is today's: lowest score first, result-less students LAST.
    const expected = expectedOrder(roster, 'score:asc');
    await expectRenderedOrder(page, expected);

    for (const row of roster) {
      const tableRow = studentRow(page, row.student.document_id);
      await expect(tableRow.locator('a[data-row-href]')).toHaveText(row.student.name);
      await expect(tableRow).toHaveAttribute(
        'data-scored',
        row.result === null ? 'false' : 'true',
      );
      await expectScoreCell(tableRow, row);
    }

    // U-44 — the whole-row target: each row's first-cell anchor IS the row's
    // link to the drill-down, locale-aware and tab-reachable.
    const first = roster[0].student.document_id;
    await expect(studentRow(page, first).locator('a[data-row-href]')).toHaveAttribute(
      'href',
      new RegExp(`${drillDownPath(classDocumentId, first)}$`),
    );

    await page.screenshot({
      path: path.join(SCREENSHOTS, 'task-041-students-tab-table.png'),
      animations: 'disabled',
      fullPage: true,
    });
  });

  test('another journey teacher’s class renders its own roster rows', async ({ browser, playwright }) => {
    const otherEmail = 't3@schooltest.local';
    const request = await playwright.request.newContext();
    let otherClassId: string;
    let otherRoster: RosterRows;
    try {
      const jwt = await bearer(request, otherEmail);
      const dash = await request.get(`${API_BASE}/api/teacher/dashboard`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (dash.status() !== 200) throw new Error(`[e2e] C-TD-1 answered ${dash.status()} for ${otherEmail}`);
      const classes = teacherDashboardResponseSchema.parse(await dash.json()).classes;
      if (classes.length === 0) throw new Error(`[e2e] ${otherEmail} owns no class`);
      otherClassId = classes[0].class_document_id;
      otherRoster = await readRoster(request, jwt, otherClassId, otherEmail);
    } finally {
      await request.dispose();
    }
    expect(otherRoster.length).toBeGreaterThan(0);

    const otherContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const otherPage = await otherContext.newPage();
    try {
      await signInOnForm(otherPage, otherEmail);
      await openDetailFlapTolerant(otherPage, otherClassId);
      await expect(rows(otherPage)).toHaveCount(otherRoster.length);
      await expect(
        studentRow(otherPage, otherRoster[0].student.document_id).locator('a[data-row-href]'),
      ).toHaveText(otherRoster[0].student.name);
    } finally {
      await otherContext.close();
    }
  });

  test('a row activates by KEYBOARD through to that student’s drill-down', async () => {
    await openClassDetail();
    const first = roster[0].student.document_id;
    const row = studentRow(page, first);
    // ops/34 — the kit's §L-rownav anchor: the FIRST cell's content is the row's
    // one real link (locale-aware, tab-reachable), labelled with the student's name.
    const link = row.locator('a[data-row-href]');

    const href = drillDownPath(classDocumentId, first);
    await expect(link).toHaveAttribute('href', new RegExp(`${href}$`));

    const box = await row.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press('Enter');
    await page.waitForURL(`**${href}`);
    expect(new URL(page.url()).pathname.endsWith(href)).toBe(true);
  });

  test('the row’s Open action — the kit’s quick action, `write: false` — reaches the same student', async () => {
    await openClassDetail();
    const last = roster[roster.length - 1].student.document_id;

    // ops/34 — the whole-row pointer overlay is GONE by kit contract (a row
    // menu plus an invisible overlay over it is the nested-interactive failure
    // axe reports). Navigation is explicit: the first-cell anchor, and the
    // row's `Open` quick action, which this test drives with a real click.
    const row = studentRow(page, last);
    const open = row.getByRole('button', { name: studentsLabel('actionOpen') });
    await open.scrollIntoViewIfNeeded();
    await open.click();

    const href = drillDownPath(classDocumentId, last);
    await page.waitForURL(`**${href}`);
    expect(new URL(page.url()).pathname.endsWith(href)).toBe(true);
  });
});

test.describe('Students tab (task 14: search, four sorts, sticky head, the split empty)', () => {
  test('search narrows on the name and the count label reports the FILTERED total', async () => {
    await openClassDetail();
    const needle = roster[0].student.name;
    const matches = roster.filter((row) =>
      row.student.name.toLowerCase().includes(needle.toLowerCase()),
    );

    await searchBox(page).fill(needle);
    await expect(rows(page)).toHaveCount(matches.length);
    await expect(countLabel(page)).toHaveText(
      interpolate(studentsLabel('showingCount'), { showing: matches.length, total: matches.length }),
    );

    await page.screenshot({
      path: path.join(SCREENSHOTS, '14-students-search.png'),
      animations: 'disabled',
    });

    await searchBox(page).fill('');
    await expect(rows(page)).toHaveCount(roster.length);
    await expect(countLabel(page)).toHaveText(
      interpolate(studentsLabel('showingCount'), { showing: roster.length, total: roster.length }),
    );
  });

  test('the ACARA-phase sort reorders, puts unmeasured students last, and round-trips the URL', async () => {
    await openClassDetail();
    await sortSelect(page).click();
    await page.getByRole('option', { name: studentsLabel('sortAcaraPhase'), exact: true }).click();

    const expected = expectedOrder(roster, 'acara_phase:asc');
    await expect(rows(page)).toHaveCount(expected.length);
    await expectRenderedOrder(page, expected);
    // router.replace is async — poll the store rather than racing it.
    await expect
      .poll(() => new URL(page.url()).searchParams.get('sort'), { timeout: 10_000 })
      .toBe('acara_phase:asc');

    await page.screenshot({
      path: path.join(SCREENSHOTS, '14-students-sort-phase.png'),
      animations: 'disabled',
    });

    // The URL is the store: a RELOAD must keep the sort because the value is
    // declared in the `sorts` array — setSort's silent default fallback would
    // snap the select back if the value were not declared. The restored VALUE
    // (and the comparator it names) survive; the closed trigger's LABEL is a
    // pre-existing design-system gap (Base UI resolves an unmounted item's
    // label to its raw value), recorded in proof/14.md — it is not this task's
    // surface and the round-trip itself is what this task owns.
    await page.reload();
    // A reload during a lane restart window lands the surface in its error
    // branch; re-enter inside the step cap instead of failing on the flap.
    const reloadDeadline = Date.now() + 90_000;
    for (;;) {
      try {
        await expect(rows(page)).toHaveCount(expected.length, { timeout: 30_000 });
        break;
      } catch (error) {
        if (Date.now() > reloadDeadline) throw error;
        console.warn('[e2e] post-reload surface hit a lane restart window; reloading again');
        await page.reload();
      }
    }
    await expectRenderedOrder(page, expected);
    await expect
      .poll(() => new URL(page.url()).searchParams.get('sort'), { timeout: 10_000 })
      .toBe('acara_phase:asc');
    // The select reflects the restored value, by label or (the documented gap)
    // by the raw value itself — never by snapping back to the default.
    const triggerText = (await sortSelect(page).textContent()) ?? '';
    expect(
      triggerText.includes(studentsLabel('sortAcaraPhase')) ||
        triggerText.includes('acara_phase:asc'),
      `the sort select must hold acara_phase:asc after reload, got: ${triggerText}`,
    ).toBe(true);
  });

  test('the name and score sorts each reorder; the score head toggle flips direction with aria-sort', async () => {
    await openClassDetail();
    expect(new URL(page.url()).searchParams.get('sort')).toBeNull(); // default not written

    await sortSelect(page).click();
    await page.getByRole('option', { name: studentsLabel('sortNameAsc'), exact: true }).click();
    const byName = expectedOrder(roster, 'name:asc');
    await expectRenderedOrder(page, byName);

    await sortSelect(page).click();
    await page.getByRole('option', { name: studentsLabel('sortScoreHigh'), exact: true }).click();
    const high = expectedOrder(roster, 'score:desc');
    await expectRenderedOrder(page, high);
    const scoreHead = page.locator('[data-slot="students-tab-panel"] table thead th').nth(1);
    await expect(scoreHead).toHaveAttribute('aria-sort', 'descending');

    // The header toggle flips the SAME column to score:asc — `asc !== desc`.
    await scoreHead.getByRole('button').click();
    const low = expectedOrder(roster, 'score:asc');
    await expectRenderedOrder(page, low);
    await expect(scoreHead).toHaveAttribute('aria-sort', 'ascending');
    // score:asc IS defaultSort, and the URL store omits the default (§L-sync) —
    // so the param is legitimately ABSENT here; what must never appear is the
    // previous direction.
    await expect
      .poll(() => new URL(page.url()).searchParams.get('sort') ?? 'score:asc', { timeout: 10_000 })
      .toBe('score:asc');
  });

  test('the header stays pinned while the region scrolls, one focusable region, both axes', async () => {
    await openClassDetail();
    const region = scrollRegion(page);
    const head = page.locator('[data-slot="students-tab-panel"] table thead');

    // U-17 — the sticky recipe: the region is the scrollport, the head pins to it.
    await expect(region).toHaveClass(/max-h-96/);
    await expect(head).toHaveClass(/sticky/);
    await expect(region).toHaveAttribute('tabindex', '0');

    await region.scrollIntoViewIfNeeded();
    const pinOffset = async () => {
      const regionBox = await region.boundingBox();
      const headBox = await head.boundingBox();
      return (headBox?.y ?? 0) - (regionBox?.y ?? 0);
    };
    const before = await pinOffset();

    await region.evaluate((element) => {
      element.scrollTop = 300;
    });
    await expect
      .poll(() => region.evaluate((element) => element.scrollTop), { timeout: 5_000 })
      .toBe(300);

    // The head did not move RELATIVE to its scrollport while the rows did.
    expect(Math.abs((await pinOffset()) - before)).toBeLessThan(2);

    await page.screenshot({
      path: path.join(SCREENSHOTS, '14-students-sticky-head.png'),
      animations: 'disabled',
    });

    // ONE focusable scroll region, both axes: the focused region itself scrolls.
    await region.evaluate((element) => {
      element.scrollTop = 0;
    });
    await region.focus();
    await page.keyboard.press('ArrowDown');
    await expect
      .poll(() => region.evaluate((element) => element.scrollTop), { timeout: 5_000 })
      .toBeGreaterThan(0);
  });

  test('a search matching nothing shows the no-matches body, and Clear filters restores every row', async () => {
    await openClassDetail();
    const noMatchTerm = 'zzzzqqqq';
    await searchBox(page).fill(noMatchTerm);

    await expect(rows(page)).toHaveCount(0);
    await expect(
      page.getByRole('heading', { name: studentsLabel('noMatchesTitle') }),
    ).toBeVisible();
    await expect(page.locator('[data-slot="students-tab-panel"] [data-slot="empty-state"]')).toContainText(
      studentsLabel('noMatchesDescription'),
    );

    await page.screenshot({
      path: path.join(SCREENSHOTS, '14-students-empty-no-matches.png'),
      animations: 'disabled',
    });

    // The empty arm carries its own Clear filters (the toolbar a second one
    // while controls are active) — click the ARM's button.
    await page
      .locator('[data-slot="students-tab-panel"] [data-slot="empty-state"]')
      .getByRole('button', { name: studentsLabel('clearFilters') })
      .click();
    await expect(rows(page)).toHaveCount(roster.length);
    await expect(searchBox(page)).toHaveValue('');
  });

  test('an empty roster shows the empty-none body', async () => {
    test.skip(
      emptyClassId === null,
      'no seeded class of this teacher carries an empty roster — the arm is kit-covered (arms 6/7 unit pins) and recorded deferred in proof/14.md',
    );
    const emptyId = emptyClassId as string;

    await openDetailFlapTolerant(page, emptyId);
    await expect(
      page.getByRole('heading', { name: studentsLabel('emptyTitle') }),
    ).toBeVisible();
    await expect(
      page.locator('[data-slot="students-tab-panel"] [data-slot="empty-state"]'),
    ).toContainText(studentsLabel('emptyDescription'));
    await page.screenshot({
      path: path.join(SCREENSHOTS, '14-students-empty-none.png'),
      animations: 'disabled',
    });
  });

  test('AXE: no scrollable-region-focusable on the Students tab @ 1440x900', async () => {
    await page.setViewportSize({ ...DESKTOP_1440 });
    await openClassDetail();
    // The scan is over the REAL surface: the roster must be on the page, or a
    // lane restart window could produce a hollow pass over an error branch.
    await expect(rows(page)).toHaveCount(roster.length);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    const scrollable = results.violations.filter(
      (violation) => violation.id === 'scrollable-region-focusable',
    );
    expect(
      scrollable.map((violation) => `${violation.impact}:${violation.id}`),
      'scrollable-region-focusable must not fire at 1440x900',
    ).toEqual([]);
  });

  test('AXE: no scrollable-region-focusable on the Students tab @ 375', async () => {
    await page.setViewportSize({ ...MOBILE_375 });
    await openClassDetail();
    await expect(rows(page)).toHaveCount(roster.length);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    const scrollable = results.violations.filter(
      (violation) => violation.id === 'scrollable-region-focusable',
    );
    expect(
      scrollable.map((violation) => `${violation.impact}:${violation.id}`),
      'scrollable-region-focusable must not fire at 375',
    ).toEqual([]);
    await page.setViewportSize({ ...DESKTOP_1440 });
  });
});

// The catalogue read keeps the labels honest — a missing key renders the literal
// dotted path and nothing goes red (Teacher.* has no census half).
test('the task-14 labels resolve in the en catalogue', async () => {
  expect(cat(en, 'Teacher.results.students.sortAcaraPhase')).toBe('ACARA phase');
  expect(cat(en, 'Teacher.results.students.sortNameAsc')).toBe('Name A–Z');
});
