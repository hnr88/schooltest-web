import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, icu, loadMessages } from './helpers/i18n';
import { fixtureClassId } from './helpers/fixture-class';
import { roleCredentials } from './helpers/credentials';

// Task 111 (st-mvp-pivot) targeted live check - NOT part of the suite.
// Teacher cycle banner (mvp-updates 4.5, C-TEACH-02): the banner on the class
// page must agree with the live GET /api/schools/me/classes/:documentId/cycle
// payload (position, window dates, live form code - never hardcoded here),
// sit above the class content, and carry no ACARA phase text. The unscheduled
// branch needs a school with no live form, which the fixture never has, so it
// is covered structurally: the browser's cycle call is stubbed to the
// contract's unscheduled payload and the empty-state copy is asserted from
// the en catalog. No fixture mutation anywhere in this spec.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = roleCredentials('teacher');
const CLASS_ID = fixtureClassId(); // "EAL/D Year 7 - Room 4"
const CLASS_URL = `/en/dashboard/teach/classes/${CLASS_ID}`;

type CyclePosition = 'test_a' | 'test_b' | 'unscheduled';

interface ClassCycle {
  live_form: { documentId: string; form_code: string } | null;
  window: { opens_at: string; closes_at: string } | null;
  position: CyclePosition;
  benchmark_form: string | null;
  progress_form: string | null;
}

async function signIn(page: Page, credentials: { email: string; password: string }): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(credentials.email);
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(credentials.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  // late role redirect can never hijack the goto that follows. The axios
  // layer rides out any 429 on the auth POST, so allow for that here.
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 90_000 });
}

async function fetchCycle(request: APIRequestContext, jwt: string): Promise<ClassCycle> {
  const res = await fetchWithRetry(() =>
    request.get(`${API}/api/schools/me/classes/${CLASS_ID}/cycle`, {
      headers: { Authorization: `Bearer ${jwt}` },
    }),
  );
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { data: ClassCycle }).data;
}

// Mirrors CycleBanner's format.dateTime(..., { day, month, year }) so the
// expectation is derived from the API payload, never a literal. No app
// timeZone is configured, so both sides use the environment zone.
function formatWindowDate(iso: string): string {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

test.describe('task 111: teacher cycle banner vs live C-TEACH-02', () => {
  // Serial: the same signed-in teacher drives both checks against one stack.
  // The timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test('banner agrees with the live cycle payload and sits above the class content', async ({
    page,
    request,
  }) => {
    const jwt = await loginCached(request, API, TEACHER);
    const cycle = await fetchCycle(request, jwt);

    await signIn(page, TEACHER);
    await page.goto(CLASS_URL);
    const banner = page.locator('[data-slot="cycle-banner"]');
    await expect(banner).toBeVisible({ timeout: 20_000 });
    await expect(banner).toHaveAttribute('data-position', cycle.position);
    await expect(banner).toHaveAttribute('aria-label', cat(en, 'Teach.CycleBanner.label'));

    if (cycle.position === 'unscheduled') {
      await expect(
        banner.getByText(cat(en, 'Teach.CycleBanner.unscheduled'), { exact: true }),
      ).toBeVisible();
    } else {
      const positionCopy = cat(
        en,
        cycle.position === 'test_b' ? 'Teach.CycleBanner.testB' : 'Teach.CycleBanner.testA',
      );
      await expect(banner.getByRole('heading', { name: positionCopy, exact: true })).toBeVisible();
      if (cycle.window) {
        const windowLine = icu(cat(en, 'Teach.CycleBanner.window'), {
          opens: formatWindowDate(cycle.window.opens_at),
          closes: formatWindowDate(cycle.window.closes_at),
        });
        await expect(banner.getByText(windowLine, { exact: true })).toBeVisible();
      }
      if (cycle.live_form) {
        const formLine = icu(cat(en, 'Teach.CycleBanner.formCode'), {
          code: cycle.live_form.form_code,
        });
        await expect(banner.getByText(formLine, { exact: true })).toBeVisible();
      }
    }

    // The banner renders above the class content (the roster surface).
    const roster = page.locator('[data-surface="teacher-roster"]');
    await expect(roster).toBeVisible({ timeout: 20_000 });
    const bannerBox = await banner.boundingBox();
    const rosterBox = await roster.boundingBox();
    expect(bannerBox).not.toBeNull();
    expect(rosterBox).not.toBeNull();
    if (bannerBox && rosterBox) {
      expect(bannerBox.y + bannerBox.height).toBeLessThanOrEqual(rosterBox.y);
    }

    // Teacher-only surface: no ACARA phase text anywhere in the rendered page.
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('ACARA');
  });

  test('unscheduled position renders the empty-state copy', async ({ page }) => {
    // Structural coverage: the fixture class always has a live form, so stub
    // the browser's cycle call with the contract's unscheduled payload.
    await page.route('**/api/schools/me/classes/*/cycle', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            live_form: null,
            window: null,
            position: 'unscheduled',
            benchmark_form: null,
            progress_form: null,
          },
        }),
      }),
    );

    await signIn(page, TEACHER);
    await page.goto(CLASS_URL);
    const banner = page.locator('[data-slot="cycle-banner"]');
    await expect(banner).toBeVisible({ timeout: 20_000 });
    await expect(banner).toHaveAttribute('data-position', 'unscheduled');
    await expect(
      banner.getByText(cat(en, 'Teach.CycleBanner.unscheduled'), { exact: true }),
    ).toBeVisible();
    // The empty state never shows the Test A / Test B heading.
    await expect(banner.getByRole('heading')).toHaveCount(0);
  });
});
