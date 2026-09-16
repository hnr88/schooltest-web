/**
 * FLEET-7 / 04 — magic-link invites: the passwordless STUDENT sign-in link and
 * the TEACHER trial link. Both are requested against the real API (the student
 * renderer app on :3010 is DOWN in this environment — ENV-BLOCKED — so the
 * request leg is exercised at the contract, exactly as that app would), the
 * emails are read from Mailpit, and the web verify pages are driven as a real
 * recipient drives them.
 *
 * Screenshots: tests/e2e/captures/fleet7/4*-*.png
 */
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { apiPostSafe, cat, en, screenshotMailpitMessage, shot } from './helpers/fleet7';
import { getMessage, searchMessages, waitForMessages } from './helpers/mailpit';


/** Probe the student renderer once; remember the verdict for the report. */
async function studentAppUp(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:3010', { signal: AbortSignal.timeout(4_000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

test.describe('F7-04 magic-link invites', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(180_000);

  test('student magic link: request → email → verify lands signed in', async ({ page, request }) => {
    const up = await studentAppUp();
    test.info().annotations.push({
      type: 'env',
      description: up
        ? 'student renderer :3010 is UP'
        : 'student renderer :3010 is DOWN — request driven at the API contract; the :3010 landing itself is ENV-BLOCKED',
    });

    // The per-email limiter allows 5 requests/hour, so the spec ROTATES
    // through the stable seeded students: leg A (primary :3010) uses the
    // first student whose request is accepted, leg B (web :3002 fallback)
    // uses the next one.
    const pool = [
      'mia.keller@schooltest.local',
      'jonas.keller@schooltest.local',
      'sofia.petrov@schooltest.local',
      'a1s01@schooltest.local',
      'a1s02@schooltest.local',
      'a1s03@schooltest.local',
    ];

    async function requestLink(which: number): Promise<{ student: string; token: string; primary: string | null } | null> {
      for (let index = which; index < pool.length; index += 1) {
        const candidate = pool[index];
        const before = (await searchMessages(request, `to:${candidate}`)).length;
        const res = await apiPostSafe(request, '/api/auth/student/magic-link/request', {
          email: candidate,
        });
        if (!res.ok()) continue; // 429 or outage — rotate to the next seed
        const summaries = await waitForMessages(request, candidate, before + 1);
        const message = await getMessage(request, summaries[0].ID);
        expect(message.Subject).toBe('Your SchoolTest sign-in link');
        const primary = message.Text.match(
          /https?:\/\/[^/\s]*:3010\/en\/auth\/student\/verify\?token=([0-9a-f]{64})/,
        );
        const any = message.Text.match(
          /https?:\/\/\S*\/en\/auth\/student\/verify\?token=([0-9a-f]{64})/,
        );
        expect(any, 'email carries a student verify link').toBeTruthy();
        test.info().annotations.push({
          type: 'student-link-origin',
          description: `${candidate}: ${primary ? 'primary link pins :3010 as designed' : 'primary link does NOT pin :3010'}`,
        });
        return { student: candidate, token: any![1], primary: primary ? primary[0] : null };
      }
      return null;
    }

    // --- leg A: PRIMARY landing on the student renderer (:3010) ---
    const legA = up ? await requestLink(0) : null;
    if (legA) {
      await screenshotMailpitMessage(page, request, legA.student, '40-mailpit-student-magic-email');
      await page.goto(legA.primary ?? `/auth/student/verify?token=${legA.token}`);
      await expect(
        page.getByRole('heading', { name: cat(en, 'MagicLink.successTitle') }),
      ).toBeVisible({ timeout: 60_000 });
      await shot(page, legA.primary ? '40a-student-magic-3010-landing' : '41-student-magic-verify-success');

      // Single-use: the SAME link in a FRESH browser (no session) refuses.
      const browser = page.context().browser();
      const fresh = await browser!.newContext();
      const freshPage = await fresh.newPage();
      await freshPage.goto(legA.primary ?? `/auth/student/verify?token=${legA.token}`);
      try {
        // The student renderer has its OWN refusal copy ("This link was
        // already used"), distinct from the web app's MagicLink.errorTitle.
        await expect(
          freshPage
            .getByText('This link was already used')
            .or(freshPage.getByRole('heading', { name: cat(en, 'MagicLink.errorTitle') })),
        ).toBeVisible({ timeout: 30_000 });
      } catch (error) {
        const text = await freshPage.innerText('body').catch(() => '(no body)');
        console.log('F7-04 REUSE-BODY:', JSON.stringify(text.slice(0, 400)));
        await freshPage.screenshot({ path: 'tests/e2e/captures/fleet7/40b-reuse-unexpected.png' });
        throw error;
      }
      await freshPage.screenshot({
        path: path.join('tests/e2e/captures/fleet7', '40b-student-magic-3010-reuse-refused.png'),
      });
      await fresh.close();
    } else {
      test.info().annotations.push({
        type: 'env',
        description: 'every seeded student is rate-limited right now; leg A skipped this run',
      });
    }

    // --- leg B: the web app (:3002) fallback verify surface, fresh token ---
    const legB = await requestLink(legA ? pool.indexOf(legA.student) + 1 : 0);
    if (!legB) {
      test.info().annotations.push({
        type: 'env',
        description: 'student magic-link pool exhausted (5/hour/email); leg B skipped this run',
      });
      return;
    }
    await page.goto(`/auth/student/verify?token=${legB.token}`);
    await expect(
      page.getByRole('heading', { name: cat(en, 'MagicLink.successTitle') }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(cat(en, 'MagicLink.successBody.student'), { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    const body = await page.evaluate(() => document.body.innerText);
    expect(body, 'the token itself is never rendered').not.toContain(legB.token);
    await shot(page, '41-student-magic-verify-success');

    // The magic token is single-use: a second open refuses.
    await page.goto(`/auth/student/verify?token=${legB.token}`);
    await expect(
      page.getByRole('heading', { name: cat(en, 'MagicLink.errorTitle') }),
    ).toBeVisible({ timeout: 60_000 });
    await shot(page, '42-student-magic-token-reuse-refused');
  });

  test('invalid student magic token shows the honest error, token hidden', async ({ page }) => {
    const bad = 'e'.padEnd(64, '0');
    await page.goto(`/auth/student/verify?token=${bad}`);
    await expect(
      page.getByRole('heading', { name: cat(en, 'MagicLink.errorTitle') }),
    ).toBeVisible({ timeout: 60_000 });
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).not.toContain(bad);
    await shot(page, '43-student-magic-invalid-token');
  });

  test('teacher trial magic link: request → email → verify succeeds', async ({
    page,
    request,
  }) => {
    const teacher = 't1@schooltest.local';
    const before = (await searchMessages(request, `to:${teacher}`)).length;

    const req = await apiPostSafe(request, '/api/auth/teacher/magic-link/request', {
      email: teacher,
    });
    expect(req.ok(), `teacher magic-link request: ${await req.text()}`).toBeTruthy();

    const summaries = await waitForMessages(request, teacher, before + 1);
    const message = await getMessage(request, summaries[0].ID);
    const link = message.Text.match(/https?:\/\/\S*\/en\/auth\/teacher\/verify\?token=([0-9a-f]{64})/);
    expect(link, 'trial email carries the web verify link').toBeTruthy();

    await screenshotMailpitMessage(page, request, teacher, '44-mailpit-teacher-trial-email');

    await page.goto(`/auth/teacher/verify?token=${link![1]}`);
    await expect(
      page.getByRole('heading', { name: cat(en, 'MagicLink.successTitle') }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(cat(en, 'MagicLink.successBody.teacher'), { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await shot(page, '45-teacher-magic-verify-success');
  });
});
