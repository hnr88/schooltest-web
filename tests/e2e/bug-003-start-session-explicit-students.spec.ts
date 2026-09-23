import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page, type Request } from '@playwright/test';
import { createTranslator } from 'next-intl';

import enMessages from '@/i18n/messages/en.json';
import { createTestSessionResponseSchema, createTestSessionResultSchema } from '@/modules/teacher/schemas/teacher-session.schema';

import { bridgeApiCors } from './helpers/api-cors-bridge';
import { roleCredentials } from './helpers/credentials';
import { loginAs } from './helpers/roles';
import { API_BASE } from './helpers/teacher-auth-rail';
import { readMonitor } from './helpers/teacher-live-monitor-api';
import { readTests } from './helpers/teacher-past-sessions-api';
import { openSittingsOf, releaseSitting, scheduledSittingsOf } from './helpers/teacher-start-session-api';
import { choice, modal, modalTab, waitForModalData } from './helpers/teacher-start-session-modal';

// BUG-003 — "Who sits it" is always an explicit pick: no Whole class card, the roster
// is on screen at once, Start stays disabled until someone is ticked, and every write
// names its students — Select all included. Real API, real UI; the request is only
// OBSERVED. What this creates is closed or cancelled through the UI before it ends.
const t = createTranslator({ locale: 'en', messages: enMessages, namespace: 'TeacherPortal.startSession' });
const tLive = createTranslator({ locale: 'en', messages: enMessages, namespace: 'TeacherPortal.liveSessions' });
const PROOF = path.join(process.env.E2E_PROOF_DIR ?? path.resolve('tests/e2e/proofs'), 'BUG-003');
const CREATE = '/api/teacher/test-sessions';

const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(PROOF, `${name}.png`), animations: 'disabled' });
const isCreate = (request: Request) => request.method() === 'POST' && new URL(request.url()).pathname === CREATE;
const freeRows = (page: Page) => modal(page).locator('[data-slot="start-session-student"]:not([data-blocked])');

async function teacherJwt(request: APIRequestContext): Promise<string> {
  const { email, password } = roleCredentials('teacher');
  const response = await request.post(`${API_BASE}/api/auth/local`, { data: { identifier: email, password } });
  expect(response.status(), 'POST /api/auth/local').toBe(200);
  return ((await response.json()) as { jwt: string }).jwt;
}

async function openModal(page: Page): Promise<string> {
  await page.goto('/dashboard/results');
  await page.locator('[data-slot="start-session-button"]').first().click();
  await expect(modal(page).getByRole('heading', { name: t('title') })).toBeVisible({ timeout: 60_000 });
  await waitForModalData(page);
  return modal(page).locator('[data-slot="start-session-class"]').inputValue();
}

test.use({ viewport: { width: 1440, height: 900 } });
test.beforeAll(() => mkdirSync(PROOF, { recursive: true }));
test.beforeEach(async ({ context }) => bridgeApiCors(context));

