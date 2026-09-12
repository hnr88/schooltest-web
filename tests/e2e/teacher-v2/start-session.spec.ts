import { mkdirSync } from 'node:fs';

import { expect, test } from '@playwright/test';
import { createTranslator } from 'next-intl';

import enMessages from '@/i18n/messages/en.json';
import {
  createTestSessionResponseSchema,
  createTestSessionResultSchema,
} from '@/modules/teacher/schemas/teacher-session.schema';

import { apiLogin } from '../helpers/teacher-auth-rail';
import { waitForDashboard } from '../helpers/teacher-class-detail';
import { readTests } from '../helpers/teacher-past-sessions-api';
import { signIn } from '../helpers/teacher-rail';
import {
  bookingWindowHm,
  bookingsDeployed,
  busyStudentIds,
  expectDesktopJoin,
  expectStartedSitting,
  lastSessionOpenedAt,
  releaseSitting,
} from '../helpers/teacher-start-session-api';
import {
  PROOFS,
  boxHeight,
  choice,
  isLiveTab,
  isSessionWrite,
  lastSessionText,
  modal,
  modalTab,
  openFromClasses,
  shot,
  waitForModalData,
} from '../helpers/teacher-start-session-modal';
import { watchErrors } from '../helpers/ui';

// S8 — the ONE "Start a new session" modal (design :1350–1625) end to end on the REAL API, no
// interception: Start now must make a sitting the desktop joins; all it creates is closed or cancelled.
const t = createTranslator({ locale: 'en', messages: enMessages, namespace: 'TeacherPortal.startSession' });
const tLive = createTranslator({ locale: 'en', messages: enMessages, namespace: 'TeacherPortal.liveSessions' });
const prefix = (label: string) => label.split(' · ')[0];
const SETTINGS = { timeLimit: 30, skip: false };

test.use({ viewport: { width: 1440, height: 900 } });

