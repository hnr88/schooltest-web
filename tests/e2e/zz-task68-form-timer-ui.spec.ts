import { expect, test, type APIRequestContext, type APIResponse, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, loadMessages } from './helpers/i18n';

// Task 68 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Signs in as the seeded ops account and drives the C-TMR-01 timers page and
// the C-WIN-01 form-window panel against the live API: timer round trip
// (UI save -> API GET reflects -> restore), window FORM_LOCKED surfaced as
// panel copy, a real window replace + read-back + restore, and the non-ops
// bounce off both surfaces.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const OPS = { email: 'admin@schooltest.local', password: 'TBUaS2yS6D9FJMZP!A1' };
const SCHOOL_ADMIN = { email: 'schooladmin-a@schooltest.local', password: 'pEbjxVnJ4PPYiv8D!A1' };
const SCHOOL_DOCUMENT_ID = 'tcdu9a7g6qm2tg8brju2kosp'; // SchoolTest Demo School A

interface TimersBody {
  data: { sections: { stage: number; duration_seconds: number }[] };
}

async function opsJwt(request: APIRequestContext): Promise<string> {
  return loginCached(request, API, OPS);
}

// Every request-context call rides out the API's fixed-window 429 (helpers/http.ts).
const apiGet = (
  request: APIRequestContext,
  url: string,
  options?: Parameters<APIRequestContext['get']>[1],
): Promise<APIResponse> => fetchWithRetry(() => request.get(url, options));

async function apiTimers(request: APIRequestContext, jwt: string) {
  const res = await apiGet(request, `${API}/api/config/section-timers`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as TimersBody).data.sections;
}

