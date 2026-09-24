import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page, type Response } from '@playwright/test';
import { createTranslator } from 'next-intl';

import enMessages from '@/i18n/messages/en.json';
import { createDemoLinkResponseSchema } from '@/modules/teacher/schemas/teacher-demo-link.schema';

import { bridgeApiCors } from '../helpers/api-cors-bridge';
import { runSql, sha256 } from '../helpers/auth-db';
import { cat } from '../helpers/i18n';
import { ACCOUNTS, en, signIn } from '../helpers/teacher-rail';

// BUG-004 — the Teacher demo journey on the REAL API, end to end: mint, the "Your demo
// link is ready" dialog, Copy, "Open in SchoolTest app" (the schooltest:// deep link the
// installed desktop app registers), and the trial runner that link lands on serving a
// question. A browser cannot hand a schooltest:// link to an app, so this spec opens the
// renderer route the desktop app's deep-link handler maps it to (useDeepLinkHandler:
// schooltest://auth/teacher/verify?token=… → /en/auth/teacher/verify?token=…); the
// Electron journey itself is proven with the real app (proof/BUG-004/desktop-demo). The teacher then ANSWERS a question and ENDS the trial, and
// the DB proves the demo recorded nothing against a student: no Result, no sitting,
// no student session, and the stored answer belongs to the teacher's trial only.
// The one intercepted case is the refused mint, where the budget cannot be spent on
// purpose without locking the seeded teacher out for an hour.
//
// NEEDS, besides the API and this web app:
//  - the STUDENT-APP RENDERER (schooltest-app `next dev`, :3010 locally, or
//    E2E_STUDENT_RENDERER), the renderer the desktop app loads. The spec checks it
//    answers before opening the demo and fails naming it if not.
//  - demo-link budget: a mint spends one of TEACHER_DEMO_LINK_MAX_PER_HOUR = 10 magic-link
//    rows per teacher email per hour, shared with the emailed trial path. When the budget
//    is spent the API answers 429 and this test is SKIPPED with that reason (never a silent
//    pass). Point E2E_TEACHER_EMAIL at another seeded teacher to run it inside the hour.
// LEAVES NO TRIAL IN PROGRESS: the journey ends its trial from the runner, and afterEach
// ends any trial it opened that is still in_progress (a failed run included) through
// C-TT-END as the demo's own teacher — a trial left running is what the next demo link
// would be offered.
const PROOFS = process.env.E2E_PROOF_DIR ?? path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'teacher-v2');
const FOLLOWUP_PROOFS = path.join(process.env.BUG_PROOF_DIR ?? '/Users/hunor.nagy/Desktop/live_feedback_1/proof', 'BUG-004');
const startSession = (key: string) => cat(en, `TeacherPortal.startSession.${key}`);
const demoLimit = createTranslator({ locale: 'en', messages: enMessages, namespace: 'TeacherPortal.startSession.demoLimit' });
const DOCUMENT_ID = /^[a-z0-9]{24}$/;
const STUDENT_RENDERER = process.env.E2E_STUDENT_RENDERER ?? 'http://localhost:3010';
const DEEP_LINK = /^schooltest:\/\/auth\/teacher\/verify\?token=([0-9a-f]{64})$/;
const RATE_LIMITED = {
  data: null,
  error: { status: 429, name: 'RateLimitError', message: 'Too many requests', details: { retry_after_seconds: 1500 } },
};
// The student-app renderer's own en catalog (schooltest-app), which this repo cannot import:
// ReadingRunner.next / nextPassage / finishSection, ReadingRunner.correct,
// TeacherTrial.runner.endLabel / endConfirm, TeacherTrial.complete.title.
const RUNNER = {
  advance: /^(Next question|Next passage|Finish section)$/,
  correct: 'Correct',
  endLabel: 'End the trial',
  endConfirm: 'End trial',
  complete: 'Trial complete',
};

const isPost = (pathname: string) => (response: Response) =>
  response.request().method() === 'POST' && new URL(response.url()).pathname === pathname;

async function openDemoMode(page: Page) {
  await signIn(page, 'teacher');
  await page.waitForURL('**/dashboard/results');
  await page.locator('[data-slot="start-session-button"]').click();
  const modal = page.locator('[data-surface="start-session-modal"]');
  await expect(modal.getByRole('heading', { name: startSession('title') })).toBeVisible({ timeout: 30_000 });
  await modal.locator('[data-slot="start-choice"][data-value="demo"]').click();
  await expect(modal.getByRole('heading', { name: startSession('titleDemo') })).toBeVisible();
  return modal;
}

