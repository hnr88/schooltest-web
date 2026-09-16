import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { signInTeacher } from '../helpers/teacher-rail';

/**
 * NIGHT-2 W5 — the CANONICAL live chain on the teacher UI (:3001), driven end
 * to end against the real stack:
 *
 *   lobby (planned sitting, waiting student) → Start test (admits everyone)
 *   → Pause (confirm, paused takeover state) → Resume → +10 min extend (banner)
 *   → per-student Force submit → the student tile flips to Submitted.
 *
 * The un-started lobby needs the C-SIT-STATUS phase on the monitor (the Start
 * control's target), so this spec doubles as the regression for that contract:
 * the room-controls cell must render `data-lobby="true"` with a Start test
 * button BEFORE the start, and `data-paused`/extend behaviour AFTER it.
 *
 * Self-contained data: the teacher API is used to free the proof student from
 * any leftover open sitting (close), then a fresh `start:false` sitting is
 * created — the seed's own "waiting" recipe (scripts/demo-proof-scenario.mjs).
 */

/** The API base the web app itself points at, IPv4-pinned for Node (see teacher-contract-live.spec.ts). */
const API_BASE = (() => {
  const raw = readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
  const line = raw.split('\n').find((l) => l.startsWith('NEXT_PUBLIC_API_BASE_URL=')) ?? '=';
  const url = new URL(line.slice(line.indexOf('=') + 1).replace(/^['"]|['"]$/g, ''));
  if (url.hostname === 'localhost') url.hostname = '127.0.0.1';
  return url.origin;
})();

const CLASS_ID = 't34tb8ogapnh4halzdn7yy4n'; // Proof 10X (demo-proof-scenario seed)
const FORM_ID = 'j6lers626yexsdacat60i52x';
const STUDENT_ID = 'ql31fr0b37zx8wpr02az5dcs'; // Proof Student Six
const STUDENT_EMAIL = 'proof.s06@schooltest.local';

/** Mint a teacher JWT the same way the app does. */
async function teacherJwt(request: APIRequestContext): Promise<string> {
  const login = await request.post(`${API_BASE}/api/auth/local`, {
    data: { identifier: 't1@schooltest.local', password: process.env.SEED_TEACHER_PASSWORD ?? 'Teacher1234!' },
  });
  expect(login.status()).toBe(200);
  const { jwt } = (await login.json()) as { jwt: string };
  return jwt;
}

/** Close every OPEN sitting of the class that still holds the proof student (leftovers only). */
async function freeProofStudent(request: APIRequestContext, jwt: string): Promise<void> {
  const list = await request.get(
    `${API_BASE}/api/teacher/test-sessions?status=open&class=${CLASS_ID}&pageSize=100`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  expect(list.status()).toBe(200);
  const body = (await list.json()) as {
    sessions?: Array<{ sitting_document_id: string; member_student_ids?: string[] | null }>;
  };
  for (const sitting of body.sessions ?? []) {
    const holdsProof = sitting.member_student_ids?.includes(STUDENT_ID) ?? false;
    if (!holdsProof) continue;
    const close = await request.post(
      `${API_BASE}/api/teacher/test-sessions/${sitting.sitting_document_id}/close`,
      { headers: { Authorization: `Bearer ${jwt}` }, data: {} },
    );
    expect(close.status(), 'close of a leftover open sitting').toBe(200);
  }
}

/** Create the lobby (start:false) and sign the proof student into it, as the seed does. */
async function createLobby(
  request: APIRequestContext,
  jwt: string,
): Promise<{ sittingId: string; studentJwt: string }> {
  const create = await request.post(`${API_BASE}/api/teacher/test-sessions`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: {
      class_document_id: CLASS_ID,
      form_document_id: FORM_ID,
      student_document_ids: [STUDENT_ID],
      start: false,
    },
  });
  expect(create.status()).toBe(201);
  const body = (await create.json()) as { sitting_document_id: string; phase: string; code: string };
  expect(body.phase).toBe('open');
  // The waiting-room half: the student verifies the code and joins the lobby.
  const join = await request.post(`${API_BASE}/api/sittings/join`, {
    data: { code: body.code, email: STUDENT_EMAIL },
  });
  expect(join.status()).toBe(200);
  const { jwt: studentJwt } = (await join.json()) as { jwt: string };
  return { sittingId: body.sitting_document_id, studentJwt };
}

/**
 * C-SIT-STATUS read as the STUDENT — the very poll the waiting room consumes to
 * hand the class into the runner. `phase: 'running'` here IS "the kids can do the
 * thing"; asserting it with the student's own join JWT proves the release
 * reached them, not merely that the teacher's own screen changed.
 */
async function studentSeesPhase(
  request: APIRequestContext,
  studentJwt: string,
  sittingId: string,
): Promise<string> {
  const res = await request.get(`${API_BASE}/api/sittings/${sittingId}/status`, {
    headers: { Authorization: `Bearer ${studentJwt}` },
  });
  expect(res.status()).toBe(200);
  const { phase } = (await res.json()) as { phase: string };
  return phase;
}

/** The teacher monitor read — the same payload the Live tab polls. */
async function monitorSitting(
  request: APIRequestContext,
  jwt: string,
  sittingId: string,
): Promise<{ phase: string; paused: boolean; extensions: number; extra_seconds: number }> {
  const res = await request.get(`${API_BASE}/api/teacher/test-sessions/${sittingId}/monitor`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.status()).toBe(200);
  const { sitting } = (await res.json()) as {
    sitting: { phase: string; paused: boolean; extensions: number; extra_seconds: number };
  };
  return sitting;
}

async function openLiveTab(page: Page, sittingId: string): Promise<void> {
  await page.goto(`/dashboard/results/${CLASS_ID}?tab=live&session=${sittingId}`);
  await expect(page.locator('[data-slot="run-sitting"]')).toBeVisible();
}

test('canonical chain: lobby → Start → pause → resume → extend → force submit', async ({ page, request }) => {
  test.setTimeout(180_000);
  const jwt = await teacherJwt(request);
  await freeProofStudent(request, jwt);
  const { sittingId, studentJwt } = await createLobby(request, jwt);

  // The Proof 10X class is owned by the seed teacher t1 — not the shared `teacher` alias.
  await signInTeacher(page, 't1@schooltest.local');
  await openLiveTab(page, sittingId);

  // ── LOBBY: the room controls offer Start test, extends are disabled ──
  const controls = page.locator('[data-slot="room-controls"]');
  await expect(controls).toHaveAttribute('data-lobby', 'true');
  const toggle = controls.locator('[data-slot="room-toggle"]');
  await expect(toggle).toHaveText(/Start test/i);
  await expect(controls.locator('[data-slot="room-meta"]')).toContainText('waiting in the lobby');
  const extendButtons = controls.getByRole('button', { name: /^\+\d+ min$/ });
  await expect(extendButtons).toHaveCount(2);
  for (const button of await extendButtons.all()) await expect(button).toBeDisabled();
  expect(await studentSeesPhase(request, studentJwt, sittingId), 'student waits before the release').toBe('open');

  // ── START: the confirm admits the waiting student; the room turns running ──
  await toggle.click();
  const startDialog = page.getByRole('alertdialog');
  await expect(startDialog).toContainText('Start the test for everyone?');
  await startDialog.getByRole('button', { name: 'Start test' }).click();
  await expect(controls).toHaveAttribute('data-lobby', 'false');
  await expect(toggle).toHaveText(/Pause test/i);
  expect((await monitorSitting(request, jwt, sittingId)).phase).toBe('running');

  // The release REPORTED itself. Start answers a bare `{ sitting }` while every
  // other room control answers `{ data }`; parsing it as `{ data }` made a start
  // the server HAD performed raise the red "That did not go through" toast, and
  // the room still flipped to running underneath (the mutation invalidates the
  // monitor whether it settled ok or not) — so the chain above passed while the
  // teacher was told it had failed. These two assertions are that regression.
  await expect(page.locator('[data-sonner-toast][data-type="error"]')).toHaveCount(0);
  await expect(page.locator('[data-sonner-toast]')).toContainText('has been admitted to question 1');

  // And the students really were released: the waiting room's own poll, read
  // with the student's join JWT, now hands them into the runner.
  expect(await studentSeesPhase(request, studentJwt, sittingId), 'student is admitted').toBe('running');

  // ── PAUSE: confirm first, then the paused takeover state ──
  await toggle.click();
  const pauseDialog = page.getByRole('alertdialog');
  await expect(pauseDialog).toContainText('Pause the test for everyone?');
  await pauseDialog.getByRole('button', { name: 'Pause test' }).click();
  await expect(controls).toHaveAttribute('data-paused', 'true');
  await expect(controls.locator('[data-slot="room-paused-at"]')).toBeVisible();
  await expect(toggle).toHaveText(/Resume test/i);
  expect((await monitorSitting(request, jwt, sittingId)).paused).toBe(true);

  // ── RESUME: acts at once (design rule), the room runs again ──
  await toggle.click();
  await expect(controls).toHaveAttribute('data-paused', 'false');
  expect((await monitorSitting(request, jwt, sittingId)).paused).toBe(false);

  // ── EXTEND +10: confirm, then the extra-time banner and monitor agree ──
  await extendButtons.nth(1).click();
  const extendDialog = page.getByRole('alertdialog');
  await expect(extendDialog).toContainText('Add 10 minutes for the whole room?');
  await extendDialog.getByRole('button', { name: 'Add 10 minutes' }).click();
  await expect(controls.locator('[data-slot="room-meta"]')).toContainText('+10 min');
  const extended = await monitorSitting(request, jwt, sittingId);
  expect(extended.extensions).toBe(1);
  expect(extended.extra_seconds).toBe(600);

  // ── FORCE SUBMIT: the row menu's Force submit ends the one attempt ──
  const row = page
    .locator('[data-slot="live-student-card"]')
    .filter({ hasText: STUDENT_EMAIL })
    .first();
  await expect(row).toBeVisible();
  await row.locator('[data-slot="live-row-menu"]').click();
  await page.locator('[role="menuitem"][data-action="forceSubmit"]').click();
  // Zero answers on the attempt, so the honest empty-attempt confirm shows.
  const forceDialog = page.getByRole('alertdialog');
  await expect(forceDialog).toContainText('Force submit an empty attempt?');
  await forceDialog.getByRole('button', { name: 'Submit with no answers' }).click();

  // The tile flips to Submitted and the server closed the attempt with the flag.
  await expect(
    page
      .locator('[data-slot="live-student-card"]')
      .filter({ hasText: STUDENT_EMAIL })
      .first(),
  ).toContainText('Submitted', { timeout: 20_000 });
});
