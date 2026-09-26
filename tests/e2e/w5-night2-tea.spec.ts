import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { fr, teacherApi, type TeacherApi } from './helpers/teacher-family-reports';
import { signIn, signInTeacher } from './helpers/teacher-rail';

/**
 * NIGHT-2 W-R5 — the last ten TEA gaps, one serial pass against the LIVE stack
 * (:3001 UI, :5500 API). The dedicated specs (family-reports-tab, live-students)
 * own their deep arms; this file proves the ten catalog lines end to end. The
 * family-reports arms only DOWNLOAD (print windows, Spec 06's rebuilt tab) and
 * write nothing; the live sitting is closed at the end.
 */

const CLASS = 'wmbv852uxduz6g642hs55g21'; // Matrix Ten X (t1) — the W5 matrix class
const PROOF = 't34tb8ogapnh4halzdn7yy4n'; // Proof 10X (t1) — scored + released results
const FORM = 'zt97lvsa267wvfekfx2zfiew';
const API_BASE = 'http://127.0.0.1:5500';
const PROOFS = path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'w5-night2');

test.use({ viewport: { width: 1440, height: 900 } });
test.describe.configure({ mode: 'serial' });

async function teacherJwt(request: APIRequestContext): Promise<string> {
  const login = await request.post(`${API_BASE}/api/auth/local`, {
    data: { identifier: 't1@schooltest.local', password: process.env.SEED_TEACHER_PASSWORD ?? 'Teacher1234!' },
  });
  expect(login.status()).toBe(200);
  const { jwt } = (await login.json()) as { jwt: string };
  return jwt;
}