const count = (sql: string) => Number(runSql(sql));
// The API stamps magic-link rows in ITS local wall clock (toLocalNaiveTimestamp) and
// counts its hourly window the same way; this machine's clock stands in for it.
const localNaive = (ms: number) => {
  const at = new Date(ms);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())} ${pad(at.getHours())}:${pad(at.getMinutes())}:${pad(at.getSeconds())}`;
};
const maxId = (table: string) => count(`select coalesce(max(id), 0) from ${table}`);

/** Answer the painted item with its first option (correctness is irrelevant) and advance. */
async function answerOneQuestion(demo: Page): Promise<Response> {
  // The runner stamps presented_at on first paint; a pick before that is a correct server 400.
  await demo.waitForTimeout(700);
  const checkboxes = demo.getByRole('checkbox');
  const radios = demo.getByRole('radio');
  if ((await checkboxes.count()) > 0) await checkboxes.first().click({ force: true });
  else if ((await radios.count()) > 0) await radios.first().click({ force: true });
  else {
    const rows = demo.getByRole('button', { name: RUNNER.correct, exact: true });
    for (let index = 0; index < (await rows.count()); index += 1) await rows.nth(index).click({ force: true });
  }
  const advance = demo.getByRole('button', { name: RUNNER.advance });
  await expect(advance).toBeEnabled();
  const [response] = await Promise.all([
    demo.waitForResponse((r) => /\/api\/sessions\/[^/]+\/responses$/.test(r.url()) && r.request().method() === 'POST', {
      timeout: 30_000,
    }),
    advance.click(),
  ]);
  return response;
}

// What afterEach needs to end the trials a run opened: the API the demo tab talked to, the
// teacher jwt the verify minted for it, and every trial document id the run was handed.
const opened = { api: '', jwt: '', sessions: new Set<string>() };

test.use({ viewport: { width: 1440, height: 900 } });
test.beforeEach(async ({ context }) => bridgeApiCors(context));
test.afterEach(async ({ request }) => {
  for (const id of opened.sessions) {
    if (runSql(`select status from sessions where document_id = '${id}'`) !== 'in_progress') continue;
    const ended = await request.post(`${opened.api}/api/teacher/trial/${id}/end`, {
      headers: { Authorization: `Bearer ${opened.jwt}` },
    });
    expect(ended.status(), `ending trial ${id}, left in progress by this run: ${await ended.text()}`).toBe(200);
  }
  expect(
    [...opened.sessions].filter((id) => runSql(`select status from sessions where document_id = '${id}'`) === 'in_progress'),
    'no trial this run opened is left in progress',
  ).toEqual([]);
  opened.sessions.clear();
});

test('BUG-004 — Teacher demo mints a link, Open starts the trial in a new tab, nothing is recorded', async ({
  page,
  context,
  request,
}) => {
  test.setTimeout(240_000);
  mkdirSync(PROOFS, { recursive: true });
  mkdirSync(FOLLOWUP_PROOFS, { recursive: true });
  const modal = await openDemoMode(page);

  const lastTest = modal.getByRole('radiogroup').last().locator('[data-slot="start-choice"]').last();
  await expect(lastTest).toBeVisible();
  const formId = await lastTest.getAttribute('data-value');
  await lastTest.click();

  // Watermarks: every row the demo could write has a larger id than these.
  const before = {
    sessions: maxId('sessions'),
    sittings: maxId('sittings'),
    responses: maxId('responses'),
  };

  const minted = page.waitForResponse(isPost('/api/teacher/demo-link'), { timeout: 60_000 });
  await modal.locator('[data-slot="start-session-cta"]').click();
  const mintResponse = await minted;
  if (mintResponse.status() === 429) {
    const email = ACCOUNTS.teacher.email;
    const lastHour = runSql(
      `select count(*) || ' link(s), oldest ' || coalesce(min(created_at)::text, '-') from teacher_magic_links
        where lower(email) = lower('${email}') and created_at >= '${localNaive(Date.now() - 3_600_000)}'`,
    );
    test.skip(
      true,
      `demo-link budget spent for ${email}: POST /api/teacher/demo-link answered 429 ` +
        `(${await mintResponse.text()}); DB shows ${lastHour} in the last hour. ` +
        'Re-run after the oldest row is an hour old, or set E2E_TEACHER_EMAIL to another seeded teacher.',
    );
  }
  expect(mintResponse.status(), await mintResponse.text()).toBe(201);
  const link = createDemoLinkResponseSchema.parse(await mintResponse.json());
  expect(link.form_document_id).toBe(formId);
  const token = DEEP_LINK.exec(link.url)?.[1] ?? '';
  expect(link.url, 'the demo link is the desktop deep link').toMatch(DEEP_LINK);

  const dialog = page.locator('[data-surface="demo-link-dialog"]');
  await expect(dialog.getByRole('heading', { name: startSession('demoLink.title') })).toBeVisible({ timeout: 30_000 });
  await expect(dialog.locator('[data-slot="demo-link-url"]')).toHaveText(link.url);
  await expect(dialog.locator('[data-slot="demo-link-app-hint"]')).toHaveText(startSession('demoLink.appHint'));
  const open = dialog.locator('[data-slot="demo-link-open"]');
  await expect(open).toHaveText(startSession('demoLink.open'));
  await expect(open).toHaveAttribute('href', link.url);
  await expect(open).not.toHaveAttribute('target', /.+/);

  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await dialog.locator('[data-slot="demo-link-copy"]').click();
  await expect(dialog.locator('[data-slot="demo-link-copy"]')).toHaveText(startSession('demoLink.copied'));
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link.url);
  await page.screenshot({ path: path.join(PROOFS, 'after-01-demo-dialog-copied.png'), animations: 'disabled' });

  const renderer = STUDENT_RENDERER;
  const rendererUp = await request.get(renderer, { maxRedirects: 0, timeout: 15_000 }).then(
    (answer) => answer.status() < 500,
    () => false,
  );
  expect(
    rendererUp,
    `the demo runs on the student-app renderer at ${renderer} (E2E_STUDENT_RENDERER); start it`,
  ).toBe(true);

  const verified = context.waitForEvent('response', {
    predicate: isPost('/api/auth/teacher/magic-link/verify'),
    timeout: 90_000,
  });
  const trialStarts: Response[] = [];
  context.on('response', (response) => {
    if (!isPost('/api/teacher/trial')(response)) return;
    trialStarts.push(response);
    void response
      .json()
      .then((body: { session?: { document_id?: string } }) => body.session?.document_id && opened.sessions.add(body.session.document_id))
      .catch(() => undefined);
  });
  // What the desktop app does with the deep link: its route on the renderer.
  const demo = await context.newPage();
  await demo.goto(`${renderer}/en/auth/teacher/verify?token=${token}`);

  const verify = await verified;
  expect(verify.status()).toBe(200);
  const offer = (await verify.json()) as {
    jwt: string;
    trial: { form_document_id: string; session_document_id: string | null } | null;
  };
  Object.assign(opened, { api: new URL(verify.url()).origin, jwt: offer.jwt });
  if (offer.trial?.session_document_id) opened.sessions.add(offer.trial.session_document_id);
  expect(offer.trial?.form_document_id).toBe(formId);

  await expect(demo.getByText(/Question \d+ of [1-9]\d*/)).toBeVisible({ timeout: 90_000 });
  await demo.screenshot({ path: path.join(PROOFS, 'after-02-demo-tab-first-question.png'), animations: 'disabled' });

  // A fresh trial is started by C-TT-START; a trial already running on this form is resumed.
  let sessionDocumentId = offer.trial?.session_document_id ?? null;
  if (sessionDocumentId === null) {
    expect(trialStarts).toHaveLength(1);
    expect(trialStarts[0].status()).toBe(201);
    sessionDocumentId = ((await trialStarts[0].json()) as { session: { document_id: string } }).session.document_id;
  }
  expect(sessionDocumentId).toMatch(DOCUMENT_ID);

  // The teacher answers a question in the demo tab: the answer really reaches the server.
  const answered = await answerOneQuestion(demo);
  expect(answered.status(), await answered.text()).toBe(200);
  expect(new URL(answered.url()).pathname).toBe(`/api/sessions/${sessionDocumentId}/responses`);
  await demo.screenshot({ path: path.join(FOLLOWUP_PROOFS, 'followup-01-demo-question-answered.png'), animations: 'disabled' });

  // …and ends the trial from the runner: C-TT-END answers with no Result, by contract.
  const ended = demo.waitForResponse(
    (r) => new URL(r.url()).pathname === `/api/teacher/trial/${sessionDocumentId}/end` && r.request().method() === 'POST',
  );
  await demo.getByRole('button', { name: RUNNER.endLabel }).click();
  await demo.getByRole('button', { name: RUNNER.endConfirm, exact: true }).click();
  const endResponse = await ended;
  expect(endResponse.status(), await endResponse.text()).toBe(200);
  expect(((await endResponse.json()) as { result_document_id: string | null }).result_document_id).toBeNull();
  await expect(demo.getByText(RUNNER.complete).first()).toBeVisible({ timeout: 60_000 });
  await demo.screenshot({ path: path.join(FOLLOWUP_PROOFS, 'followup-02-demo-trial-ended.png'), animations: 'disabled' });

  // THE DB: what the demo wrote, and what it did not.
  const session = `(select id from sessions where document_id = '${sessionDocumentId}')`;
  expect(runSql(`select trial::text || '|' || coalesce(student_document_id, '-') || '|' || status from sessions where document_id = '${sessionDocumentId}'`)).toBe(
    'true|-|complete',
  );
  expect(count(`select count(*) from sessions_student_lnk where session_id = ${session}`), 'the trial has no student').toBe(0);
  expect(
    runSql(
      `select u.email from sessions_trial_teacher_lnk l join up_users u on u.id = l.user_id where l.session_id = ${session}`,
    ),
    'the trial is bound to the teacher who minted the link',
  ).toBe(ACCOUNTS.teacher.email);
  const storedAnswers = count(
    `select count(*) from responses_session_lnk where session_id = ${session} and response_id > ${before.responses}`,
  );
  expect(storedAnswers, 'the answer is stored against the TRIAL session').toBeGreaterThanOrEqual(1);
  expect(
    count(
      `select count(*) from responses_student_lnk rs join responses_session_lnk rl on rl.response_id = rs.response_id
        where rl.session_id = ${session}`,
    ),
    'no answer of the demo is stored against a student',
  ).toBe(0);
  expect(count(`select count(*) from results_session_lnk where session_id = ${session}`), 'no Result for the trial').toBe(0);
  expect(count(`select count(*) from sittings_sessions_lnk where session_id = ${session}`), 'the trial sits in no sitting').toBe(0);
  expect(
    count(
      `select count(*) from sittings_teacher_lnk l join up_users u on u.id = l.user_id
        where lower(u.email) = lower('${ACCOUNTS.teacher.email}') and l.sitting_id > ${before.sittings}`,
    ),
    'the demo opened no sitting for this teacher',
  ).toBe(0);
  expect(
    count(
      `select count(*) from sessions s join sessions_student_lnk st on st.session_id = s.id
         join sessions_form_lnk f on f.session_id = s.id join forms fm on fm.id = f.form_id
        where s.id > ${before.sessions} and fm.document_id = '${formId}'`,
    ),
    'no STUDENT session was created on the demo form',
  ).toBe(0);

  const tokenHash = sha256(token);
  const tokenRow = runSql(
    `select used::text || '|' || coalesce(demo_form_document_id, '') from teacher_magic_links
      where token = '${tokenHash}'`,
  );
  expect(tokenRow).toBe(`true|${formId}`);
  await demo.close();
});

test('BUG-004 — a spent demo budget says so in the modal, with the wait the API names', async ({ page }) => {
  test.setTimeout(120_000);
  mkdirSync(PROOFS, { recursive: true });
  const modal = await openDemoMode(page);
  await page.route('**/api/teacher/demo-link', (route) =>
    route.fulfill({
      status: 429,
      contentType: 'application/json',
      headers: {
        'access-control-allow-origin': route.request().headers()['origin'] ?? '*',
        'access-control-allow-credentials': 'true',
      },
      body: JSON.stringify(RATE_LIMITED),
    }),
  );

  await modal.locator('[data-slot="start-session-cta"]').click();
  const alert = modal.locator('[data-slot="start-session-error"]');
  await expect(alert).toHaveText(demoLimit('retryIn', { minutes: 25 }));
  await expect(alert).not.toHaveText(RATE_LIMITED.error.message);
  await expect(alert).toHaveAttribute('role', 'alert');
  await expect(page.locator('[data-surface="demo-link-dialog"]')).toHaveCount(0);
  await expect(modal).toBeVisible();
  await page.screenshot({ path: path.join(PROOFS, 'after-03-refused-mint-message.png'), animations: 'disabled' });
});
