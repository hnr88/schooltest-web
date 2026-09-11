import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { createTranslator } from 'next-intl';

import enMessages from '@/i18n/messages/en.json';
import { testSessionBookingSchema } from '@/modules/teacher/schemas/teacher-session.schema';
import type { TestSessionBooking } from '@/modules/teacher/types/teacher-session.types';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';

import { runSql } from '../helpers/auth-db';
import { apiLoginRetried } from '../helpers/ops34-api-retry';
import { API_BASE } from '../helpers/teacher-auth-rail';
import {
  freeStudents,
  schoolTimezone,
  wallDate,
  whenLabel,
  zonedIso,
} from '../helpers/teacher-live-sessions';
import {
  closeSession,
  readClasses,
  readSessions,
  readTests,
} from '../helpers/teacher-past-sessions-api';
import { signIn } from '../helpers/teacher-rail';

// S12 — the Live sessions page's "N sessions scheduled" cards (Teacher Portal
// v2.dc.html:267–287) on the REAL bookings API (chunk B1b): two real bookings on
// t2's class tomorrow; Cancel (C-TS-6) and Start now (C-TS-7) go through the page.

const PROOFS = path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'teacher-v2');
const DAY_MS = 86_400_000;
const t = createTranslator({ locale: 'en', messages: enMessages, namespace: 'TeacherPortal.liveSessions' });

test.describe.configure({ mode: 'serial' });

let request: APIRequestContext;
let page: Page;
let jwt = '';
let klass: DashboardClass;
let toCancel: TestSessionBooking;
let toStart: TestSessionBooking;
const created: string[] = [];

const cardOf = (booking: TestSessionBooking) =>
  page.locator(`[data-slot="scheduled-session-card"][data-sitting-id="${booking.sitting_document_id}"]`);
const rowOf = async (booking: TestSessionBooking) =>
  (await readSessions(request, jwt)).find((row) => row.sitting_document_id === booking.sitting_document_id);

async function book(formId: string, date: string, opens: string, closes: string, tz: string) {
  const members = freeStudents(klass.class_document_id).slice(0, 2);
  expect(members, 'two free students for the booking').toHaveLength(2);
  const response = await request.post(`${API_BASE}/api/teacher/test-sessions`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: {
      class_document_id: klass.class_document_id,
      form_document_id: formId,
      student_document_ids: members,
      window: { opens_at: zonedIso(date, opens, tz), closes_at: zonedIso(date, closes, tz) },
    },
  });
  expect(response.status(), 'POST /api/teacher/test-sessions with a window').toBe(201);
  const booking = testSessionBookingSchema.parse(await response.json());
  created.push(booking.sitting_document_id);
  return booking;
}

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(180_000);
  mkdirSync(PROOFS, { recursive: true });
  request = await playwright.request.newContext();
  jwt = await apiLoginRetried(request, 'teacher');
  const [classes, tests] = await Promise.all([readClasses(request, jwt), readTests(request, jwt)]);
  const [first] = classes;
  const [form] = tests;
  if (first === undefined || form === undefined) throw new Error('t2 owns no class or no test');
  klass = first;
  const tz = schoolTimezone(klass.class_document_id);
  const tomorrow = wallDate(Date.now() + DAY_MS, tz);
  toCancel = await book(form.form_document_id, tomorrow, '09:00', '10:00', tz);
  toStart = await book(form.form_document_id, tomorrow, '11:00', '12:00', tz);
  page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await signIn(page, 'teacher');
});

test.afterAll(async () => {
  for (const id of created) {
    const [status, phase] = runSql(
      `select status, coalesce(phase, '') from sittings where document_id = '${id}'`,
    ).split('|');
    if (status !== 'open') continue;
    if (phase === 'scheduled') {
      await request.post(`${API_BASE}/api/teacher/test-sessions/${id}/cancel`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
    } else {
      await closeSession(request, jwt, id);
    }
  }
  await page?.context().close();
  await request.dispose();
});

test('each booking is a card: class, Scheduled chip, the window in the school zone, form, members', async () => {
  test.setTimeout(120_000);
  await page.goto('/dashboard/test-sessions');
  await expect(page.locator('[data-surface="teacher-test-sessions"]')).toHaveAttribute('data-status', 'ready', {
    timeout: 60_000,
  });
  for (const booking of [toCancel, toStart]) {
    const card = cardOf(booking);
    await expect(card.locator('h3')).toHaveText(klass.name);
    await expect(card).toContainText(t('chipScheduled'));
    await expect(card.locator('[data-slot="scheduled-session-when"]')).toHaveText(t('when', whenLabel(booking.window)));
    await expect(card).toContainText(booking.form.label);
    await expect(card).toContainText(t('bookingWhoSelected', { count: 2, className: klass.name }));
  }
  const count = await page.locator('[data-slot="scheduled-session-card"]').count();
  await expect(page.locator('#live-sessions-scheduled')).toHaveText(t('scheduledLabel', { count }));
  await page.screenshot({ path: path.join(PROOFS, 'live-sessions-scheduled.png') });
});

test('Cancel asks first; the API then reports the booking cancelled and the card is gone', async () => {
  const when = whenLabel(toCancel.window);
  await cardOf(toCancel).getByRole('button', { name: t('cancelBooking'), exact: true }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText(t('cancelConfirm.title'));
  await expect(dialog).toContainText(
    t('cancelConfirm.body', { className: klass.name, date: when.date, start: when.start }),
  );
  await dialog.getByRole('button', { name: t('cancelConfirm.cta'), exact: true }).click();
  await expect(cardOf(toCancel)).toHaveCount(0, { timeout: 30_000 });
  expect(await rowOf(toCancel)).toMatchObject({ status: 'closed', phase: 'cancelled' });
});

test('Start now asks first; the API then runs it with a code and the page opens its Live tab', async () => {
  const when = whenLabel(toStart.window);
  await cardOf(toStart).getByRole('button', { name: t('startNow'), exact: true }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText(t('startConfirm.body', { date: when.date, start: when.start }));
  await dialog.getByRole('button', { name: t('startConfirm.cta'), exact: true }).click();
  await page.waitForURL(
    (url) =>
      url.pathname.endsWith(`/dashboard/results/${klass.class_document_id}`) &&
      url.searchParams.get('tab') === 'live' &&
      url.searchParams.get('session') === toStart.sitting_document_id,
    { timeout: 60_000 },
  );
  const started = await rowOf(toStart);
  expect(started).toMatchObject({ status: 'open', phase: 'running' });
  expect(started?.code).toBeTruthy();
});
