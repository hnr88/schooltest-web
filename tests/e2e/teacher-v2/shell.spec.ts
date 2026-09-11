import path from 'node:path';

import { expect, test, type Locator, type Page, type Response } from '@playwright/test';

import { cat } from '../helpers/i18n';
import { loginAs } from '../helpers/roles';
import { en, groupLabels, navLink, sidebar, signIn } from '../helpers/teacher-rail';
import { waitForAnimationsSettled } from '../helpers/ui';

// F3 — the Teacher Portal v2 frame (Teacher Portal v2.dc.html:23–56; design shots
// classes-list.png, live-sessions.png, user-menu-open.png at 1440×900). Real sign-in
// and the real API: the name and the live dot are checked against the responses the
// page itself received, never against fixtures.
type Rgb = readonly [number, number, number];
type ColourProperty = 'color' | 'backgroundColor' | 'borderTopColor';

interface MeBody {
  username: string;
  first_name: string | null;
  last_name: string | null;
}

const PROOFS = path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'teacher-v2');
const NAVY: Rgb = [14, 35, 80];
const ACTIVE_TILE: Rgb = [238, 241, 246];
const IDLE_INK: Rgb = [91, 104, 121];

test.use({ viewport: { width: 1440, height: 900 } });

function apiGet(fragment: string) {
  return (response: Response) =>
    response.url().includes(fragment) && response.request().method() === 'GET' && response.ok();
}

/** A computed colour as sRGB channels (theme tokens compute to oklch()); null = transparent. */
function rgbOf(locator: Locator, property: ColourProperty): Promise<Rgb | null> {
  return locator.evaluate((element, prop) => {
    const context = document.createElement('canvas').getContext('2d');
    if (!context) return null;
    context.fillStyle = getComputedStyle(element)[prop];
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    return a === 0 ? null : ([r, g, b] as const);
  }, property);
}

async function expectColour(locator: Locator, property: ColourProperty, expected: Rgb | null) {
  await expect
    .poll(
      async () => {
        const actual = await rgbOf(locator, property);
        if (actual === null || expected === null) return actual === expected;
        return actual.every((channel, index) => Math.abs(channel - expected[index]) <= 2);
      },
      { message: `${property} of ${locator} should be ${expected ?? 'transparent'}` },
    )
    .toBe(true);
}

async function expectNavState(page: Page, label: string, active: boolean) {
  const link = navLink(page, label);
  await expectColour(link, 'backgroundColor', active ? ACTIVE_TILE : null);
  await expectColour(link, 'color', active ? NAVY : IDLE_INK);
  await expect(link).toHaveCSS('font-weight', active ? '600' : '500');
}

function rounded(values: readonly (number | undefined)[]): number[] {
  return values.map((value) => Math.round(value ?? -1));
}