test('BUG-003 — the roster is the only way to say who sits it, and every write names its students', async ({
  page,
  request,
}) => {
  test.setTimeout(300_000);
  const jwt = await teacherJwt(request);
  const tests = await readTests(request, jwt);
  const testA = tests.find((entry) => entry.variant === 'A');
  const testB = tests.find((entry) => entry.variant === 'B');
  if (!testA || !testB) throw new Error('C-TD-2 must offer both Test A and Test B');
  const posts: Request[] = [];
  page.on('request', (request) => {
    if (isCreate(request)) posts.push(request);
  });
  const leftovers: { id: string; action: 'close' | 'cancel' }[] = [];

  try {
    await loginAs(page, 'teacher');
    const classId = await openModal(page);
    const dialog = modal(page);
    const cta = dialog.locator('[data-slot="start-session-cta"]');

    // Test B for the start-now sitting.
    await choice(dialog, testB.form_document_id).click();
    await expect(choice(dialog, testB.form_document_id)).toHaveAttribute('data-checked', '');

    await modalTab(dialog, 'students').click();
    const students = dialog.locator('[data-slot="start-session-students"]');
    await expect(dialog.locator('[data-slot="start-session-roster"]')).toBeVisible();
    await expect(students.locator('[role="radiogroup"]')).toHaveCount(0);
    await expect(students.locator('[data-slot="start-choice"]')).toHaveCount(0);
    await expect(dialog.getByText('Whole class', { exact: false })).toHaveCount(0);
    await expect(dialog.locator('[data-slot="start-session-roster"]')).toContainText(t('students.pickNone'));
    await expect(modalTab(dialog, 'students')).toContainText(t('tabs.studentsSelected', { count: 0 }));
    await expect(cta).toHaveText(t('cta.selectToStart'));
    await expect(cta).toHaveAttribute('aria-disabled', 'true');
    await cta.click({ force: true });
    await expect.poll(() => posts.length, { timeout: 3_000 }).toBe(0);
    await shot(page, '01-roster-visible-start-disabled');

    const picked = [
      (await freeRows(page).nth(0).getAttribute('data-student-id')) ?? '',
      (await freeRows(page).nth(1).getAttribute('data-student-id')) ?? '',
    ];
    for (const index of [0, 1]) await freeRows(page).nth(index).click();
    await expect(cta).toHaveText(t('cta.start', { count: 2 }));
    await shot(page, '02-two-students-picked');

    const sent = page.waitForRequest(isCreate);
    const answered = page.waitForResponse((response) => isCreate(response.request()));
    await cta.click();
    const body = (await sent).postDataJSON() as Record<string, unknown>;
    expect(body.student_document_ids).toEqual(picked);
    expect(body.form_document_id).toBe(testB.form_document_id);
    expect(body.start).toBe(true);
    const response = await answered;
    expect(response.status(), await response.text()).toBe(201);
    const startedId = createTestSessionResponseSchema.parse(await response.json()).sitting_document_id;
    leftovers.push({ id: startedId, action: 'close' });

    const row = (await openSittingsOf(request, jwt, classId)).find((entry) => entry.sitting_document_id === startedId);
    expect([...(row?.member_student_ids ?? [])].sort()).toEqual([...picked].sort());
    expect(row?.form?.document_id).toBe(testB.form_document_id);
    expect(row?.form?.variant).toBe('B');
    const monitor = await readMonitor(request, jwt, startedId);
    expect(monitor.students.map((student) => student.student_document_id).sort()).toEqual([...picked].sort());
    await page.waitForURL((url) => url.searchParams.get('session') === startedId, { timeout: 60_000 });
    await shot(page, '03-started-live-tab');

    await page.goto('/dashboard/test-sessions');
    const liveCard = page.locator(`[data-slot="live-session-card"][data-sitting-id="${startedId}"]`);
    await expect(liveCard).toContainText(tLive('whoSelected', { count: 2 }), { timeout: 30_000 });
    await shot(page, '04-live-card-two-selected');
    await liveCard.getByRole('button', { name: tLive('close') }).click();
    await page.getByRole('button', { name: tLive('closeConfirm.cta') }).click();
    await expect(liveCard).toHaveCount(0, { timeout: 30_000 });
    expect((await openSittingsOf(request, jwt, classId)).some((entry) => entry.sitting_document_id === startedId)).toBe(false);
    leftovers.shift();

    // Schedule on Test A, everyone free via Select all — still an explicit list.
    await openModal(page);
    await choice(dialog, 'later').click();
    const date = new Date(Date.now() + 11 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    await dialog.locator('[data-field="date"]').fill(date);
    await dialog.locator('[data-field="opens"]').fill('09:00');
    await dialog.locator('[data-field="closes"]').fill('10:00');
    await choice(dialog, testA.form_document_id).click();
    await modalTab(dialog, 'students').click();
    await waitForModalData(page);
    await expect(cta).toHaveText(t('cta.selectToSchedule'));
    await dialog.locator('[data-slot="start-session-select-all"]').click();
    const everyone = await freeRows(page).evaluateAll((rows) => rows.map((row) => row.getAttribute('data-student-id')));
    expect(everyone.length).toBeGreaterThan(2);
    await expect(dialog.locator('[data-slot="start-session-select-all"]')).toBeDisabled();
    await expect(cta).toHaveText(t('cta.schedule', { count: everyone.length }));
    await shot(page, '05-select-all-schedule');

    const bookingSent = page.waitForRequest(isCreate);
    const bookingAnswered = page.waitForResponse((answer) => isCreate(answer.request()));
    await cta.click();
    const bookingBody = (await bookingSent).postDataJSON() as Record<string, unknown>;
    expect(bookingBody.student_document_ids).toEqual(everyone);
    expect(bookingBody.form_document_id).toBe(testA.form_document_id);
    expect(bookingBody).toHaveProperty('window');
    const booked = await bookingAnswered;
    expect(booked.status(), await booked.text()).toBe(201);
    const bookingId = createTestSessionResultSchema.parse(await booked.json()).sitting_document_id;
    leftovers.push({ id: bookingId, action: 'cancel' });

    const saved = (await scheduledSittingsOf(request, jwt, classId)).find((entry) => entry.sitting_document_id === bookingId);
    expect(saved?.member_student_ids).not.toBeNull();
    expect([...(saved?.member_student_ids ?? [])].sort()).toEqual([...everyone].sort());
    expect(saved?.form?.variant).toBe('A');

    await page.waitForURL('**/dashboard/test-sessions', { timeout: 60_000 });
    const bookingCard = page.locator(`[data-slot="scheduled-session-card"][data-sitting-id="${bookingId}"]`);
    await expect(bookingCard).toContainText(tLive('whoSelected', { count: everyone.length }), { timeout: 30_000 });
    await bookingCard.scrollIntoViewIfNeeded();
    await shot(page, '06-booking-card-explicit-members');
    await bookingCard.getByRole('button', { name: tLive('cancelBooking'), exact: true }).click();
    await page.getByRole('button', { name: tLive('cancelConfirm.cta') }).click();
    await expect(bookingCard).toHaveCount(0, { timeout: 30_000 });
    expect((await scheduledSittingsOf(request, jwt, classId)).some((entry) => entry.sitting_document_id === bookingId)).toBe(false);
    leftovers.shift();
    await shot(page, '07-cleaned-up');
  } finally {
    for (const leftover of leftovers) await releaseSitting(request, jwt, leftover.id, leftover.action);
  }
});
