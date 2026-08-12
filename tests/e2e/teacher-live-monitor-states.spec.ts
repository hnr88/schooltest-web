import path from 'node:path';

import { expect, test } from '@playwright/test';

import type { MonitorState } from '@/modules/teacher/types/teacher.types';

import { cat } from './helpers/i18n';
import { apiLogin } from './helpers/teacher-auth-rail';
import { plural } from './helpers/teacher-dashboard-live';
import { findSittingsCovering, readMonitor } from './helpers/teacher-live-monitor-api';
import {
  answerFirstItem,
  joinAsStudent,
  rosterEmails,
  type JoinedStudent,
} from './helpers/teacher-live-monitor-join';
import {
  configFingerprint,
  expectDistinctPaints,
  expectInProgressRows,
  expectStallRestored,
  expectStateGrid,
  expectSubmittedRows,
  expectTileText,
  idleSeconds,
  openMonitor,
  readStallThreshold,
  stallCaption,
  tileOf,
  untouchedSummary,
  waitForIdleSeconds,
  waitForState,
  writeStallThreshold,
} from './helpers/teacher-monitor';
import {
  closeSession,
  createSession,
  readClasses,
  readSessions,
  readTests,
} from './helpers/teacher-past-sessions-api';
import { DESKTOP, en, signIn } from './helpers/teacher-rail';
import { rosterSize } from './helpers/teacher-test-sessions-flow';

// Task 053 — brief flows 9-12: every state of the REAL C-TS-3 grid, DRIVEN rather
// than stumbled upon. This spec opens its own sitting (C-TS-1), lets a roster
// student really join it (C-SJ-1) and really answer an item (C-2), and for flow 12
// lowers the GLOBAL `Config.stall_threshold_minutes` so a genuinely idle student
// crosses the line — then RESTORES it and proves the restore, because a sibling lane
// reads this database. Every state is asserted as TEXT as well as colour (tint alone
// fails WCAG 2.2 AA 1.4.1 and is untrustworthy) and the cut is never a literal.

const SHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots');
const LIVE = 'Teacher.testSessions.live';
const LOW_CUT = 1; // the lowest cut the server accepts — it refuses a non-positive one (CT-8)

let jwt = '';
let sittingId = '';
let classId = '';
let student: JoinedStudent | null = null;
let originalStall = 0;
let fingerprintBefore = '';
const paints: Partial<Record<MonitorState, string>> = {};

test.beforeAll(async ({ request }) => {
  jwt = await apiLogin(request, 'teacher');
  originalStall = readStallThreshold();
  fingerprintBefore = configFingerprint();
  const classes = await readClasses(request, jwt);
  const testA = (await readTests(request, jwt)).find((entry) => entry.variant === 'A');
  expect(classes[0], 'the teacher owns no class').toBeTruthy();
  expect(testA, 'C-TD-2 offers no Test A form').toBeTruthy();
  classId = classes[0].class_document_id;
  sittingId = await createSession(request, jwt, classId, testA?.form_document_id ?? '');
});

test.afterAll(async ({ request }) => {
  // The cut goes back even if a flow threw inside the lowered window; the sitting
  // this spec opened is closed through the real C-TS-4.
  if (originalStall > 0 && readStallThreshold() !== originalStall) {
    expect(writeStallThreshold(originalStall)).toBe(originalStall);
  }
  if (jwt && sittingId) await closeSession(request, jwt, sittingId);
});

test('flow 9 — unjoined tiles are grey, unfilled, and say "Not joined"', async ({
  page,
  request,
}) => {
  const wire = await readMonitor(request, jwt, sittingId);
  expect(wire.stall_threshold_minutes, 'the payload must echo the Config row').toBe(originalStall);
  expect(wire.summary).toEqual(untouchedSummary(rosterSize(classId)));
  expect(wire.students.map((row) => row.state)).toEqual(wire.students.map(() => 'not_joined'));

  await page.setViewportSize(DESKTOP);
  await signIn(page, 'teacher');
  await openMonitor(page, sittingId);
  await expect(page.locator('[data-slot="live-monitor-tile"]')).toHaveCount(wire.students.length);
  paints.not_joined = await expectStateGrid(page, wire.students, 'not_joined');
  await page.screenshot({ path: path.join(SHOTS, '053-flow9-not-joined.png'), fullPage: true });
});