/** Every console error and uncaught page error raised while on a teacher shell route. */
function collectShellRouteErrors(page: Page): string[] {
  const errors: string[] = [];
  const onShellRoute = () => /\/dashboard\/(results|test-sessions)(\/|$|\?)/.test(page.url());
  page.on('console', (message) => {
    if (message.type() === 'error' && onShellRoute()) {
      errors.push(`${page.url()} console.error: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    if (onShellRoute()) errors.push(`${page.url()} pageerror: ${error.message}`);
  });
  return errors;
}

test.describe('F3 — Teacher Portal v2 shell', () => {
  // No console error and no uncaught page error while on /dashboard/results or
  // /dashboard/test-sessions. Checked after each test, so the proof captures still
  // land and the failure names every error found.
  let shellRouteErrors: string[] = [];
  test.beforeEach(({ page }) => {
    shellRouteErrors = collectShellRouteErrors(page);
  });
  test.afterEach(() => {
    expect(shellRouteErrors, 'console/page errors on the teacher shell routes').toEqual([]);
  });

  test('a teacher gets the design rail, no topbar, the user menu and working nav', async ({ page }) => {
    // One sign-in, three routes and two captures against the live dev server: the
    // default 30s budget is too tight when the server is recompiling under load.
    test.setTimeout(120_000);
    const meResponse = page.waitForResponse(apiGet('/api/users/me'));
    const dashboardResponse = page.waitForResponse(apiGet('/api/teacher/dashboard'));
    await signIn(page, 'teacher');
    await page.waitForURL('**/dashboard/results');
    const me = (await (await meResponse).json()) as MeBody;
    const dashboard = (await (await dashboardResponse).json()) as { live_sessions: unknown[] };

    // The rail: the design's words through the catalogue keys, TEACHER VIEW, states.
    expect(cat(en, 'Shell.nav.results')).toBe('Classes');
    expect(cat(en, 'Shell.nav.testSessions')).toBe('Live sessions');
    await expect(navLink(page, 'Classes')).toHaveAttribute('href', /\/dashboard\/results$/);
    await expect(navLink(page, 'Live sessions')).toHaveAttribute('href', /\/dashboard\/test-sessions$/);
    await expect(groupLabels(page)).toHaveText('TEACHER VIEW', { useInnerText: true });
    await expectNavState(page, 'Classes', true);
    await expectNavState(page, 'Live sessions', false);
    await waitForAnimationsSettled(page);

    // The card: 248×852 at the 24px gutter, radius 10, 1px #ECEEF2, no shadow.
    const card = sidebar(page).locator('[data-slot="sidebar-inner"]');
    await expect(card).toHaveCSS('border-top-width', '1px');
    await expectColour(card, 'borderTopColor', [236, 238, 242]);
    await expect(card).toHaveCSS('border-top-left-radius', '10px');
    await expect(card).toHaveCSS('box-shadow', 'none');
    const cardBox = await card.boundingBox();
    expect(rounded([cardBox?.x, cardBox?.y, cardBox?.width, cardBox?.height])).toEqual([24, 24, 248, 852]);

    // The frame: #F7F8FA, and the main column's `padding:0 4px 8px 8px` beside the rail.
    await expectColour(page.locator('[data-slot="sidebar-wrapper"]'), 'backgroundColor', [247, 248, 250]);
    const content = page.locator('[data-slot="dashboard-content"]');
    await expect(content).toHaveCSS('padding-left', '8px');
    await expect(content).toHaveCSS('padding-right', '4px');
    await expect(content).toHaveCSS('padding-bottom', '8px');
    const column = await content.boundingBox();
    expect(rounded([column?.x, column?.y, (column?.x ?? 0) + (column?.width ?? 0)])).toEqual([296, 24, 1416]);

    // No topbar: no bell row, no breadcrumb, and the rail toggle is not shown.
    await expect(page.locator('[data-slot="topbar-actions"]')).toHaveCount(0);
    await expect(
      page.getByRole('navigation', { name: cat(en, 'Shell.topbar.breadcrumbLabel') }),
    ).toHaveCount(0);
    await expect(page.locator('[data-slot="sidebar-trigger"]')).toBeHidden();

    // The live dot is the API's live_sessions for this teacher, nothing else.
    const dot = sidebar(page).locator('[data-slot="rail-live-dot"]');
    test.info().annotations.push({
      type: 'live_sessions',
      description: String(dashboard.live_sessions.length),
    });
    if (dashboard.live_sessions.length > 0) {
      await expect(dot).toBeVisible();
      await expect(dot).toHaveCSS('width', '9px');
      await expectColour(dot, 'backgroundColor', [220, 38, 38]);
    } else {
      await expect(dot).toHaveCount(0);
    }

    // The user card: the person's real name from /api/users/me (the username only when
    // it has none), its first initial on navy, "Teacher" and one chevron.
    const displayName = [me.first_name, me.last_name].filter(Boolean).join(' ') || me.username;
    test.info().annotations.push({ type: 'user card', description: displayName });
    const userCard = sidebar(page).getByRole('button', {
      name: cat(en, 'Shell.topbar.userMenuLabel'),
    });
    await expect(userCard).toContainText(displayName);
    await expect(userCard).toContainText(cat(en, 'Shell.userMenu.roles.teacher'));
    const avatar = userCard.locator('span').first();
    await expect(avatar).toHaveText(displayName.charAt(0).toUpperCase());
    await expectColour(avatar, 'backgroundColor', NAVY);
    await expect(userCard.locator('svg')).toHaveCount(1);

    await page.mouse.move(760, 450);
    await page.screenshot({ path: path.join(PROOFS, 'shell-classes.png'), animations: 'disabled' });

    // The menu: Sign out only, with the card held at #EEF1F6 while it is open.
    await userCard.click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem')).toHaveCount(1);
    await expect(menu.getByRole('menuitem', { name: cat(en, 'Shell.userMenu.signOut') })).toBeVisible();
    await expectColour(userCard, 'backgroundColor', ACTIVE_TILE);
    await waitForAnimationsSettled(page);
    // The design's menu spans the card (left:0; right:0) and sits 10px above it.
    const menuBox = await menu.boundingBox();
    const userBox = await userCard.boundingBox();
    expect(rounded([menuBox?.x, menuBox?.width])).toEqual(rounded([userBox?.x, userBox?.width]));
    expect(Math.round((userBox?.y ?? 0) - ((menuBox?.y ?? 0) + (menuBox?.height ?? 0)))).toBe(10);
    await page.screenshot({ path: path.join(PROOFS, 'shell-user-menu.png'), animations: 'disabled' });
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();

    // Live sessions navigates and takes the active state; still no topbar there.
    await navLink(page, 'Live sessions').click();
    await page.waitForURL('**/dashboard/test-sessions');
    await expectNavState(page, 'Live sessions', true);
    await expectNavState(page, 'Classes', false);
    await expect(page.locator('[data-slot="topbar-actions"]')).toHaveCount(0);

    // The bare /dashboard/teach (the API's class_teacher_assigned link) lands on Classes.
    await page.goto('/dashboard/teach');
    await page.waitForURL('**/dashboard/results');
    await expectNavState(page, 'Classes', true);
  });

  test('a school admin keeps the shared frame: topbar, bell and the floating navy rail', async ({
    page,
  }) => {
    await loginAs(page, 'schoolAdmin');
    await page.waitForURL('**/dashboard/school');
    const home = navLink(page, cat(en, 'Shell.nav.school'));
    await expect(home).toBeVisible({ timeout: 20_000 });

    await expect(page.locator('[data-slot="topbar-actions"]')).toBeVisible();
    await expect(page.locator('[data-slot="sidebar-trigger"]')).toBeVisible();
    await expectColour(home, 'backgroundColor', NAVY);
    await expect(sidebar(page).locator('[data-frame="teacher"]')).toHaveCount(0);
    const card = sidebar(page).locator('[data-slot="sidebar-inner"]');
    await expect(card).toHaveCSS('border-top-width', '0px');
    await expect(card).toHaveCSS('border-top-left-radius', '24px');
    await expectColour(page.locator('[data-slot="sidebar-wrapper"]'), 'backgroundColor', [238, 242, 247]);
    await expect(page.locator('[data-slot="dashboard-content"]')).toHaveCSS('padding-left', '0px');

    await waitForAnimationsSettled(page);
    await page.screenshot({
      path: path.join(PROOFS, 'shell-school-admin-unchanged.png'),
      animations: 'disabled',
    });
  });
});
