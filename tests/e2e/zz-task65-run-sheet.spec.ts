import { expect, test, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';

// Task 65 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Test-day run sheet (mvp-updates §4.5 step 4): renders every required block
// as the teacher, is reachable from the test-day screen and teacher home,
// carries no psychometric jargon / ACARA / em dashes, and prints (chrome
// stripped, PDF generated).
const en = loadMessages('en');
const zh = loadMessages('zh');

const TEACHER = { email: process.env.E2E_TEACHER_EMAIL ?? 'teacher@schooltest.local', password: process.env.E2E_TEACHER_PASSWORD ?? 'Teacher1234!' };
const CLASS_ID = 'x1hat1dy90boz11n9zyphoan'; // "EAL/D Year 7 - Room 4"
const RUN_SHEET_URL = '/en/dashboard/teach/run-sheet';

async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(TEACHER.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(TEACHER.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  // late role redirect can never hijack the goto that follows. The axios
  // layer rides out any 429 on the auth POST, so allow for that here.
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 90_000 });
}

test.describe('task 65: test-day run sheet', () => {
  // The timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  test.describe.configure({ timeout: 120_000 });
  test('renders every block, jargon-free, and prints', async ({ page }) => {
    await signIn(page);
    await page.goto(RUN_SHEET_URL);
    const sheet = page.locator('[data-surface="teacher-run-sheet"]');
    await expect(sheet).toBeVisible({ timeout: 20_000 });

    // Every required block: Before / When you start / What to tell students /
    // During / If something goes wrong / After, plus the verbatim say lines.
    const keys = [
      'RunSheet.title',
      'RunSheet.before.title',
      'RunSheet.before.itemOne',
      'RunSheet.start.title',
      'RunSheet.start.itemOne',
      'RunSheet.say.title',
      'RunSheet.say.lineOne',
      'RunSheet.say.lineTwo',
      'RunSheet.say.lineThree',
      'RunSheet.say.lineFour',
      'RunSheet.say.lineFive',
      'RunSheet.during.title',
      'RunSheet.during.itemThree',
      'RunSheet.trouble.title',
      'RunSheet.trouble.itemTwo',
      'RunSheet.after.title',
      'RunSheet.after.itemOne',
    ];
    for (const key of keys) {
      await expect(sheet.getByText(cat(en, key), { exact: true }), key).toBeVisible();
    }
    await expect(sheet.locator('[data-slot="run-sheet-say"]')).toBeVisible();

    // The sheet never quotes timer minutes (D-10: durations are ops-set).
    const sheetText = (await sheet.innerText()) ?? '';
    expect(sheetText).not.toMatch(/\b\d+\s*(minutes?|mins?)\b/i);

    // Banned on teacher surfaces (copy rules + §4.4): no psychometric jargon,
    // no ACARA, no em/en dashes.
    expect(sheetText).not.toMatch(/attribute|mastery|G-DINA|Q-matrix|ACARA|—|–/i);

    // Print sanity: in print media the rail and topbar are hidden, the sheet
    // stays visible, and Chromium can paginate it to a real PDF.
    await page.emulateMedia({ media: 'print' });
    await expect(sheet).toBeVisible();
    await expect(page.locator('[data-slot="sidebar-container"]')).toBeHidden();
    await expect(sheet.getByRole('button', { name: cat(en, 'RunSheet.printCta') })).toBeHidden();
    const pdf = await page.pdf({ format: 'A4' });
    expect(pdf.length).toBeGreaterThan(10_000);
    await page.emulateMedia({ media: 'screen' });
  });

  test('is linked from the test-day screen and teacher home', async ({ page }) => {
    await signIn(page);
    await page.goto(`/en/dashboard/teach/classes/${CLASS_ID}/test-day`);
    const testDay = page.locator('[data-surface="teacher-test-day"]');
    await expect(testDay).toBeVisible({ timeout: 20_000 });
    await testDay
      .getByRole('link', { name: cat(en, 'TestDay.runSheetLink'), exact: true })
      .click();
    // localePrefix "as-needed" drops the /en prefix on navigation.
    await page.waitForURL('**/dashboard/teach/run-sheet');
    await expect(page.locator('[data-surface="teacher-run-sheet"]')).toBeVisible({
      timeout: 20_000,
    });

    await page.goto('/en/dashboard/teach');
    const home = page.locator('[data-surface="teacher-home"]');
    await expect(home).toBeVisible({ timeout: 20_000 });
    await expect(
      home.getByRole('link', { name: cat(en, 'Teach.home.runSheetLink'), exact: true }),
    ).toBeVisible();
  });

  test('renders in a non-en locale with the same shape', async ({ page }) => {
    await signIn(page);
    await page.goto('/zh/dashboard/teach/run-sheet');
    const sheet = page.locator('[data-surface="teacher-run-sheet"]');
    await expect(sheet).toBeVisible({ timeout: 20_000 });
    await expect(
      sheet.getByRole('heading', { name: cat(zh, 'RunSheet.title'), exact: true }),
    ).toBeVisible();
    await expect(
      sheet.getByText(cat(zh, 'RunSheet.say.lineThree'), { exact: true }),
    ).toBeVisible();
    const zhText = (await sheet.innerText()) ?? '';
    expect(zhText).not.toMatch(/—|–/);
  });
});