test('S8 — Start now makes a real session the desktop joins; schedule, edit and demo modes', async ({ page, request }) => {
  test.setTimeout(300_000);
  mkdirSync(PROOFS, { recursive: true });
  const errors = watchErrors(page);
  const jwt = await apiLogin(request, 'teacher');
  const started: string[] = [];
  const booked: string[] = [];
  const dialog = modal(page);
  const cta = dialog.locator('[data-slot="start-session-cta"]');

  try {
    const dashboardPromise = waitForDashboard(page);
    await signIn(page, 'teacher');
    await page.waitForURL('**/dashboard/results');
    const [klass] = (await dashboardPromise).classes;
    const tests = await readTests(request, jwt);
    const busy = await busyStudentIds(request, jwt, klass.class_document_id);

    await test.step('Classes → "Start new session": the real class, tests, facts and an enabled CTA', async () => {
      await page.locator('[data-slot="start-session-button"]').click();
      await expect(dialog.getByRole('heading', { name: t('title') })).toBeVisible();
      await waitForModalData(page);
      const free = klass.student_count - busy.size;
      await expect(modalTab(dialog, 'students')).toContainText(t('tabs.studentsAvailable', { free, total: klass.student_count }));
      await expect(cta).toHaveText(t('cta.start', { count: free }));
      await expect(cta).not.toHaveAttribute('aria-disabled', 'true');
      const last = await lastSessionOpenedAt(request, jwt, klass.class_document_id);
      await expect(dialog.locator('[data-fact="last"] dd')).toHaveText(await lastSessionText(page, last, t('facts.noneYet')));
      await expect(choice(dialog, 'now')).toHaveAttribute('data-checked', '');
      await expect(dialog.locator('[data-slot="start-session-class"]')).toHaveValue(klass.class_document_id);
      for (const entry of tests) await expect(choice(dialog, entry.form_document_id)).toContainText(entry.label);
      await expect(choice(dialog, tests[0].form_document_id)).toHaveAttribute('data-checked', '');
      await expect(dialog.locator('[data-fact="sitting"]')).toContainText(t('facts.students', { count: klass.student_count }));
      const average = klass.reading?.average ?? null;
      const shown = average === null ? t('facts.notTested') : t('facts.average', { value: Math.round(average) });
      await expect(dialog.locator('[data-fact="average"]')).toContainText(shown);
      // P1 parity row 16: the design's skill card is 50px tall (a 22px dot), not 48. The When card
      // carries the same 22px dot and stays 78px — its two-line label is the taller child.
      expect(await boxHeight(choice(dialog, 'reading'))).toBeCloseTo(50, 0);
      expect(await boxHeight(choice(dialog, 'reading').locator('span[aria-hidden="true"]').first())).toBeCloseTo(22, 0);
      expect(await boxHeight(choice(dialog, 'now').locator('span[aria-hidden="true"]').first())).toBeCloseTo(22, 0);
      expect(await boxHeight(choice(dialog, 'now'))).toBeCloseTo(78, 0);
      await shot(page, 'start-session-test');
    });

    const picked: string[] = [];
    let outsider = '';
    await test.step('Students: the busy greyed exactly as the server rule says; two free students picked', async () => {
      await modalTab(dialog, 'students').click();
      await choice(dialog, 'some').click();
      await expect(dialog.locator('[data-slot="start-session-student"]')).toHaveCount(klass.student_count);
      await expect(dialog.locator('[data-slot="start-session-student"][data-blocked]')).toHaveCount(busy.size);
      for (const id of busy) await expect(dialog.locator(`[data-student-id="${id}"]`)).toHaveAttribute('data-blocked', 'sitting');
      const free = dialog.locator('[data-slot="start-session-student"]:not([data-blocked])');
      for (const index of [0, 1]) {
        picked.push((await free.nth(index).getAttribute('data-student-id')) ?? '');
        await free.nth(index).click();
      }
      outsider = (await free.nth(2).getAttribute('data-student-id')) ?? '';
      await expect(dialog.locator('[data-slot="start-session-roster"]')).toContainText(t('students.pickCount', { count: 2, total: klass.student_count }));
      await shot(page, 'start-session-students');
    });

    await test.step('Settings: time limit 30, skipping off', async () => {
      await modalTab(dialog, 'settings').click();
      const skip = dialog.getByRole('switch', { name: t('settings.toggles.skip.label') });
      await expect(skip).toHaveAttribute('aria-checked', 'true');
      await skip.click();
      await expect(skip).toHaveAttribute('aria-checked', 'false');
      await dialog.locator('[data-section="timing"] > button').click();
      await dialog.locator('[data-slot="start-session-time-limit"]').selectOption('30');
      await expect(dialog.locator('[data-section="during"] > button')).toContainText(t('settings.summary.onOf', { on: 2, total: 3 }));
      await expect(dialog.locator('[data-section="timing"] > button')).toContainText(t('settings.summary.timingAuto', { limit: 30 }));
      await expect(modalTab(dialog, 'settings')).toContainText(t('tabs.settingsSkipOff', { limit: 30 }));
      // P1 parity row 14: the design's setting row is 70.8px — an 18px label line, then 3px, then the
      // description — and "During the test" is 272.3px over its three rows.
      expect(await boxHeight(dialog.locator('[data-section="during"] [data-slot="toggle-row"]').first())).toBeCloseTo(70.8, 0);
      expect(await boxHeight(dialog.locator('[data-section="during"]'))).toBeCloseTo(272.3, 0);
      await shot(page, 'start-session-settings');
    });

    await test.step('"Start session · 2 students" → a real running sitting the desktop can join', async () => {
      await expect(cta).toHaveText(t('cta.start', { count: 2 }));
      const posted = page.waitForResponse((response) => isSessionWrite(response, 'POST'));
      await cta.click();
      const response = await posted;
      expect(response.status(), await response.text()).toBe(201);
      const id = createTestSessionResponseSchema.parse(await response.json()).sitting_document_id;
      started.push(id);
      await page.waitForURL(isLiveTab(klass.class_document_id, id));
      await expect(page.locator(`[data-tab-panel="live"][data-session-id="${id}"]`)).toBeVisible();
      await expect(dialog).toHaveCount(0);
      await shot(page, 'start-session-live-tab');
      const code = await expectStartedSitting(request, jwt, klass.class_document_id, id, picked, SETTINGS);
      await expectDesktopJoin(request, { id, code, member: picked[0], outsider, settings: SETTINGS });
      expect(await releaseSitting(request, jwt, id, 'close')).toBe(200);
      started.pop();
    });

    await test.step('Schedule a window: the design errors, then a real booking tomorrow 09:00–09:50', async () => {
      await openFromClasses(page, t('title'));
      await choice(dialog, 'later').click();
      await expect(dialog.getByText(t('sub.later'))).toBeVisible();
      const closes = dialog.locator('[data-field="closes"]');
      await closes.fill('09:20');
      await expect(dialog.locator('[data-slot="start-session-schedule-errors"]')).toContainText(t('schedule.errors.windowShort', { window: 20, limit: 40 }));
      await expect(cta).toHaveText(t('cta.fixTiming'));
      await expect(cta).toHaveAttribute('aria-disabled', 'true');
      await shot(page, 'start-session-schedule-error');
      await closes.fill('09:50');
      await expect(dialog.locator('[data-slot="start-session-schedule"]')).toContainText(t('schedule.note', { window: 50, limit: 40, closes: '09:50' }));
      await waitForModalData(page);
      await shot(page, 'start-session-schedule');
      test.skip(!(await bookingsDeployed(request, jwt)), 'bookings (B1b) are not deployed on :5500');
      await expect(cta).toContainText(prefix(t('cta.schedule', { count: 0 })));
      const posted = page.waitForResponse((response) => isSessionWrite(response, 'POST'));
      await cta.click();
      const response = await posted;
      expect(response.status(), await response.text()).toBe(201);
      const booking = createTestSessionResultSchema.parse(await response.json());
      booked.push(booking.sitting_document_id);
      expect(booking.phase).toBe('scheduled');
      await page.waitForURL('**/dashboard/test-sessions');
      expect(await bookingWindowHm(request, jwt, klass.class_document_id, booking.sitting_document_id, 'opens_at')).toBe('09:00');
    });

    await test.step('Edit that booking from Live sessions: the saved window, then Save changes → PATCH', async () => {
      await page.locator(`[data-slot="scheduled-session-card"][data-sitting-id="${booked[0]}"]`).getByRole('button', { name: tLive('edit') }).click();
      await expect(dialog.getByRole('heading', { name: t('titleEdit') })).toBeVisible();
      await expect(dialog.locator('[data-field="opens"]')).toHaveValue('09:00');
      await expect(dialog.locator('[data-field="closes"]')).toHaveValue('09:50');
      await dialog.locator('[data-field="closes"]').fill('10:00');
      await waitForModalData(page);
      await expect(cta).toContainText(prefix(t('cta.save', { count: 0 })));
      await shot(page, 'start-session-edit');
      const patched = page.waitForResponse((response) => isSessionWrite(response, 'PATCH', booked[0]));
      await cta.click();
      expect((await patched).status()).toBe(200);
      await expect(dialog).toHaveCount(0);
      expect(await bookingWindowHm(request, jwt, klass.class_document_id, booked[0], 'closes_at')).toBe('10:00');
    });

    await test.step('Teacher demo: the drawn demo layout, with Start demo now live (TB-17)', async () => {
      await openFromClasses(page, t('title'));
      await choice(dialog, 'demo').click();
      await expect(dialog.getByRole('heading', { name: t('titleDemo') })).toBeVisible();
      await expect(dialog).toContainText(t('test.demoNote'));
      await expect(dialog.getByRole('tablist')).toHaveCount(0);
      await expect(dialog.locator('[data-slot="start-session-facts"]')).toHaveCount(0);
      await expect(cta).toHaveText(t('cta.startDemo'));
      // TB-17 CLOSED: the CTA mints a real C-TT-DEMO link, so it is no longer the
      // honest-disabled button with its "not available yet" note. The mint itself and
      // the "Your demo link is ready" dialog are driven by `ask-ai.spec.ts`, which owns
      // the teacher's 10-per-hour magic-link budget in one place.
      await expect(cta).not.toHaveAttribute('aria-disabled', 'true');
      await shot(page, 'start-session-demo');
      await dialog.getByRole('button', { name: t('cta.cancel') }).click();
      await expect(dialog).toHaveCount(0);
    });

    expect(errors.filter((line) => line.startsWith('pageerror'))).toEqual([]);
  } finally {
    for (const id of started) await releaseSitting(request, jwt, id, 'close');
    for (const id of booked) await releaseSitting(request, jwt, id, 'cancel');
  }
});
