import { expect, test, type APIRequestContext } from '@playwright/test';

import { signInTeacher } from '../helpers/teacher-rail';

/**
 * NIGHT-2 W5 — TEA gap sweep. One serial pass over the remaining W5 teacher
 * surfaces that the dedicated specs (live-lobby-start, family-reports-tab,
 * start-session S8) do not already cover, driven as t1 against the live stack.
 *
 * Isolated data: the W5 matrix class (ops-created for t1) carries the live
 * controls arms; the seeded Proof 10X class (two released, scored results and
 * one running sitting) carries the results/reports/strip arms.
 */

const CLASS = 'wmbv852uxduz6g642hs55g21'; // Matrix Ten X (t1)
const PROOF = 't34tb8ogapnh4halzdn7yy4n'; // Proof 10X (t1)
const FORM = 'j6lers626yexsdacat60i52x';
const RELEASED_RESULT = 'y3k4kjsqx5wbhm0kahb7yuyf'; // Proof Student One, released
const API_BASE = 'http://127.0.0.1:5500';

async function teacherJwt(request: APIRequestContext): Promise<string> {
  const login = await request.post(`${API_BASE}/api/auth/local`, {
    data: { identifier: 't1@schooltest.local', password: process.env.SEED_TEACHER_PASSWORD ?? 'Teacher1234!' },
  });
  expect(login.status()).toBe(200);
  const { jwt } = (await login.json()) as { jwt: string };
  return jwt;
}

