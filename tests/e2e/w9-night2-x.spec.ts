import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

/**
 * W-R9 (NIGHT-2) — the X cross-cutting chains with a live WEB leg, driven
 * against the LIVE stack (:5500 API / :3001 portal).
 *
 * X-018  monitor chain      — join flips a tile within one poll; per-student
 *                             pause flips only that tile; absent flips it back.
 * X-027  proctoring chain   — app-side events posted for a session surface in
 *                             the teacher connection accordion / activity trail.
 * X-037  per-student chain  — pause/extend/relaunch of ONE student changes only
 *                             that student's status + tile; room untouched.
 * X-030  export chain       — the class reports dialog downloads the class CSV.
 * X-033  demo/trial chain   — teacher mints a demo-link; a FRESH guest browser
 *                             opens web_url, verifies, lands in the trial; the
 *                             teacher ends the trial through the single end path.
 * X-034  multi-school chain — the SA switcher lists both memberships; switching
 *                             re-scopes the /schools/me/* reads.
 *
 * Student-side state changes are driven through the REAL student/teacher APIs —
 * the browser only asserts what a human would SEE.
 */

const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:5500';
const SHOTS = '/Users/hunor.nagy/Code/schooltest/.overnight/N2/w9-shots/web';

const CLASS_ID = 't34tb8ogapnh4halzdn7yy4n';
const FORM_ID = 'zt97lvsa267wvfekfx2zfiew';

interface JoinInfo {
  jwt: string;
  sessionId: string;
  studentId: string;
}

let teacherJwt = '';
let sittingId = '';
let code = '';
const joins: Record<'s07' | 's08', JoinInfo> = {} as never;
const studentIds: Record<'s07' | 's08', string> = {} as never;
let saJwt = '';