async function signInAsOps(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(OPS.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(OPS.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  // late role redirect can never hijack the goto that follows. The axios
  // layer rides out any 429 on the auth POST, so allow for that here.
  await page.waitForURL('**/dashboard/ops/schools', { timeout: 90_000 });
}

test.describe('task 68: ops form window + section timers vs live C-WIN-01/C-TMR-01', () => {
  // The timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  test.describe.configure({ timeout: 120_000 });
  test('timers page: live values -> save -> API reflects -> restore', async ({
    page,
    request,
  }) => {
    const jwt = await opsJwt(request);
    const before = await apiTimers(request, jwt);
    expect(before.map((s) => s.duration_seconds)).toEqual([900, 900, 900]);

    await signInAsOps(page);
    await page.goto('/dashboard/ops/timers');
    const panel = page.locator('[data-surface="ops-section-timers"]');
    await expect(panel).toBeVisible({ timeout: 20_000 });
    await expect(panel.locator('#ops-timer-section-1')).toHaveValue('15');
    await expect(panel.locator('#ops-timer-section-2')).toHaveValue('15');
    await expect(panel.locator('#ops-timer-section-3')).toHaveValue('15');
    await expect(panel.locator('[data-surface="ops-timers-meta"]')).toContainText(
      'admin@schooltest.local',
    );

    // Change section 2 to 20 minutes and save.
    await panel.locator('#ops-timer-section-2').fill('20');
    await panel
      .getByRole('button', { name: cat(en, 'Ops.timers.saveButton'), exact: true })
      .click();
    await expect(
      page.getByText(cat(en, 'Ops.timers.savedToast'), { exact: true }),
    ).toBeVisible({ timeout: 20_000 });

    const after = await apiTimers(request, jwt);
    expect(after.map((s) => s.duration_seconds)).toEqual([900, 1200, 900]);

    // Restore the 15-minute pilot value through the same UI. Poll the API
    // rather than the toast - the first save's toast may still be visible.
    await panel.locator('#ops-timer-section-2').fill('15');
    await panel
      .getByRole('button', { name: cat(en, 'Ops.timers.saveButton'), exact: true })
      .click();
    await expect
      .poll(async () => (await apiTimers(request, jwt)).map((s) => s.duration_seconds), {
        timeout: 20_000,
      })
      .toEqual([900, 900, 900]);
  });

  test('form window: locked refusal surfaces, replace + read-back + restore', async ({
    page,
    request,
  }) => {
    const jwt = await opsJwt(request);
    await signInAsOps(page);
    await page.goto(`/dashboard/ops/schools/${SCHOOL_DOCUMENT_ID}`);
    const panel = page.locator('[data-surface="ops-form-window"]');
    await expect(panel).toBeVisible({ timeout: 20_000 });

    // Current window: RDG-FT-A-79 with the locked badge (students have sat it).
    const current = panel.locator('[data-surface="ops-form-window-current"]');
    await expect(current).toContainText('RDG-FT-A-79');
    await expect(
      current.getByText(cat(en, 'Ops.window.lockedBadge'), { exact: true }),
    ).toBeVisible();

    // Reassigning the same period to Test B is refused (FORM_LOCKED) and the
    // panel shows the lock copy instead of swallowing the 400.
    await panel.locator('#ops-window-form').selectOption({ label: 'RDG-FT-B-79' });
    await panel
      .getByRole('button', { name: cat(en, 'Ops.window.saveButton'), exact: true })
      .click();
    await expect(
      panel.getByText(cat(en, 'Ops.window.lockedError'), { exact: true }),
    ).toBeVisible({ timeout: 20_000 });

    // A non-overlapping later window replaces freely.
    await panel.locator('#ops-window-opens').fill('2026-10-01T00:00');
    await panel.locator('#ops-window-closes').fill('2026-10-31T23:59');
    await panel
      .getByRole('button', { name: cat(en, 'Ops.window.saveButton'), exact: true })
      .click();
    await expect(
      page.getByText('Window saved. RDG-FT-B-79 is now live for this school.', { exact: true }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(current).toContainText('RDG-FT-B-79');

    const readBack = await apiGet(request, 
      `${API}/api/form-windows?filters[school][documentId][$eq]=${SCHOOL_DOCUMENT_ID}&populate[form][fields][0]=form_code`,
      { headers: { Authorization: `Bearer ${jwt}` } },
    );
    expect(readBack.ok()).toBeTruthy();
    const rows = ((await readBack.json()) as { data: { form: { form_code: string } }[] }).data;
    expect(rows).toHaveLength(1);
    expect(rows[0].form.form_code).toBe('RDG-FT-B-79');

    // Restore the seeded window through the same panel. Poll the API read-back
    // rather than the toast - toast timing raced the first save's toast.
    await panel.locator('#ops-window-form').selectOption({ label: 'RDG-FT-A-79' });
    await panel.locator('#ops-window-opens').fill('2026-08-01T00:00');
    await panel.locator('#ops-window-closes').fill('2026-08-31T23:59');
    await panel
      .getByRole('button', { name: cat(en, 'Ops.window.saveButton'), exact: true })
      .click();
    await expect(current).toContainText('RDG-FT-A-79', { timeout: 20_000 });
    await expect
      .poll(
        async () => {
          const res = await apiGet(request, 
            `${API}/api/form-windows?filters[school][documentId][$eq]=${SCHOOL_DOCUMENT_ID}&populate[form][fields][0]=form_code`,
            { headers: { Authorization: `Bearer ${jwt}` } },
          );
          const body = (await res.json()) as { data: { form: { form_code: string } }[] };
          return body.data[0]?.form.form_code;
        },
        { timeout: 20_000 },
      )
      .toBe('RDG-FT-A-79');
  });

  test('school_admin is bounced off the timers page and the school detail', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(SCHOOL_ADMIN.email);
    await page
      .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
      .fill(SCHOOL_ADMIN.password);
    await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
    // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
    // late role redirect can never hijack the goto that follows. The axios
    // layer rides out any 429 on the auth POST, so allow for that here.
    await page.waitForURL('**/dashboard/school', { timeout: 90_000 });

    await page.goto('/dashboard/ops/timers');
    await page.waitForURL('**/dashboard/school', { timeout: 30_000 });
    await expect(page.locator('[data-surface="ops-section-timers"]')).toHaveCount(0);

    await page.goto(`/dashboard/ops/schools/${SCHOOL_DOCUMENT_ID}`);
    await page.waitForURL('**/dashboard/school', { timeout: 30_000 });
    await expect(page.locator('[data-surface="ops-form-window"]')).toHaveCount(0);
  });
});
