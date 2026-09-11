/**
 * Wave 2 — DATA HONESTY sweep: every COUNT the ops / school-admin UI shows
 * must equal the number the component's own API read returns.
 *
 * A differential sweep, not a fixture builder: it signs into the REAL portal,
 * reads every counted surface, and diffs each on-screen number against the
 * SAME endpoint the component reads (curl-equivalent GETs carrying the
 * signed-in JWT plus `X-Ops-Portal-Version: 1`) for the three fixture schools:
 *   Demo School A  y71h16mmldmxfecnao4diqd0
 *   Seeded         zb6j30274xnde80mrdqjxxhr
 *   School B       f7td6tkqh3qtw5rsa4oa4n0v
 *
 * Surfaces: status pills vs meta.status_counts; "Showing X of Y" pagers;
 * schools-row metrics; the detail stats strip; tab badges; the Teachers
 * "N teachers · M classes covered" card; the Admins "N invited · M active"
 * card; the Classes/Students tab summaries; class-row student counts; and the
 * school-admin home tiles vs C-RPT-06 (`/api/schools/me/analytics`).
 *
 * Two note classes keep the report honest about WHO owns a defect:
 *  - UI_VS_API    — the screen shows a number its own read did not return
 *                   (a frontend mapping error; the sweep FAILS on these);
 *  - API_INTERNAL — two API reads disagree about the same fact (API-side;
 *                   reported for the owning backend task, never failing).
 */
import { type APIRequestContext, type Locator, type Page } from '@playwright/test';

import { OPS_PORTAL_VERSION, OPS_PORTAL_VERSION_HEADER } from '@schooltest/ops-contracts';

import { expect, test } from './helpers/auth-fixture';
import { cat, loadMessages } from './helpers/i18n';

const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:5500';
const EN = loadMessages('en');

/** The three seeded fixture schools the sweep is scoped to. */
const SCHOOLS = [
  { documentId: 'y71h16mmldmxfecnao4diqd0', name: 'SchoolTest Demo School A' },
  { documentId: 'zb6j30274xnde80mrdqjxxhr', name: 'Seeded Demo School 20260911' },
  { documentId: 'f7td6tkqh3qtw5rsa4oa4n0v', name: 'SchoolTest Demo School B' },
] as const;

const STATUS_LABELS: Record<string, string> = {
  active: cat(EN, 'Ops.schools.portalStatus.active'),
  trial: cat(EN, 'Ops.schools.portalStatus.trial'),
  pending_setup: cat(EN, 'Ops.schools.portalStatus.pending_setup'),
  suspended: cat(EN, 'Ops.schools.portalStatus.suspended'),
  archived: cat(EN, 'Ops.schools.portalStatus.archived'),
};

type NoteKind = 'UI_VS_API' | 'API_INTERNAL';

interface Note {
  kind: NoteKind;
  surface: string;
  school: string;
  metric: string;
  ui: string;
  api: string;
}

/** Whole-run notes; each surface test also asserts its own UI_VS_API slice. */
const NOTES: Note[] = [];

function note(sink: Note[], entry: Note): void {
  NOTES.push(entry);
  sink.push(entry);
}

function formatNotes(entries: readonly Note[]): string {
  return [
    'kind surface | school | metric | UI | API',
    ...entries.map(
      (entry) => `${entry.kind} ${entry.surface} | ${entry.school} | ${entry.metric} | UI=${entry.ui} | API=${entry.api}`,
    ),
  ].join('\n');
}

/** The signed-in portal's own JWT — the same credential the app itself sends. */
async function portalToken(page: Page): Promise<string> {
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token, 'the signed-in portal keeps its JWT in localStorage').toBeTruthy();
  return token as string;
}