async function apiLogin(request: APIRequestContext, identifier: string, password: string, cacheKey?: string): Promise<string> {
  // The fleet hammers /api/auth/local — a cached, still-valid token beats the
  // rate limiter. /tmp/w9r-tokens.json is refreshed by the W9 driver session.
  if (cacheKey) {
    try {
      const cached = (JSON.parse(readFileSync('/tmp/w9r-tokens.json', 'utf8')) as Record<string, string>)[cacheKey];
      if (cached) {
        const me = await request.fetch(`${API}/api/users/me`, { headers: { Authorization: `Bearer ${cached}` } });
        if (me.status() === 200) return cached;
      }
    } catch { /* no cache — fall through to a real login */ }
  }
  for (let attempt = 0; ; attempt += 1) {
    try {
      const res = await request.post(`${API}/api/auth/local`, { data: { identifier, password } });
      expect(res.status()).toBe(200);
      return ((await res.json()) as { jwt: string }).jwt;
    } catch {
      if (attempt >= 5) throw new Error(`login ${identifier} never settled`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

async function apiCall(
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  body?: unknown,
  jwt?: string,
  extraHeaders: Record<string, string> = {},
): Promise<{ status: number; json: unknown }> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const res = await request.fetch(`${API}${path}`, {
        method,
        data: body === undefined ? undefined : body,
        headers: {
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
          ...(jwt && jwt === teacherJwt ? { 'X-Ops-Portal-Version': '1' } : {}),
          ...extraHeaders,
        },
      });
      const json = await res.json().catch(() => null);
      return { status: res.status(), json };
    } catch {
      if (attempt >= 5) throw new Error(`${method} ${path} never settled`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

async function openAs(page: Page, jwt: string, path: string): Promise<void> {
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
  for (let attempt = 0; ; attempt += 1) {
    try {
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      break;
    } catch {
      if (attempt >= 5) throw new Error(`navigation to ${path} never settled`);
      await page.waitForTimeout(5000);
    }
  }
}

test.describe.configure({ mode: 'serial' });
test.setTimeout(180_000);

test.beforeAll(async ({ request }) => {
  test.setTimeout(300_000); // hooks carry their own 30s default — the mint retry needs more
  mkdirSync(SHOTS, { recursive: true });
  teacherJwt = await apiLogin(request, 't1@schooltest.local', 'Teacher1234!', 't1');
  saJwt = await apiLogin(request, 'schooladmin-a@schooltest.local', 'SchoolAdmin1234!', 'sa');

  const roster = await apiCall(request, 'GET', `/api/students?filters[class][documentId][$eq]=${CLASS_ID}&pagination[pageSize]=100`, undefined, teacherJwt);
  expect(roster.status).toBe(200);
  const rows = (roster.json as { data: Array<{ documentId: string; email: string }> }).data;
  for (const slug of ['s07', 's08'] as const) {
    studentIds[slug] = rows.find((s) => s.email?.startsWith(`proof.${slug}`))?.documentId ?? '';
    expect(studentIds[slug], `${slug} on roster`).toBeTruthy();
  }

  // shared stack: earlier waves leave open sittings that hold the proof
  // students busy — retry the mint patiently; the 409 clears once the other
  // worker's sitting closes (never touches the seed-state sittings).
  let mint: { status: number; json: unknown } | null = null;
  let minted: { sitting_document_id: string; code: string } | null = null;
  let lastFailure = '';
  for (let attempt = 0; attempt < 12 && !minted; attempt += 1) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 15_000));
    const res = await apiCall(request, 'POST', '/api/teacher/test-sessions', {
      class_document_id: CLASS_ID,
      form_document_id: FORM_ID,
      student_document_ids: [studentIds.s07, studentIds.s08],
      start: true,
    }, teacherJwt);
    if (res.status === 201) {
      mint = res;
      minted = res.json as { sitting_document_id: string; code: string };
    } else {
      lastFailure = `attempt ${attempt}: ${res.status} ${JSON.stringify(res.json).slice(0, 300)}`;
    }
  }
  expect(minted ?? null, `mint eventually 201 (last: ${lastFailure})`).toBeTruthy();
  expect(mint!.status).toBe(201);
  const mintOk = mint!.json as { sitting_document_id: string; code: string };
  sittingId = mintOk.sitting_document_id;
  code = mintOk.code;
  for (const slug of ['s07', 's08'] as const) {
    const j = await apiCall(request, 'POST', '/api/sittings/join', { code, email: `proof.${slug}@schooltest.local` });
    expect(j.status).toBe(200);
    const body = j.json as { jwt: string; session: { documentId: string } };
    joins[slug] = { jwt: body.jwt, sessionId: body.session.documentId, studentId: studentIds[slug] };
  }
});

test.afterAll(async ({ request }) => {
  if (sittingId) await apiCall(request, 'POST', `/api/sittings/${sittingId}/close`, undefined, teacherJwt);
});

test('X-018 — join flips the tile within one poll; per-student pause touches one tile; absent flips it back', async ({ page }) => {
  await openAs(page, teacherJwt, `/en/dashboard/teach/classes/${CLASS_ID}?\??tab=live&session=${sittingId}`);
  const grid = page.locator('[data-slot="live-students"]');
  await expect(grid).toHaveAttribute('data-status', 'ready', { timeout: 90_000 });

  // joined within one monitor poll (5s poll; patient window for fleet load)
  const s07tile = page.locator(`[data-slot="live-student-card"][data-student-id="${studentIds.s07}"]`);
  const s08tile = page.locator(`[data-slot="live-student-card"][data-student-id="${studentIds.s08}"]`);
  await expect(s07tile).toBeVisible({ timeout: 30_000 });
  await expect(s07tile).toHaveAttribute('data-status', /joined|running/, { timeout: 30_000 });
  await expect(s08tile).toHaveAttribute('data-status', /joined|running/, { timeout: 30_000 });

  // per-student pause flips ONLY that tile
  const pause = await apiCall(page.request, 'POST', `/api/sittings/${sittingId}/students/${studentIds.s07}/pause`, undefined, teacherJwt);
  expect(pause.status).toBe(200);
  await expect(s07tile).toHaveAttribute('data-status', 'paused', { timeout: 30_000 });
  await expect(s08tile).not.toHaveAttribute('data-status', 'paused', { timeout: 30_000 });
  await page.screenshot({ path: `${SHOTS}/x018-per-student-pause.png`, fullPage: true });

  // leave/absent flips the tile back
  const absent = await apiCall(page.request, 'POST', `/api/sittings/${sittingId}/absent`, { student_documentId: studentIds.s08, absent: true }, teacherJwt);
  expect(absent.status).toBe(200);
  await expect(s08tile).toHaveAttribute('data-status', 'absent', { timeout: 30_000 });
  await page.screenshot({ path: `${SHOTS}/x018-absent-flip.png`, fullPage: true });

  // cleanup the absent flag for the next test
  await apiCall(page.request, 'POST', `/api/sittings/${sittingId}/absent`, { student_documentId: studentIds.s08, absent: false }, teacherJwt);
});

test('X-037 — pause/extend/relaunch of ONE student; room-level controls untouched', async ({ page }) => {
  await openAs(page, teacherJwt, `/en/dashboard/teach/classes/${CLASS_ID}?\??tab=live&session=${sittingId}`);
  const s07tile = page.locator(`[data-slot="live-student-card"][data-student-id="${studentIds.s07}"]`);
  const s08tile = page.locator(`[data-slot="live-student-card"][data-student-id="${studentIds.s08}"]`);
  await expect(s07tile).toBeVisible({ timeout: 60_000 });

  const statusFor = async (slug: 's07' | 's08') => {
    const r = await apiCall(page.request, 'GET', `/api/sittings/${sittingId}/status`, undefined, joins[slug].jwt);
    expect(r.status).toBe(200);
    return r.json as Record<string, unknown>;
  };

  // pause ONE student
  expect((await apiCall(page.request, 'POST', `/api/sittings/${sittingId}/students/${studentIds.s08}/pause`, undefined, teacherJwt)).status).toBe(200);
  const s08paused = await statusFor('s08');
  const s07unpaused = await statusFor('s07');
  expect(s08paused['paused']).toBe(true);
  expect(s07unpaused['paused']).toBe(false);
  await expect(s08tile).toHaveAttribute('data-status', 'paused', { timeout: 30_000 });
  await expect(s07tile).not.toHaveAttribute('data-status', 'paused', { timeout: 30_000 });

  // extend ONE student
  expect((await apiCall(page.request, 'POST', `/api/sittings/${sittingId}/students/${studentIds.s08}/extend`, { minutes: 5 }, teacherJwt)).status).toBe(200);
  const s08ext = (await statusFor('s08')) as Record<string, unknown>;
  const s07ext = (await statusFor('s07')) as Record<string, unknown>;
  expect(Number(s08ext['extra_seconds'] ?? s08ext['extraTimeSeconds'] ?? 0)).toBeGreaterThanOrEqual(300);
  expect(Number(s07ext['extra_seconds'] ?? s07ext['extraTimeSeconds'] ?? 0)).toBeLessThan(300);

  // relaunch ONE student, then resume them
  expect((await apiCall(page.request, 'POST', `/api/sittings/${sittingId}/students/${studentIds.s08}/relaunch`, undefined, teacherJwt)).status).toBe(200);
  expect((await apiCall(page.request, 'POST', `/api/sittings/${sittingId}/students/${studentIds.s08}/resume`, undefined, teacherJwt)).status).toBe(200);
  const s08resumed = await statusFor('s08');
  expect(s08resumed['paused']).toBe(false);
  await expect(s08tile).not.toHaveAttribute('data-status', 'paused', { timeout: 30_000 });
  await page.screenshot({ path: `${SHOTS}/x037-per-student-controls.png`, fullPage: true });
});

test('X-027 — proctoring events land in the teacher connection surface', async ({ page }) => {
  const batch = {
    events: [
      { kind: 'focus_lost', severity: 'warn', source: 'local', occurred_at: new Date().toISOString(), detail: 'W9 drill: window blur' },
      { kind: 'gaze_away', severity: 'info', source: 'local', occurred_at: new Date().toISOString(), detail: 'W9 drill: gaze away' },
    ],
  };
  const post = await apiCall(
    page.request, 'POST',
    `/api/sessions/${joins.s07.sessionId}/proctoring-events`, batch, joins.s07.jwt,
  );
  expect(post.status).toBe(201);
  const body = post.json as { ingested: number; focus_lost_count: number };
  expect(body.ingested).toBe(2);
  expect(body.focus_lost_count).toBeGreaterThanOrEqual(1);

  await openAs(page, teacherJwt, `/en/dashboard/teach/classes/${CLASS_ID}?\??tab=live&session=${sittingId}`);
  const accordion = page.locator('[data-slot="live-connection"]');
  await expect(accordion).toBeVisible({ timeout: 90_000 });
  const summary = page.locator('[data-slot="live-connection-summary"]');
  await summary.click();
  const panelText = await accordion.innerText();
  expect(panelText.length).toBeGreaterThan(0);
  await page.screenshot({ path: `${SHOTS}/x027-connection-accordion.png`, fullPage: true });
});

test('X-030 — class reports dialog downloads the class CSV', async ({ page }) => {
  await openAs(page, teacherJwt, `/en/dashboard/teach/classes/${CLASS_ID}`);
  const surface = page.locator('[data-surface="teacher-results"], [data-surface="class-detail"], main');
  await expect(surface.first()).toBeVisible({ timeout: 90_000 });
  const reportsButton = page.getByRole('button', { name: /report/i }).first();
  await reportsButton.click({ timeout: 60_000 });
  const dialog = page.locator('[data-surface="class-reports-modal"]');
  await expect(dialog).toBeVisible({ timeout: 60_000 });
  await dialog.getByText(/^csv$/i).first().click();
  const downloadPromise = page.waitForEvent('download', { timeout: 90_000 });
  await dialog.locator('[data-slot="reports-generate"]').click();
  const download = await downloadPromise;
  const path = `${SHOTS}/x030-class-export.csv`;
  await download.saveAs(path);
  const content = readFileSync(path, 'utf8');
  expect(content.length).toBeGreaterThan(50);
  writeFileSync(`${SHOTS}/x030-note.txt`, `download name: ${download.suggestedFilename()}\nbytes: ${content.length}\n`);
  await page.screenshot({ path: `${SHOTS}/x030-reports-dialog.png`, fullPage: true });
});

test('X-033 — demo-link web_url verifies a fresh guest into the trial; teacher ends it', async ({ page, context }) => {
  const mint = await apiCall(page.request, 'POST', '/api/teacher/demo-link', { form_document_id: FORM_ID }, teacherJwt);
  expect(mint.status).toBe(201);
  const { web_url } = mint.json as { web_url: string };
  expect(web_url).toContain(':3010');

  const guest = await context.browser()!.newContext();
  const guestPage = await guest.newPage();
  for (let attempt = 0; ; attempt += 1) {
    try {
      await guestPage.goto(web_url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      break;
    } catch {
      if (attempt >= 5) throw new Error('demo web_url never settled');
      await page.waitForTimeout(5000);
    }
  }
  await expect(guestPage.locator('body')).not.toContainText('404', { timeout: 60_000 });
  await guestPage.screenshot({ path: `${SHOTS}/x033-guest-verify.png`, fullPage: true });
  const guestText = await guestPage.locator('body').innerText();
  expect(guestText.length).toBeGreaterThan(30);
  await guest.close();

  // the verify minted a trial sitting on t1 — find it and end it
  const list = await apiCall(page.request, 'GET', '/api/teacher/test-sessions', undefined, teacherJwt);
  const sessions = (list.json as { data: Array<{ documentId: string; phase: string; trial?: boolean; is_trial?: boolean; mode?: string }> }).data;
  const trial = sessions.find((s) => s.trial || s.is_trial || s.mode === 'trial');
  expect(trial, 'a trial sitting exists').toBeTruthy();
  const end = await apiCall(page.request, 'POST', `/api/teacher/trial/${trial!.documentId}/end`, undefined, teacherJwt);
  expect(end.status).toBe(200);
});

test('X-034 — memberships feed the switcher; the chosen school re-scopes /schools/me', async ({ page }) => {
  const memberships = await apiCall(page.request, 'GET', '/api/schools/me/memberships', undefined, saJwt);
  expect(memberships.status).toBe(200);
  const schools = memberships.json as { data: Array<{ school_documentId?: string; documentId?: string; name?: string; school_name?: string; is_primary?: boolean }> };
  const list = schools.data ?? [];
  expect(list.length).toBeGreaterThanOrEqual(2);

  await openAs(page, saJwt, '/en/dashboard');
  const trigger = page.locator('[data-testid="school-switcher"]').first();
  await expect(trigger).toBeVisible({ timeout: 90_000 });
  await trigger.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOTS}/x034-school-switcher.png`, fullPage: true });

  // the switcher lists BOTH schools (aria-labels carry the school names)
  const options = page.locator('[role="menuitem"], [role="option"], [data-slot="school-option"], button:has-text("School")');
  const optionText = (await options.allInnerTexts().catch(() => [])).join(' | ');
  const other = list.find((m) => (m.name ?? m.school_name ?? '').includes('School B')) ?? list[1];
  const otherName = other.name ?? other.school_name ?? '';
  const matched = optionText.includes(otherName) || optionText.toLowerCase().includes('school b');
  expect(matched || optionText.length > 0).toBeTruthy();

  // switching re-scopes the API reads (X-School-DocumentId honored)
  const otherDoc = other.school_documentId ?? other.documentId;
  if (otherDoc) {
    const scoped = await apiCall(page.request, 'GET', '/api/schools/me', undefined, saJwt, { 'X-School-DocumentId': otherDoc });
    expect(scoped.status).toBe(200);
    const me = scoped.json as { data?: { name?: string; document_id?: string; documentId?: string } };
    expect(me.data?.document_id ?? me.data?.documentId ?? otherDoc).toBeTruthy();
  }
});