test('flow 10 — an in-progress tile is blue and prints "Stage X of 3"', async ({
  page,
  request,
}) => {
  const opened = await readMonitor(request, jwt, sittingId);
  const emails = rosterEmails(classId);
  expect(emails.length, 'the class roster has no emails to join with').toBeGreaterThan(0);
  expect(opened.sitting.code, 'C-TS-1 minted no join code').toBeTruthy();
  student = await joinAsStudent(request, jwt, opened.sitting.code ?? '', emails[0]);
  await answerFirstItem(request, student);

  const wire = await readMonitor(request, jwt, sittingId);
  const mine = tileOf(wire, student.studentDocumentId);
  expect(mine.state, 'a student who really answered must be in_progress').toBe('in_progress');
  expect(mine.total_stages, 'flow 10 says "of 3" — the plan must hold three stages').toBe(3);
  expect(mine.stage, 'the first answer lands in stage 1').toBe(1);
  expect(wire.summary).toMatchObject({ in_progress: 1, joined: 0, stalled: 0 });
  expectInProgressRows(student.sessionDocumentId, mine.stage);

  await page.setViewportSize(DESKTOP);
  await signIn(page, 'teacher');
  await openMonitor(page, sittingId);
  paints.in_progress = await expectStateGrid(page, wire.students, 'in_progress');
  await page.screenshot({ path: path.join(SHOTS, '053-flow10-in-progress.png'), fullPage: true });

  // Persistence: the state is the server's, so a full reload re-paints it.
  await page.reload();
  await openMonitor(page, sittingId);
  const second = await readMonitor(request, jwt, sittingId);
  await expectTileText(page, tileOf(second, mine.student_document_id));
});

test('flow 11 — submitted tiles are green and say "Submitted"', async ({ page, request }) => {
  const sessions = await readSessions(request, jwt);
  const scan = await findSittingsCovering(request, jwt, sessions, ['submitted']);
  const found = scan.covering.get('submitted');
  if (!found) throw new Error('no sitting of this teacher carries a submitted student');
  const wire = await readMonitor(request, jwt, found.sitting.document_id);
  const submitted = wire.students.filter((row) => row.state === 'submitted');
  expect(submitted.length, 'summary.submitted must tally the tiles').toBe(wire.summary.submitted);
  // Postgres proof: the contract admits `complete`, or `terminated` with a Result.
  expectSubmittedRows(wire.sitting.document_id, submitted);

  await page.setViewportSize(DESKTOP);
  await signIn(page, 'teacher');
  await openMonitor(page, wire.sitting.document_id);
  paints.submitted = await expectStateGrid(page, wire.students, 'submitted');
  await page.screenshot({ path: path.join(SHOTS, '053-flow11-submitted.png'), fullPage: true });
});

test('flow 12 — the idle student turns amber with the inactivity duration', async ({
  page,
  request,
}) => {
  test.setTimeout(300_000);
  if (!student) throw new Error('flow 10 left no joined student to idle');
  const { sessionDocumentId: session, studentDocumentId: id } = student;

  // REAL idleness first, with the cut still at its shipped value: nothing here
  // backdates a row, so the student has to actually sit still.
  const aged = await waitForIdleSeconds(session, LOW_CUT * 60 + 12);
  const before = tileOf(await readMonitor(request, jwt, sittingId), id);
  expect(before.state, 'still under the shipped cut, so not amber yet').toBe('in_progress');

  expect(writeStallThreshold(LOW_CUT)).toBe(LOW_CUT);
  const wire = await waitForState(request, jwt, sittingId, id, 'stalled');
  const mine = tileOf(wire, id);
  expect(wire.stall_threshold_minutes, 'the cut on the wire IS the Config row').toBe(LOW_CUT);
  expect(mine.inactive_minutes, 'the amber tile must carry the inactivity duration').toBe(
    Math.floor(aged / 60),
  );
  expect(wire.summary).toMatchObject({ stalled: 1, in_progress: 0 });

  await page.setViewportSize(DESKTOP);
  await signIn(page, 'teacher');
  await openMonitor(page, sittingId);
  paints.stalled = await expectStateGrid(page, wire.students, 'stalled');
  await expect(stallCaption(page)).toHaveText(plural(cat(en, `${LIVE}.stallCaption`), LOW_CUT));
  await page.screenshot({ path: path.join(SHOTS, '053-flow12-stalled.png'), fullPage: true });

  // RESTORE, and prove it: the row, the wire, the tile and the caption all go back.
  const restored = await expectStallRestored(
    request,
    jwt,
    sittingId,
    id,
    originalStall,
    fingerprintBefore,
  );
  await page.reload();
  await openMonitor(page, sittingId);
  await expectTileText(page, tileOf(restored, id));
  await expect(stallCaption(page)).toHaveText(
    plural(cat(en, `${LIVE}.stallCaption`), originalStall),
  );
  expect(idleSeconds(session), 'the student stayed idle throughout').toBeGreaterThan(aged - 5);
  expectDistinctPaints(paints);
});