/** Close every open sitting + cancel every booking the matrix class carries. */
async function cleanMatrix(request: APIRequestContext, jwt: string): Promise<void> {
  const list = await request.get(`${API_BASE}/api/teacher/test-sessions?pageSize=100`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const body = (await list.json()) as {
    sessions: Array<{
      sitting_document_id: string;
      status: string;
      code: string | null;
      opened_at: string | null;
      class?: { document_id?: string };
    }>;
  };
  for (const s of body.sessions ?? []) {
    if ((s.class?.document_id ?? '') !== CLASS) continue;
    if (s.status === 'closed' || s.status === 'cancelled') continue;
    if (s.code === null && s.opened_at === null) {
      await request.post(`${API_BASE}/api/teacher/test-sessions/${s.sitting_document_id}/cancel`, {
        headers: { Authorization: `Bearer ${jwt}` }, data: {},
      });
    } else {
      await request.post(`${API_BASE}/api/sittings/${s.sitting_document_id}/close`, {
        headers: { Authorization: `Bearer ${jwt}` }, data: {},
      });
    }
  }
}

interface LiveSitting {
  sitting: string;
  code: string;
  emails: string[];
}

/** The shared :5500 process blips under fleet load; retry idempotent reads. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (cause) {
      lastError = cause;
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
  }
  throw lastError;
}

/** Mint a started sitting on the matrix class with three joined students. */
async function mintLiveSitting(request: APIRequestContext, jwt: string): Promise<LiveSitting> {
  const roster = await request.get(`${API_BASE}/api/my/students/results?class=${CLASS}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(roster.status()).toBe(200);
  // the read answers a BARE array of deidentified rows ({ student: { document_id, name } })
  type RosterRow = { student: { document_id: string; name: string } };
  const rosterBody: unknown = await roster.json();
  const members: RosterRow[] = Array.isArray(rosterBody)
    ? (rosterBody as RosterRow[])
    : ((rosterBody as { data?: RosterRow[] }).data ?? []);
  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z ]/g, '').trim();
  const emails = members
    .map((m) => {
      const parts = norm(m.student.name).split(/\s+/);
      return parts.length >= 2 ? `${parts[0]}.${parts[parts.length - 1]}@schooltest.local` : '';
    })
    .filter(Boolean);
  expect(emails.length, 'matrix roster carries emails to derive').toBeGreaterThanOrEqual(4);

  const create = await request.post(`${API_BASE}/api/teacher/test-sessions`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: { class_document_id: CLASS, form_document_id: FORM, start: false },
  });
  expect(create.status()).toBe(201);
  const created = (await create.json()) as { sitting_document_id: string; code: string };
  for (const email of emails.slice(0, 3)) {
    const join = await request.post(`${API_BASE}/api/sittings/join`, { data: { code: created.code, email } });
    expect(join.status(), `join ${email}`).toBeLessThan(300);
  }
  const start = await request.post(`${API_BASE}/api/sittings/${created.sitting_document_id}/start`, {
    headers: { Authorization: `Bearer ${jwt}` }, data: {},
  });
  expect(start.status()).toBeLessThan(300);
  return { sitting: created.sitting_document_id, code: created.code, emails };
}

/** Row-menu actions race the monitor poll's re-renders; retry the open+click. */
async function rowAction(page: Page, row: ReturnType<Page['locator']>, action: string): Promise<void> {
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

test('TEA-023/026 — live board: mark-absent flags a no-show; batch bar pauses and extends in bulk', async ({ page, request }) => {
  test.setTimeout(240_000);
  mkdirSync(PROOFS, { recursive: true });
  const jwt = await teacherJwt(request);
  await cleanMatrix(request, jwt);
  const live = await mintLiveSitting(request, jwt);

  await signInTeacher(page, 't1@schooltest.local');
  await page.goto(`/dashboard/results/${CLASS}?tab=live&session=${live.sitting}`);
  const board = page.locator('[data-slot="live-students-board"]');
  await expect(board).toBeVisible({ timeout: 30_000 });
  const tiles = board.locator('[data-slot="live-student-card"]');
  await expect(tiles).toHaveCount(6); // whole-class sitting: every member is a tile

  // TEA-023 — the three who never joined are eligible for mark-absent
  const noShow = page.locator('[data-slot="live-student-card"][data-status="not_joined"]').first();
  await expect(noShow).toBeVisible();
  await rowAction(page, noShow, 'markAbsent');
  const absentDialog = page.getByRole('alertdialog');
  await absentDialog.getByRole('button', { name: 'Mark absent', exact: true }).click();
  await expect(page.locator('[data-slot="live-student-card"][data-status="absent"]').first()).toBeVisible({
    timeout: 20_000,
  });
  // the flag is real: the monitor API now reports the member absent
  const monitor = await request.get(`${API_BASE}/api/sittings/${live.sitting}/monitor`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(monitor.status()).toBe(200);
  const absentOnApi = ((await monitor.json()).data.students ?? []).some((s: { state: string }) => s.state === 'absent');
  expect(absentOnApi, 'monitor reports an absent member').toBe(true);
  await page.screenshot({ path: path.join(PROOFS, 'tea-023-mark-absent.png'), animations: 'disabled' });

  // TEA-026 — bulk extend first (attempts are working; a paused clock is frozen
  // by design, so the batch bar only tallies eligible — running — students),
  // then bulk pause on two of them.
  const readTiles = async (): Promise<Array<{ documentId: string; paused: boolean; extra_minutes: number }>> =>
    (((await (await request.get(`${API_BASE}/api/sittings/${live.sitting}/monitor`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })).json()).data.students ?? []) as Array<{ documentId: string; paused: boolean; extra_minutes: number }>);

  const workingTiles = page.locator(
    '[data-slot="live-student-card"][data-status="in_progress"], [data-slot="live-student-card"][data-status="joined"]',
  );
  await expect(workingTiles.nth(1)).toBeVisible({ timeout: 20_000 });
  for (let i = 0; i < 2; i += 1) {
    await workingTiles.nth(i).getByRole('checkbox').click();
  }
  const batchBar = page.locator('[data-slot="live-batch-bar"]');
  await expect(batchBar).toBeVisible();
  await batchBar.locator('[data-batch="extend"]').click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Allow extra time', exact: true })
    .click();
  await expect
    .poll(
      async () => {
        const ts = await readTiles();
        return ts.filter((s) => s.extra_minutes === 10).length === 2;
      },
      { timeout: 20_000, message: 'both selected attempts carry +10 minutes' },
    )
    .toBe(true);

  // bulk pause on two working attempts
  for (let i = 0; i < 2; i += 1) {
    await workingTiles.nth(i).getByRole('checkbox').click();
  }
  await expect(batchBar).toBeVisible();
  await batchBar.locator('[data-batch="pause"]').click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Pause', exact: true })
    .click();
  await expect
    .poll(
      async () => page.locator('[data-slot="live-student-card"][data-status="paused"]').count(),
      { timeout: 20_000, message: 'both selected tiles pause' },
    )
    .toBe(2);
  await expect
    .poll(
      async () => (await readTiles()).filter((s) => s.paused === true).length,
      { timeout: 20_000, message: 'two paused attempts on the API' },
    )
    .toBe(2);
  await expect(batchBar).toBeHidden(); // the selection clears after a batch run
  await page.screenshot({ path: path.join(PROOFS, 'tea-026-batch-bar.png'), animations: 'disabled' });

  await request.post(`${API_BASE}/api/sittings/${live.sitting}/close`, {
    headers: { Authorization: `Bearer ${jwt}` }, data: {},
  });
});

test('TEA-046 — a class with no results shows the empty state, never zeros', async ({ page, playwright }) => {
  test.setTimeout(240_000);
  // RAW dashboard read: the parsed TeacherApi card strips the `status` field this
  // picker needs (no_tests_yet classes = students but zero sittings/results).
  const jwt = await teacherJwt(page.request);
  const raw = await page.request.get(`${API_BASE}/api/teacher/dashboard`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(raw.status()).toBe(200);
  type RawCard = {
    class_document_id: string;
    name: string;
    student_count: number;
    status: string;
  };
  // the dashboard answers { classes: [...] } at the TOP level (no data envelope)
  const cards = (((await raw.json()) as { classes?: RawCard[] }).classes ?? []) as RawCard[];
  // Classes the DASHBOARD lists include old probe classes whose detail read
  // refuses t1 (single-teacher relation vs the m2m the list uses), so prefer
  // the ops-created Matrix classes t1 owns.
  const candidates = cards
    .filter((c) => c.status === 'no_tests_yet' && c.student_count > 0)
    .sort((left, right) => Number(right.name.startsWith('Matrix')) - Number(left.name.startsWith('Matrix')));
  test.skip(candidates.length === 0, 'every t1 class already carries results');
  await signInTeacher(page, 't1@schooltest.local');
  let opened: string | null = null;
  for (const candidate of candidates.slice(0, 6)) {
    await page.goto(`/dashboard/results/${candidate.class_document_id}`);
    // waitFor actually waits; isVisible() returns instantly and races the data fetch
    const panel = page.locator('[data-slot="students-tab-panel"]');
    const appeared = await panel
      .waitFor({ state: 'visible', timeout: 25_000 })
      .then(() => true, () => false);
    if (appeared) {
      opened = candidate.class_document_id;
      break;
    }
  }
  test.skip(opened === null, 'no openable results-less class on the dashboard');
  const panel = page.locator('[data-slot="students-tab-panel"]');
  // the roster renders (a class of real students), but NOTHING may read as a zero score
  const zeros = panel.locator('text=/\\b0\\s*%/');
  expect(await zeros.count(), 'no fabricated 0% scores on a results-less class').toBe(0);
  await page.screenshot({ path: path.join(PROOFS, 'tea-046-no-results.png'), animations: 'disabled' });

  // and a class with no members at all renders the roster empty state, not a zeroed table
  const emptyClass = cards.find((c) => c.student_count === 0 && c.name.startsWith('Matrix'));
  if (emptyClass !== undefined) {
    await page.goto(`/dashboard/results/${emptyClass.class_document_id}`);
    await expect(page.locator('[data-slot="students-empty"]')).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: path.join(PROOFS, 'tea-046-empty-roster.png'), animations: 'disabled' });
  }
});

test('TEA-053 — the class results page downloads a CSV of scores and bands', async ({ page }) => {
  test.setTimeout(180_000);
  mkdirSync(PROOFS, { recursive: true });
  await signInTeacher(page, 't1@schooltest.local');
  await page.goto(`/dashboard/results/${PROOF}`);
  await expect(page.locator('[data-slot="class-results-header"]')).toBeVisible({ timeout: 30_000 });

  await page.locator('[data-slot="class-reports-button"]').click();
  const dialog = page.locator('[data-surface="class-reports-modal"]');
  await expect(dialog).toBeVisible();
  // student reports, CSV format — the format carries score + band columns
  await dialog.locator('input[name="reports-kind"][value="student"]').check({ force: true }).catch(() => undefined);
  await dialog.locator('[data-slot="reports-format"][data-value="csv"]').click();
  const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
  await dialog.locator('[data-slot="reports-generate"]').click();
  const download = await downloadPromise;
  const target = path.join(PROOFS, download.suggestedFilename() || 'class-reports.csv');
  await download.saveAs(target);
  const csv = readFileSync(target, 'utf8');
  expect(csv.length, 'csv carries rows').toBeGreaterThan(50);
  expect(csv, 'csv has score and band columns').toMatch(/[Bb]and/);
  expect(csv, 'csv has a score column').toMatch(/[Ss]core/);
  expect(csv, 'csv carries real band values').toMatch(/Emerging|Beginning|Secure|Not yet/);
  expect(csv, 'csv names a Proof student').toMatch(/Proof Student/);
});

/**
 * teacherApi signs in as t2 (ACCOUNTS.teacher), so the family-reports arms run
 * against T2's OWN classes: find one whose roster holds scored rows — the only
 * rows the rebuilt tab's PDF downloads serve.
 */
async function findClassWithScored(
  live: TeacherApi,
): Promise<{
  classDocumentId: string;
  roster: Awaited<ReturnType<TeacherApi['roster']>>;
  scored: Awaited<ReturnType<TeacherApi['roster']>>;
}> {
  const dashboard = await live.dashboard();
  for (const card of dashboard.classes.filter((c) => c.student_count > 0)) {
    const roster = await withRetry(() => live.roster(card.class_document_id));
    const scored = roster.filter((entry) => entry.result !== null && entry.result.overall.domain_score != null);
    if (scored.length > 0) return { classDocumentId: card.class_document_id, roster, scored };
  }
  throw new Error('no t2 class carries a scored result to work with');
}

test('TEA-057/058 — family reports: rows carry has-result, PDF and "No result yet"; a PDF prints', async ({ page, playwright }) => {
  test.setTimeout(300_000);
  const live = await teacherApi(playwright);
  const { classDocumentId, roster, scored } = await withRetry(() => findClassWithScored(live));

  await signIn(page, 'teacher');
  await page.goto(`/dashboard/results/${classDocumentId}?tab=reports`);
  const panel = page.locator('[data-tab-panel="reports"] [data-slot="family-reports"]');
  await expect(panel).toBeVisible({ timeout: 30_000 });

  // TEA-057 — every served roster row renders, marked with what it holds: a PDF button
  // for a scored result, "No result yet" for none or an unscored one (as the Students tab).
  const rows = panel.locator('[data-slot="reports-student-row"]');
  await expect(rows).toHaveCount(roster.length);
  for (const entry of roster) {
    const row = panel.locator(`[data-slot="reports-student-row"][data-student-id="${entry.student.document_id}"]`);
    await expect(row).toContainText(entry.student.name);
    await expect(row).toHaveAttribute('data-has-result', entry.result === null ? 'false' : 'true');
    if (entry.result === null || entry.result.overall.domain_score === null) {
      await expect(row.locator('[data-slot="reports-no-result"]')).toHaveText(fr('students.noResultYet'));
      await expect(row.locator('[data-slot="reports-student-pdf"]')).toHaveCount(0);
    } else {
      await expect(row.locator('[data-slot="reports-student-pdf"]')).toBeEnabled();
    }
  }
  await page.screenshot({ path: path.join(PROOFS, 'tea-057-family-states.png'), animations: 'disabled' });

  // TEA-058 — a scored student's row button opens the real per-student report popup
  // (the print export the carer's copy is built from — the preview dialog is gone).
  const target = scored[0];
  const name = target.student.name;
  const row = panel.locator(`[data-slot="reports-student-row"][data-student-id="${target.student.document_id}"]`);
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    row.locator('[data-slot="reports-student-pdf"]').click(),
  ]);
  await expect(popup.locator('h1')).toHaveText(name, { timeout: 30_000 });
  await popup.screenshot({ path: path.join(PROOFS, 'tea-058-student-pdf.png'), animations: 'disabled' });
  await popup.close();
});

test('TEA-060 — Download all opens one print document with a page per scored student', async ({ page, playwright }) => {
  test.setTimeout(300_000);
  const live = await teacherApi(playwright);
  const { classDocumentId, scored } = await withRetry(() => findClassWithScored(live));
  await signIn(page, 'teacher');
  await page.goto(`/dashboard/results/${classDocumentId}?tab=reports`);
  const panel = page.locator('[data-tab-panel="reports"] [data-slot="family-reports"]');
  await expect(panel).toBeVisible({ timeout: 30_000 });
  const downloadAll = panel.locator('[data-slot="reports-download-all"]');
  await expect(downloadAll).toBeEnabled();
  const [popup] = await Promise.all([page.waitForEvent('popup'), downloadAll.click()]);
  await expect(popup.locator('.page'), 'one page per scored student').toHaveCount(scored.length, {
    timeout: 30_000,
  });
  await popup.screenshot({ path: path.join(PROOFS, 'tea-060-download-all.png'), animations: 'disabled' });
  await popup.close();
});

test('TEA-064 — /dashboard/reports/:resultDocumentId renders the per-student teacher report', async ({ page }) => {
  test.setTimeout(180_000);
  mkdirSync(PROOFS, { recursive: true });
  const jwt = await teacherJwt(page.request);
  const roster = await page.request.get(`${API_BASE}/api/my/students/results?class=${PROOF}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(roster.status()).toBe(200);
  const rows = ((await roster.json()).data ?? []) as Array<{ result: { document_id: string } | null }>;
  const rid = rows.find((r) => r.result !== null)?.result?.document_id;
  test.skip(rid === undefined, 'Proof 10X holds no result row to open');
  if (rid === undefined) return;

  await signInTeacher(page, 't1@schooltest.local');
  await page.goto(`/dashboard/reports/${rid}`);
  const surface = page.locator('[data-surface="teacher-report"]');
  await expect(surface).toBeVisible({ timeout: 30_000 });
  // the per-student body renders evidence tracks (subskill profile), not an empty shell
  await expect(page.locator('[data-slot="report-attribute-track"]').first()).toBeVisible({ timeout: 20_000 });
  await page.screenshot({ path: path.join(PROOFS, 'tea-064-teacher-report.png'), animations: 'disabled' });
});
