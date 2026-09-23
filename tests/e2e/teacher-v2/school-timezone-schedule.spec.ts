import { mkdirSync } from 'node:fs';

import { expect, test } from '@playwright/test';
import { createTranslator } from 'next-intl';

import enMessages from '@/i18n/messages/en.json';
import { addDaysIso, zonedParts } from '@/modules/teacher/lib/start-session-schedule';
import { createTestSessionResultSchema } from '@/modules/teacher/schemas/teacher-session.schema';

import { runSql } from '../helpers/auth-db';
import { apiLogin } from '../helpers/teacher-auth-rail';
import { waitForDashboard } from '../helpers/teacher-class-detail';
import { signIn } from '../helpers/teacher-rail';
import {
  bookingWindowHm,
  releaseSitting,
  scheduledSittingsOf,
} from '../helpers/teacher-start-session-api';
import {
  PROOFS,
  choice,
  isSessionWrite,
  modal,
  shot,
  waitForModalData,
} from '../helpers/teacher-start-session-modal';
import { watchErrors } from '../helpers/ui';

// BUG-002 — the teacher's DEVICE is in another zone than the SCHOOL. The modal must
// build, preview and show the window in the school's stored IANA zone (C-TD-1
// `classes[].timezone`, the zone the API validates in), so 09:00–10:00 school time
// books (201) and 06:00 school time is refused before it is sent. Real API, no
// interception; the booking is cancelled at the end.
const DEVICE_ZONE = process.env.E2E_DEVICE_TIMEZONE ?? 'Europe/London';
const t = createTranslator({
  locale: 'en',
  messages: enMessages,
  namespace: 'TeacherPortal.startSession',
});

test.use({ viewport: { width: 1440, height: 900 }, timezoneId: DEVICE_ZONE });

test(`BUG-002 — a device in ${DEVICE_ZONE} books 09:00–10:00 in the school's zone`, async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  mkdirSync(PROOFS, { recursive: true });
  const errors = watchErrors(page);
  const jwt = await apiLogin(request, 'teacher');
  const dialog = modal(page);
  const cta = dialog.locator('[data-slot="start-session-cta"]');
  const booked: string[] = [];

  try {
    const dashboardPromise = waitForDashboard(page);
    await signIn(page, 'teacher');
    await page.waitForURL('**/dashboard/results');
    const [klass] = (await dashboardPromise).classes;

    const schoolZone = klass.timezone ?? '';
    await test.step('the class read names the school zone stored on the school row, not the device zone', async () => {
      expect(await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone)).toBe(
        DEVICE_ZONE,
      );
      const stored = runSql(`select s.timezone from classes c
          join classes_school_lnk l on l.class_id = c.id
          join schools s on s.id = l.school_id
         where c.document_id = '${klass.class_document_id}'`);
      expect(schoolZone).toBe(stored);
      expect(schoolZone).not.toBe(DEVICE_ZONE);
    });

    // Two school days ahead, as the SCHOOL's calendar counts them, clear of the S8 spec's tomorrow booking.
    const date = addDaysIso(zonedParts(new Date(), schoolZone).date, 2);
    await page.locator('[data-slot="start-session-button"]').click();
    await expect(dialog.getByRole('heading', { name: t('title') })).toBeVisible({
      timeout: 30_000,
    });
    await choice(dialog, 'later').click();
    await dialog.locator('[data-field="date"]').fill(date);
    const errorsBox = dialog.locator('[data-slot="start-session-schedule-errors"]');

    await test.step('06:00 school time is out of hours in the preview; nothing is sent', async () => {
      await dialog.locator('[data-field="opens"]').fill('06:00');
      await dialog.locator('[data-field="closes"]').fill('07:00');
      await expect(errorsBox).toContainText(t('schedule.errors.outsideHours'));
      await expect(cta).toHaveText(t('cta.fixTiming'));
      await expect(cta).toHaveAttribute('aria-disabled', 'true');
      await shot(page, 'bug-002-schedule-0600-refused');
    });

    await test.step('09:00–10:00 school time: the zone is shown, the preview is clean, the API books it', async () => {
      await dialog.locator('[data-field="opens"]').fill('09:00');
      await dialog.locator('[data-field="closes"]').fill('10:00');
      await expect(dialog.locator('[data-slot="start-session-schedule-zone"]')).toHaveText(
        t('schedule.zoneNote', { zone: schoolZone }),
      );
      await expect(errorsBox).toHaveCount(0);
      await waitForModalData(page);
      await shot(page, 'bug-002-schedule-0900-preview');
      const posted = page.waitForResponse((response) => isSessionWrite(response, 'POST'));
      await cta.click();
      const response = await posted;
      expect(response.status(), await response.text()).toBe(201);
      const booking = createTestSessionResultSchema.parse(await response.json());
      booked.push(booking.sitting_document_id);
      expect(booking.phase).toBe('scheduled');
      await page.waitForURL('**/dashboard/test-sessions');
      await shot(page, 'bug-002-schedule-0900-booked');
    });

    await test.step('the server echoes the school zone and holds 09:00–10:00 on that date there', async () => {
      const id = booked[0];
      const row = (await scheduledSittingsOf(request, jwt, klass.class_document_id)).find(
        (entry) => entry.sitting_document_id === id,
      );
      expect(row?.window?.timezone).toBe(schoolZone);
      expect(zonedParts(new Date(row?.window?.opens_at ?? ''), schoolZone)).toEqual({
        date,
        time: '09:00',
      });
      expect(await bookingWindowHm(request, jwt, klass.class_document_id, id, 'closes_at')).toBe(
        '10:00',
      );
    });

    expect(errors.filter((line) => line.startsWith('pageerror'))).toEqual([]);
  } finally {
    for (const id of booked) await releaseSitting(request, jwt, id, 'cancel');
  }
});