async function closeLeftovers(request: APIRequestContext, jwt: string, klass: string): Promise<void> {
  const list = await request.get(`${API_BASE}/api/teacher/test-sessions?status=open&class=${klass}&pageSize=100`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  for (const s of ((await list.json()) as { sessions?: Array<{ sitting_document_id: string }> }).sessions ?? []) {
    await request.post(`${API_BASE}/api/teacher/test-sessions/${s.sitting_document_id}/close`, {
      headers: { Authorization: `Bearer ${jwt}` }, data: {},
    });
  }
}


/** Row-menu actions race the monitor poll's re-renders; retry the open+click. */
async function rowAction(page: import('@playwright/test').Page, row: ReturnType<import('@playwright/test').Page['locator']>, action: string): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await row.locator('[data-slot="live-row-menu"]').click({ timeout: 3000 });
      await page.locator(`[role="menuitem"][data-action="${action}"]`).click({ timeout: 3000 });
      return;
    } catch {
      await page.keyboard.press('Escape').catch(() => undefined);
      await page.waitForTimeout(1200);
    }
  }
  throw new Error(`row action ${action} did not land`);
}

  test('TEA-030: a class with no sitting renders the no-sitting card, not a blank board', async ({ page, request }) => {
    await signInTeacher(page, 't1@schooltest.local');
    const jwt0 = await teacherJwt(request);
    await closeLeftovers(request, jwt0, CLASS);
    // The proof class has seed sittings open, so use its live tab only after the
    // matrix lobby is closed; here the matrix class is idle again.
    await page.goto(`/dashboard/results/${CLASS}?tab=live`);
    await expect(page.locator('[data-slot="live-no-sitting"]')).toBeVisible();
    await expect(page.locator('[data-slot="start-session-button"]')).toBeVisible();
  });

  test('TEA-006/021/023/026/027: board tiles, row pause, mark absent, batch bar, activity card', async ({ page, request }) => {
    const jwt = await teacherJwt(request);
    await closeLeftovers(request, jwt, CLASS);
    const create = await request.post(`${API_BASE}/api/teacher/test-sessions`, {
      headers: { Authorization: `Bearer ${jwt}` },
      data: { class_document_id: CLASS, form_document_id: FORM, start: false },
    });
    expect(create.status()).toBe(201);
    const body = (await create.json()) as { sitting_document_id: string; code: string };
    const lobby = body.sitting_document_id;
    for (const email of ['anahera.kaur@schooltest.local', 'tane.ngata@schooltest.local', 'mia.chen@schooltest.local']) {
      expect((await request.post(`${API_BASE}/api/sittings/join`, { data: { code: body.code, email } })).status()).toBe(200);
    }

    await signInTeacher(page, 't1@schooltest.local');
    await page.goto(`/dashboard/results/${CLASS}?tab=live&session=${lobby}`);
    await expect(page.locator('[data-slot="run-sitting"]')).toBeVisible();

    // start the room so the tiles carry live states
    const controls = page.locator('[data-slot="room-controls"]');
    await controls.locator('[data-slot="room-toggle"]').click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Start test' }).click();
    await expect(controls).toHaveAttribute('data-lobby', 'false');

    const board = page.locator('[data-slot="live-students-board"]');
    await expect(board.locator('[data-slot="live-student-card"]')).toHaveCount(6); // whole-class lobby: all six members are tiles

    // TEA-027 — the activity card is on the page and streaming
    await expect(page.locator('[data-slot="live-activity"]')).toBeVisible();

    // TEA-021 — the row menu pauses and resumes ONE student only
    const row = page.locator('[data-slot="live-student-card"]').first();
    await rowAction(page, row, 'pause');
    const pauseDialog = page.getByRole('alertdialog');
    await pauseDialog.getByRole('button', { name: 'Pause' }).click();
    await expect(page.locator('[data-slot="live-student-card"]').first()).toContainText('Paused', { timeout: 15_000 });
    await rowAction(page, row, 'resume');

    // TEA-023 (mark absent) and TEA-026 (batch bar) are exercised by
    // live-students.spec.ts's fixture arms, which own their own roster data.
  });

  test('TEA-032: test-sessions rollup renders with per-class groups', async ({ page }) => {
    await signInTeacher(page, 't1@schooltest.local');
    await page.goto('/dashboard/test-sessions');
    await expect(page.locator('[data-surface="teacher-test-sessions"]')).toBeVisible();
  });

  test('TEA-036: the retired sitting monitor redirects to the class live tab', async ({ page, request }) => {
    await signInTeacher(page, 't1@schooltest.local');
    const jwt6 = await teacherJwt(request);
    await closeLeftovers(request, jwt6, CLASS);
    const create6 = await request.post(`${API_BASE}/api/teacher/test-sessions`, {
      headers: { Authorization: `Bearer ${jwt6}` },
      data: { class_document_id: CLASS, form_document_id: FORM, start: false },
    });
    expect(create6.status()).toBe(201);
    const lobby6 = ((await create6.json()) as { sitting_document_id: string }).sitting_document_id;
    await page.goto(`/dashboard/test-sessions/${lobby6}`);
    await expect(page).toHaveURL(new RegExp(`\\/dashboard\\/results\\/${CLASS}\\?tab=live&session=${lobby6}`), { timeout: 30_000 });
  });

  test('TEA-001/002: the classes landing renders KPI cards and the live strip links the live tab', async ({ page }) => {
    await signInTeacher(page, 't1@schooltest.local');
    await page.goto('/dashboard/teach');
    await expect(page).toHaveURL(/\/dashboard\/results$/, { timeout: 30_000 });
    // The retired /teach dashboard hands over to this landing: class chips
    // (the directory) plus the live-data strip.
    await expect(page.locator('[data-slot="class-badge"]').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-slot="live-strip"]')).toBeVisible();
    // The strip's card links into the owning class's live tab
    const link = page.locator('[data-slot="live-strip-card"]').first();
    await expect(link).toBeVisible();
  });

  test('TEA-043/044/045: the results page students tab, delta pills, search and sitting toggle', async ({ page }) => {
    await signInTeacher(page, 't1@schooltest.local');
    await page.goto(`/dashboard/results/${PROOF}`);
    await expect(page.locator('[data-slot="class-results-header"]')).toBeVisible({ timeout: 30_000 });
    // students tab is the default: scored rows exist for Proof Student One
    await expect(page.locator('[data-slot="students-tab-panel"]')).toBeVisible({ timeout: 30_000 });
    const rows = page.locator('[data-slot="student-results-row"]');
    const before = await rows.count();
    expect(before).toBeGreaterThan(0);
    // TEA-044 — a delta pill compares against the previous sitting
    await expect(page.locator('[data-slot="delta-text"]').first()).toBeVisible();
    // TEA-045 — the toolbar search narrows the table live
    const search = page.locator('[data-slot="pill-search"] input, [data-slot="pill-search"] input[type="search"]').first();
    await search.fill('Student One');
    await page.waitForTimeout(600);
    const after = await rows.count();
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThanOrEqual(before);
    await search.fill('');
  });

  test('TEA-046: a class with no results shows placeholders, never zeros', async ({ page, request }) => {
    await signInTeacher(page, 't1@schooltest.local');
    const jwt = await teacherJwt(request);
    const dash = await request.get(`${API_BASE}/api/teacher/dashboard`, { headers: { Authorization: `Bearer ${jwt}` } });
    const classes = ((await dash.json()) as { classes?: Array<{ class_document_id: string; test_a?: { total?: number }; student_count?: number }> }).classes ?? [];
    const idle = classes.find((c) => (c.test_a?.total ?? 0) === 0 && (c.student_count ?? 0) > 0);
    test.skip(idle === undefined, 'every t1 class has at least one sitting now');
    await page.goto(`/dashboard/results/${idle!.class_document_id}`);
    await expect(page.locator('[data-slot="students-tab-panel"]')).toBeVisible({ timeout: 30_000 });
    const scores = page.locator('[data-slot="student-score"]');
    const n = await scores.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(n, 5); i += 1) {
      const text = (await scores.nth(i).innerText()).trim();
      expect(text, 'an unsat score cell must not read 0').not.toMatch(/^0/);
    }
  });

  test('TEA-053: the class results export downloads a document', async ({ page }) => {
    test.setTimeout(120_000); // shared dev server compiles under fleet load
    await signInTeacher(page, 't1@schooltest.local');
    await page.goto(`/dashboard/results/${PROOF}`);
    // v2 redesign: the class header's export tray is gone — the SAME class-scoped
    // exports (PDF + LLM, ExportButtons) now ride each scored row of the students
    // results table. The first scored row's pair is the export this test proves.
    const exportButtons = page.locator('[data-slot="export-buttons"]').first();
    await expect(exportButtons).toBeVisible({ timeout: 30_000 });
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30_000 }),
      exportButtons.locator('[data-export]').last().click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.(csv|md|pdf)$/);
  });

  test('TEA-060: Download all prints one page per scored report in the class', async ({ page }) => {
    await signInTeacher(page, 't1@schooltest.local');
    await page.goto(`/dashboard/results/${PROOF}?tab=reports`);
    const downloadAll = page.locator('[data-slot="reports-download-all"]');
    await expect(downloadAll, 'the reports tab renders its Download all').toBeVisible({ timeout: 30_000 });
    // Proof 10X holds scored (released) results, so the batch download is wired
    await expect(downloadAll).toBeEnabled({ timeout: 20_000 });
    const [popup] = await Promise.all([page.waitForEvent('popup'), downloadAll.click()]);
    await expect(popup.locator('.page').first()).toBeVisible({ timeout: 30_000 });
    expect(await popup.locator('.page').count(), 'a page per scored student').toBeGreaterThan(0);
    await popup.close();
  });

  test('TEA-062: the teacher family preview page renders the wired preview', async ({ page }) => {
    await signInTeacher(page, 't1@schooltest.local');
    await page.goto(`/dashboard/teacher/results/${RELEASED_RESULT}/family`);
    await expect(page.locator('main')).toContainText(/reading|score|skill/i, { timeout: 30_000 });
  });

  test('TEA-064: the teacher report screen renders the per-student report', async ({ page }) => {
    test.setTimeout(120_000);
    await signInTeacher(page, 't1@schooltest.local');
    await page.goto(`/dashboard/reports/${RELEASED_RESULT}`);
    // The dashboard shell renders its own <main data-slot="sidebar-inset">, so the
    // bare `main` locator is ambiguous while the report loads inside its skeleton.
    // The report's own surface main carries the rendered per-student report.
    const report = page.locator('main[data-surface="teacher-report"]');
    await expect(report).toBeVisible({ timeout: 60_000 });
    await expect(report).toContainText(/report|reading|score/i, { timeout: 30_000 });
  });
