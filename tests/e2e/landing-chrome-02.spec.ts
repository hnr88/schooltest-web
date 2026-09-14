import { expect, test } from '@playwright/test';

// Task 02 (landing-pages) PROOF TOOLING — re-pointed at the redesigned
// landing chrome. The old utility bar, aria-current markers, masthead search
// form and mobile sheet are gone; the new chrome is the notice band, the
// sticky masthead with the scrollable Primary nav, and the sign-in /
// join-the-pilot pair.

const SHOT_DIR = '../mvp/landing-pages/proof/shots';

const NOTICE_TEXT =
  'Pilot testing in term 4, 2026. Become a founding school and contribute to the design and development of SchoolTest.';
const NAV_LABEL = 'Primary';
const NAV_LINKS: readonly { label: string; hrefOnHome: string }[] = [
  { label: 'Overview', hrefOnHome: '#programme' },
  { label: 'Diagnose', hrefOnHome: '/diagnose' },
  { label: 'Teach', hrefOnHome: '/teach' },
  { label: 'Track', hrefOnHome: '/track' },
  { label: 'Predict', hrefOnHome: '/predict' },
  { label: 'Report', hrefOnHome: '/report' },
];
const ACCENT = 'rgb(37, 99, 235)';

const primaryNav = (page: import('@playwright/test').Page) =>
  page.getByRole('navigation', { name: NAV_LABEL, exact: true });

test('desktop chrome: the notice band, masthead and main render in order on /', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const notice = page.locator('div[data-screen-label="Notice"]');
  await expect(notice).toBeVisible();
  const header = page.locator('header');
  await expect(header).toBeVisible();
  const main = page.locator('main');
  await expect(main).toBeVisible();

  // Design order: notice band -> masthead -> <main>. The old utility bar and
  // its tagline no longer render.
  const noticeY = (await notice.boundingBox())?.y ?? -1;
  const headerY = (await header.boundingBox())?.y ?? -1;
  const mainY = (await main.boundingBox())?.y ?? -1;
  expect(noticeY, 'notice band sits above the masthead').toBeLessThan(headerY);
  expect(headerY, 'masthead sits above main').toBeLessThan(mainY);
  await expect(page.getByText(NOTICE_TEXT)).toBeVisible();

  // The Primary nav carries all six destinations in order (nav is the
  // internally-scrolling strip, so the masthead never wraps).
  const nav = primaryNav(page);
  await expect(nav).toBeVisible();
  await expect(nav.locator('a')).toHaveText(NAV_LINKS.map((link) => link.label));
  for (const link of NAV_LINKS) {
    await expect(nav.getByRole('link', { name: link.label, exact: true })).toHaveAttribute(
      'href',
      link.hrefOnHome,
    );
  }

  // Utility destinations keep their hrefs: sign-in and the join-the-pilot
  // button (scoped to the masthead — the hero repeats the label by design).
  await expect(header.getByRole('link', { name: 'Sign in', exact: true })).toHaveAttribute(
    'href',
    '/sign-in',
  );
  await expect(header.getByRole('link', { name: 'Join the pilot', exact: true })).toHaveAttribute(
    'href',
    '#register',
  );

  const shot = await page.screenshot({ path: `${SHOT_DIR}/02-landing-desktop-1440.png` });
  await testInfo.attach('02-landing-desktop-1440', { body: shot, contentType: 'image/png' });
});

test('desktop chrome: the accent border marks the active page in the Primary nav', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/teach');

  const nav = primaryNav(page);
  await expect(nav).toBeVisible();
  // The active page keeps the 3px accent bottom border; every other entry is
  // transparent. (The redesign dropped the aria-current marker.)
  const borderBottomColor = (label: string) =>
    nav
      .getByRole('link', { name: label, exact: true })
      .evaluate((node) => getComputedStyle(node).borderBottomColor);
  expect(await borderBottomColor('Teach'), 'Teach is marked active on /teach').toBe(ACCENT);
  for (const label of ['Overview', 'Diagnose', 'Track', 'Predict', 'Report']) {
    expect(await borderBottomColor(label), `${label} is not active on /teach`).not.toBe(ACCENT);
  }

  await page.goto('/');
  const navHome = primaryNav(page);
  const homeActive = await navHome
    .getByRole('link', { name: 'Overview', exact: true })
    .evaluate((node) => getComputedStyle(node).borderBottomColor);
  expect(homeActive, 'Overview is marked active on /').toBe(ACCENT);

  const shot = await page.screenshot({ path: `${SHOT_DIR}/02-landing-teach-desktop-1440.png` });
  await testInfo.attach('02-landing-teach-desktop-1440', {
    body: shot,
    contentType: 'image/png',
  });
});

test('375px: main content fits and the Primary nav stays a single internal scroller', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/');

  // The redesigned page keeps one contained 375px exception — the footer's
  // nowrap acknowledgement line. Everything in <main> must fit the viewport.
  const mainMax = await page.evaluate(
    () =>
      Math.max(
        ...[...document.querySelectorAll('main, main *')].map(
          (node) => node.getBoundingClientRect().right,
        ),
      ),
  );
  expect(mainMax, 'every main-content node fits the 375px viewport').toBeLessThanOrEqual(376);

  // No mobile sheet anymore: the Primary nav is the SAME element at every
  // width, scrolling inside its own overflow container (overflowX: auto).
  const nav = primaryNav(page);
  await expect(nav).toBeVisible();
  const navScroll = await nav.evaluate((node) => ({
    overflowX: getComputedStyle(node).overflowX,
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
  }));
  expect(navScroll.overflowX).toBe('auto');
  expect(navScroll.scrollWidth).toBeGreaterThan(navScroll.clientWidth);
  for (const link of NAV_LINKS) {
    await expect(
      nav.getByRole('link', { name: link.label, exact: true }),
    ).toBeAttached();
  }

  const shot = await page.screenshot({ path: `${SHOT_DIR}/02-landing-mobile-375.png` });
  await testInfo.attach('02-landing-mobile-375', { body: shot, contentType: 'image/png' });
});