/** curl-equivalent GET against the live API with the portal's auth + version headers. */
function makeApi(request: APIRequestContext, token: string, portalVersioned: boolean) {
  return async <T>(path: string): Promise<T> => {
    const res = await request.get(`${API}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(portalVersioned ? { [OPS_PORTAL_VERSION_HEADER]: OPS_PORTAL_VERSION } : {}),
      },
    });
    expect(res.ok(), `GET ${path} -> ${res.status()}`).toBeTruthy();
    return (await res.json()) as T;
  };
}

interface Pagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

interface SchoolsListBody {
  data: SchoolsRow[];
  meta: { pagination: Pagination; status_counts: Record<string, number> };
}

interface SchoolsRow {
  documentId: string;
  name: string | null;
  portal_status: string;
  student_count: number;
  admin_count: number;
  portal_teacher_count: number;
  class_count: number;
  results_count: number;
}

interface SchoolDetailBody {
  data: SchoolsRow & {
    last_active_at: string | null;
    teacher_count: number;
    owner_documentId: string | null;
  };
}

interface TeacherRow {
  documentId: string;
  classes: { documentId: string }[];
}

/** The innerText lines of every direct block in a directory row. */
async function readRowBlocks(row: Locator): Promise<string[][]> {
  const blocks = row.locator(':scope > div');
  const count = await blocks.count();
  const out: string[][] = [];
  for (let index = 0; index < count; index += 1) {
    out.push(
      (await blocks.nth(index).innerText())
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    );
  }
  return out;
}

/** The value of a metric block, keyed by its sublabel ("183\nStudents"). */
function metricValue(blocks: readonly (readonly string[])[], header: string): string {
  const block = blocks.find((lines) => lines.length === 2 && lines[1] === header);
  return block === undefined ? 'absent' : block[0];
}

/** The "Showing X of Y" status line of the currently visible directory. */
async function readShowing(page: Page): Promise<{ showing: number; total: number } | null> {
  const status = page.locator('p[role="status"]:visible', { hasText: /Showing \d+ of \d+/ }).first();
  if (!(await status.isVisible().catch(() => false))) return null;
  const match = (await status.innerText()).match(/Showing (\d+) of (\d+)/);
  return match === null ? null : { showing: Number(match[1]), total: Number(match[2]) };
}

/**
 * Reads text until it matches `pattern` (the query behind a counted surface
 * lands AFTER the card's zero-state first paint) or the deadline passes. The
 * final text is returned either way, so a genuine mismatch is still diffed.
 */
async function pollForText(
  page: Page,
  read: () => Promise<string>,
  pattern: RegExp,
  timeoutMs = 20_000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  let last = '';
  for (;;) {
    last = await read().catch(() => '');
    if (pattern.test(last) || Date.now() >= deadline) return last;
    await page.waitForTimeout(400);
  }
}

function expectUiVsApi(
  sink: Note[],
  surface: string,
  school: string,
  metric: string,
  ui: string,
  api: string,
): void {
  if (ui === api) return;
  note(sink, { kind: 'UI_VS_API', surface, school, metric, ui, api });
}

function expectApiInternal(
  sink: Note[],
  surface: string,
  school: string,
  metric: string,
  ui: string,
  api: string,
): void {
  if (ui === api) return;
  note(sink, { kind: 'API_INTERNAL', surface, school, metric, ui, api });
}

test.describe.configure({ mode: 'serial' });

test.describe('ops schools LIST surface', () => {
  test.use({ role: 'ops' });

  test('status pills, pager totals and row metrics equal the API', async ({
    authPage: page,
    request,
  }) => {
    test.setTimeout(180_000);
    const sink: Note[] = [];
    await page.goto('/dashboard/ops/schools');
    const pills = page.locator('[data-slot="ops-schools-pills"]');
    await expect(pills).toBeVisible();

    const api = makeApi(request, await portalToken(page), true);
    const list = await api<SchoolsListBody>('/api/ops/schools?page=1&pageSize=25');
    const grandTotal = String(list.meta.pagination.total);

    // Pills — the whole-dataset `meta.status_counts`, never a client count.
    for (const key of ['all', 'active', 'trial', 'pending_setup', 'suspended', 'archived']) {
      const countSpan = pills.locator(`[data-slot="ops-schools-pill-${key}"] span`).last();
      const ui = (await countSpan.textContent().catch(() => null))?.trim() ?? 'absent';
      expectUiVsApi(sink, 'schools pills', 'all schools', `status_counts.${key}`, ui, String(list.meta.status_counts[key]));
    }

    // Pager — server totals, not the loaded row count.
    const showing = await readShowing(page);
    if (showing === null) {
      throw new Error('the schools list pager did not render a "Showing X of Y" line');
    }
    expectUiVsApi(sink, 'schools pager', 'all schools', 'pagination.total', String(showing.total), grandTotal);

    // Each fixture row: every numeric cell vs the row's OWN API values.
    for (const fixture of SCHOOLS) {
      await page.getByTestId('ops-schools-search').fill(fixture.name);
      const pagerLine = page.locator('p[role="status"]:visible', { hasText: /Showing/ }).first();
      await expect(pagerLine).toContainText(/Showing 1 of 1 schools/, { timeout: 20_000 });

      const searched = await api<SchoolsListBody>(
        `/api/ops/schools?q=${encodeURIComponent(fixture.name)}&page=1&pageSize=25`,
      );
      const row = searched.data.find((entry) => entry.documentId === fixture.documentId);
      expect(row, `API row for ${fixture.name}`).toBeTruthy();

      const uiRow = page.locator('[data-directory-row]:visible', { hasText: fixture.name }).first();
      await expect(uiRow).toBeVisible();
      const blocks = await readRowBlocks(uiRow);

      const columnKey = (header: string): keyof SchoolsRow | null => {
        if (header === cat(EN, 'Ops.schools.columnStudents')) return 'student_count';
        if (header === cat(EN, 'Ops.schools.columnAdmins')) return 'admin_count';
        if (header === cat(EN, 'Ops.schools.columnTeachers')) return 'portal_teacher_count';
        if (header === cat(EN, 'Ops.schools.columnClasses')) return 'class_count';
        if (header === cat(EN, 'Ops.schools.columnResults')) return 'results_count';
        return null;
      };
      for (const lines of blocks) {
        if (lines.length !== 2) continue;
        const key = columnKey(lines[1]);
        if (key === null) continue;
        expectUiVsApi(sink, 'schools row', fixture.name, key, lines[0], String(row?.[key]));
      }
      // The status cell is `bare`: a single-line block, no sublabel.
      const bare = blocks.filter((lines) => lines.length === 1).map((lines) => lines[0]);
      const statusLabel = STATUS_LABELS[row?.portal_status ?? ''] ?? row?.portal_status ?? '?';
      expectUiVsApi(sink, 'schools row', fixture.name, 'portal_status', bare.includes(statusLabel) ? statusLabel : `none of [${bare.join(', ')}]`, statusLabel);

      await page.getByTestId('ops-schools-search').fill('');
      await expect(pagerLine).toContainText(`of ${grandTotal} schools`, { timeout: 20_000 });
    }

    expect(sink, formatNotes(sink)).toHaveLength(0);
  });
});

test.describe('ops school DETAIL surface', () => {
  test.use({ role: 'ops' });

  test('stats strip, tab badges, tab card summaries and tab pagers equal the API', async ({
    authPage: page,
    request,
  }) => {
    test.setTimeout(300_000);
    const sink: Note[] = [];
    const api = makeApi(request, await portalToken(page), true);

    for (const fixture of SCHOOLS) {
      const detail = (
        await api<SchoolDetailBody>(`/api/ops/schools/${fixture.documentId}`)
      ).data;

      // ---- stats strip vs GET /api/ops/schools/:id --------------------------
      await page.goto(`/dashboard/ops/schools/${fixture.documentId}`);
      const cards = page.locator('[data-slot="ops-count-card"]:visible');
      await expect(cards.first()).toBeVisible();
      const cardValues: Record<string, string> = {};
      for (const card of await cards.all()) {
        const label = (await card.getAttribute('data-count-label')) ?? '';
        cardValues[label] = (await card.locator('[data-slot="ops-count-value"]').innerText()).trim();
      }
      expectUiVsApi(sink, 'detail stats strip', fixture.name, 'student_count', cardValues[cat(EN, 'Ops.detail.studentsLabel')] ?? 'absent', String(detail.student_count));
      expectUiVsApi(sink, 'detail stats strip', fixture.name, 'portal_teacher_count', cardValues[cat(EN, 'Ops.detail.teachersLabel')] ?? 'absent', String(detail.portal_teacher_count));
      expectUiVsApi(sink, 'detail stats strip', fixture.name, 'results_count', cardValues[cat(EN, 'Ops.detail.testsTermLabel')] ?? 'absent', String(detail.results_count));
      // "Last activity" is honest when null renders as "Never" and vice versa.
      const never = cat(EN, 'Ops.detail.neverValue');
      const activity = cardValues[cat(EN, 'Ops.detail.lastActivityLabel')] ?? 'absent';
      if ((detail.last_active_at === null) !== (activity === never)) {
        expectUiVsApi(sink, 'detail stats strip', fixture.name, 'last_active_at', activity, detail.last_active_at === null ? never : 'a relative time');
      }

      // ---- tab badges vs the detail read ------------------------------------
      const badgeSource: Record<string, number> = {
        admins: detail.admin_count,
        teachers: detail.portal_teacher_count,
        classes: detail.class_count,
        students: detail.student_count,
      };
      for (const [tab, expected] of Object.entries(badgeSource)) {
        const badge = page.locator(`[data-testid="ops-tab-count-${tab}"]:visible`);
        const ui = (await badge.isVisible().catch(() => false)) ? (await badge.innerText()).trim() : 'no badge';
        expectUiVsApi(sink, 'detail tab badge', fixture.name, tab, ui, expected > 0 ? String(expected) : 'no badge');
      }

      // ---- Teachers tab: summary + pager vs the teachers read ---------------
      const teachers = await api<{ data: TeacherRow[]; meta: { pagination: Pagination } }>(
        `/api/ops/schools/${fixture.documentId}/teachers?role=teacher&page=1&pageSize=200`,
      );
      const classesCovered = new Set(
        teachers.data.flatMap((teacher) => teacher.classes.map((klass) => klass.documentId)),
      ).size;

      await page.goto(`/dashboard/ops/schools/${fixture.documentId}?tab=teachers`);
      const teachersSummaryText = await pollForText(
        page,
        () => page.getByText(/teachers · \d+ classes covered/).first().innerText(),
        new RegExp(`${teachers.meta.pagination.total} teachers · ${classesCovered} classes covered`),
      );
      const teachersMatch = teachersSummaryText.match(/(\d+) teachers · (\d+) classes covered/);
      expect(teachersMatch, `teachers header summary text: "${teachersSummaryText}"`).toBeTruthy();
      expectUiVsApi(sink, 'teachers tab card', fixture.name, 'total teachers', teachersMatch?.[1] ?? '?', String(teachers.meta.pagination.total));
      expectUiVsApi(sink, 'teachers tab card', fixture.name, 'classes covered', teachersMatch?.[2] ?? '?', String(classesCovered));

      // ---- Admins tab: "invited · active" card + pager vs the two reads -----
      const adminsActive = await api<{ meta: { pagination: Pagination } }>(
        `/api/ops/users?school=${fixture.documentId}&role=school_admin&page=1&pageSize=25`,
      );
      const adminsUnblocked = await api<{ meta: { pagination: Pagination } }>(
        `/api/ops/users?school=${fixture.documentId}&role=school_admin&blocked=false&page=1&pageSize=25`,
      );
      const adminsInvited = await api<{ meta: { pagination: Pagination } }>(
        `/api/ops/invitations?school=${fixture.documentId}&role=school_admin&status=invited&page=1`,
      );
      await page.goto(`/dashboard/ops/schools/${fixture.documentId}?tab=admins`);
      const adminsSummaryText = await pollForText(
        page,
        () => page.getByText(/invited · \d+ active/).first().innerText(),
        new RegExp(`${adminsInvited.meta.pagination.total} invited · ${adminsUnblocked.meta.pagination.total} active`),
      );
      const adminsMatch = adminsSummaryText.match(/(\d+) invited · (\d+) active/);
      expect(adminsMatch, `admins header summary text: "${adminsSummaryText}"`).toBeTruthy();
      expectUiVsApi(sink, 'admins tab card', fixture.name, 'invited', adminsMatch?.[1] ?? '?', String(adminsInvited.meta.pagination.total));
      expectUiVsApi(sink, 'admins tab card', fixture.name, 'active admins', adminsMatch?.[2] ?? '?', String(adminsUnblocked.meta.pagination.total));
      const adminsShowing = await readShowing(page);
      if (adminsShowing !== null) {
        expectUiVsApi(sink, 'admins tab pager', fixture.name, 'pagination.total', String(adminsShowing.total), String(adminsActive.meta.pagination.total));
      }

      // ---- Classes tab: card summary, per-row students + pager --------------
      const classes = await api<{
        data: { documentId: string; name: string | null; student_count: number }[];
        meta: { pagination: Pagination };
      }>(`/api/ops/schools/${fixture.documentId}/classes?page=1&pageSize=25`);
      await page.goto(`/dashboard/ops/schools/${fixture.documentId}?tab=classes`);
      const classesSummaryText = await pollForText(
        page,
        () => page.getByText(/\d+ classes across/).first().innerText(),
        new RegExp(`${classes.meta.pagination.total} classes across`),
      );
      const classesMatch = classesSummaryText.match(/(\d+) classes across/);
      expectUiVsApi(sink, 'classes tab card', fixture.name, 'total classes', classesMatch?.[1] ?? '?', String(classes.meta.pagination.total));
      const classesShowing = await readShowing(page);
      if (classesShowing !== null) {
        expectUiVsApi(sink, 'classes tab pager', fixture.name, 'pagination.total', String(classesShowing.total), String(classes.meta.pagination.total));
      }
      const classRows = page.locator('[data-directory-row]:visible');
      await expect(classRows.first()).toBeVisible();
      for (const apiClass of classes.data) {
        if (apiClass.name === null) continue;
        const uiRow = classRows.filter({ hasText: apiClass.name }).first();
        if (!(await uiRow.isVisible().catch(() => false))) continue;
        const uiCount = await uiRow.locator('[data-testid="ops-classes-students"]').innerText();
        expectUiVsApi(sink, 'classes tab row', `${fixture.name} · ${apiClass.name}`, 'student_count', uiCount.trim(), String(apiClass.student_count));
      }

      // ---- Students tab: "N enrolled" card + pager vs the students read -----
      const students = await api<{ meta: { pagination: Pagination } }>(
        `/api/ops/schools/${fixture.documentId}/students?page=1&pageSize=25`,
      );
      await page.goto(`/dashboard/ops/schools/${fixture.documentId}?tab=students`);
      const studentsSummaryText = await pollForText(
        page,
        () => page.getByText(/\d+ enrolled · showing recent activity/).first().innerText(),
        new RegExp(`${students.meta.pagination.total} enrolled`),
      );
      const studentsMatch = studentsSummaryText.match(/(\d+) enrolled/);
      expectUiVsApi(sink, 'students tab card', fixture.name, 'total students', studentsMatch?.[1] ?? '?', String(students.meta.pagination.total));
      const studentsShowing = await readShowing(page);
      if (studentsShowing !== null) {
        expectUiVsApi(sink, 'students tab pager', fixture.name, 'pagination.total', String(studentsShowing.total), String(students.meta.pagination.total));
      }

      // ---- API-INTERNAL: two server reads disagreeing about one fact --------
      const listRow = (
        await api<SchoolsListBody>(`/api/ops/schools?q=${encodeURIComponent(fixture.name)}&page=1&pageSize=25`)
      ).data.find((entry) => entry.documentId === fixture.documentId);
      if (listRow !== undefined) {
        for (const key of ['student_count', 'admin_count', 'portal_teacher_count', 'class_count', 'results_count'] as const) {
          expectApiInternal(sink, 'list row vs detail', fixture.name, key, String(listRow[key]), String(detail[key]));
        }
      }
      expectApiInternal(sink, 'detail vs tab lists', fixture.name, 'class_count vs classes list total', String(detail.class_count), String(classes.meta.pagination.total));
      expectApiInternal(sink, 'detail vs tab lists', fixture.name, 'portal_teacher_count vs teachers list total', String(detail.portal_teacher_count), String(teachers.meta.pagination.total));
      expectApiInternal(sink, 'detail vs tab lists', fixture.name, 'admin_count vs ops users total', String(detail.admin_count), String(adminsActive.meta.pagination.total));
      expectApiInternal(sink, 'detail vs tab lists', fixture.name, 'student_count vs students list total', String(detail.student_count), String(students.meta.pagination.total));
    }

    expect(
      sink.filter((entry) => entry.kind === 'UI_VS_API'),
      formatNotes(sink),
    ).toHaveLength(0);
  });
});

for (const [role, schoolLabel] of [
  ['schoolAdmin', 'Demo School A'],
  ['schoolAdminB', 'Demo School B'],
] as const) {
  test.describe(`school-admin HOME tiles — ${schoolLabel}`, () => {
    test.use({ role });

    test(`school ${schoolLabel}: home tiles equal C-RPT-06 and the classes read`, async ({
      authPage: page,
      request,
    }) => {
      test.setTimeout(120_000);
      const sink: Note[] = [];
      await page.goto('/dashboard/school');
      await expect(page.locator('[data-slot="school-diagnostics"]')).toBeVisible();

      // /api/schools/me* are the school-admin reads (no portal-version contract).
      const api = makeApi(request, await portalToken(page), false);
      const summary = (
        await api<{ data: Record<string, string | number | null> }>('/api/schools/me/analytics')
      ).data;
      const classes = (
        await api<{ data: { documentId: string; name: string | null; student_count: number }[] }>(
          '/api/schools/me/classes',
        )
      ).data;

      const tiles = page.locator('[data-slot="metric-card"]:visible');
      const tileValues: Record<string, string> = {};
      for (const tile of await tiles.all()) {
        const lines = (await tile.innerText())
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        // The overline label is CSS-uppercased, so keys are normalized.
        if (lines.length >= 2) tileValues[lines[0].toUpperCase()] = lines.slice(1).join(' ');
      }
      const tileValue = (label: string): string => tileValues[label.toUpperCase()] ?? 'absent';

      const phaseLabel = (raw: string | null): string =>
        raw === null || EN[`SchoolStudents.form.acaraPhaseOption.${raw}`] === undefined
          ? cat(EN, 'SchoolAdmin.home.noValue')
          : EN[`SchoolStudents.form.acaraPhaseOption.${raw}`];

      expectUiVsApi(sink, 'home tile', schoolLabel, 'students_tested', tileValue(cat(EN, 'SchoolAdmin.home.studentsTested')), String(summary.students_tested));
      expectUiVsApi(
        sink,
        'home tile',
        schoolLabel,
        'reading_tests_completed/allowed',
        tileValue(cat(EN, 'SchoolAdmin.home.readingTestsCompleted')),
        `${summary.reading_tests_completed} / ${summary.reading_tests_allowed}`,
      );
      expectUiVsApi(sink, 'home tile', schoolLabel, 'reading_progress', tileValue(cat(EN, 'SchoolAdmin.home.readingProgress')), phaseLabel(summary.reading_progress as string | null));
      expectUiVsApi(sink, 'home tile', schoolLabel, 'reading_tests_allowed', tileValue(cat(EN, 'SchoolAdmin.home.testsThisCycle')), String(summary.reading_tests_allowed));

      // The window date renders in the reader's timezone, so only its
      // presence (vs the design's empty value) is diffable honestly.
      const windowLabel = cat(EN, 'SchoolAdmin.home.nextTestWindow');
      const noValue = cat(EN, 'SchoolAdmin.home.noValue');
      const uiWindow = tileValue(windowLabel);
      const hasWindow = typeof summary.next_test_window === 'string' && summary.next_test_window !== '';
      if (!hasWindow || uiWindow === noValue || uiWindow === 'absent') {
        expectUiVsApi(sink, 'home tile', schoolLabel, 'next_test_window', uiWindow, hasWindow ? 'a date' : noValue);
      }

      // Class rows: the live student count vs the same row's API value.
      const classRows = page.locator('[data-slot="school-classes"] ul li a');
      await expect(classRows.first()).toBeVisible();
      for (const apiClass of classes) {
        if (apiClass.name === null) continue;
        const uiRow = classRows.filter({ hasText: apiClass.name }).first();
        if (!(await uiRow.isVisible().catch(() => false))) continue;
        const countLine = (await uiRow.innerText())
          .split('\n')
          .map((line) => line.trim())
          .find((line) => /^\d+ (student|students)$/.test(line));
        expectUiVsApi(sink, 'home class row', `${schoolLabel} · ${apiClass.name}`, 'student_count', countLine?.match(/\d+/)?.[0] ?? 'absent', String(apiClass.student_count));
      }

      expect(sink, formatNotes(sink)).toHaveLength(0);
    });
  });
}

test('sweep report — every counted surface vs its API', async () => {
  const dishonest = NOTES.filter((entry) => entry.kind === 'UI_VS_API');
  test.info().attach('data-honesty-sweep.md', { body: formatNotes(dishonest), contentType: 'text/markdown' });
  // API-side disagreements are the report's second table; they never fail.
  const internal = NOTES.filter((entry) => entry.kind === 'API_INTERNAL');
  if (internal.length > 0) {
    console.log(`[data-honesty] API-side inconsistencies (${internal.length}):\n${formatNotes(internal)}`);
  }
  expect(dishonest, formatNotes(NOTES)).toHaveLength(0);
});
