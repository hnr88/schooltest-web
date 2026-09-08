import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';

import { cat, loadMessages, stripTags } from './helpers/i18n';

// Task 15; D-01-REVISED. Retired SaaS specs are not recreated. This suite owns
// the root-route journey, five-page accessibility floor and 32-surface captures.
const messages = loadMessages('en');
const t = (key: string) => cat(messages, `Eald.${key}`);
const routes = ['/', '/diagnose', '/teach', '/track', '/predict'] as const;
const shots = path.resolve(process.cwd(), '../mvp/landing-pages/proof/shots');
const api = process.env.E2E_API_URL ?? 'http://127.0.0.1:5500';
const primary = (page: Page) => page.getByRole('navigation', { name: t('nav.label'), exact: true });
const section = (page: Page, key: string) => page.locator('main > section').filter({
  has: page.getByRole('heading', { name: stripTags(t(key)), exact: true }),
});

const surfaces: { id: string; route: string; selector?: string; heading?: string }[] = [
  { id: 'S01-skip', route: '/', selector: 'a[href="#main-content"]' },
  { id: 'S02-utility', route: '/', selector: 'div:has(> header) > div.bg-navy-950' },
  { id: 'S03-masthead', route: '/', selector: 'header' },
  { id: 'S04-notice', route: '/', selector: '[data-slot="announcement-banner"], [data-slot="maintenance-banner"]' },
  { id: 'S05-quote', route: '/', selector: 'main > section:has(blockquote)' },
  { id: 'S06-next', route: '/diagnose', heading: 'shared.nextHeading' },
  { id: 'S07-cta', route: '/diagnose', heading: 'shared.cta.title' },
  { id: 'S08-footer', route: '/', selector: 'footer:not(blockquote footer)' },
  { id: 'S09-home-hero', route: '/', selector: 'main > section:has(h1)' },
  { id: 'S10-field-testing', route: '/', selector: '[data-slot="eald-trusted-by"]' },
  { id: 'S11-programme', route: '/', selector: '#programme' },
  { id: 'S12-components', route: '/', heading: 'home.whatYouGet.title' },
  { id: 'S13-home-chart', route: '/', selector: '#evidence' },
  { id: 'S14-evidence-base', route: '/', heading: 'home.proof.badge' },
  { id: 'S15-register', route: '/', selector: '#register' },
  { id: 'S16-diagnose-hero', route: '/diagnose', selector: '#diagnose-hero' },
  { id: 'S17-profile', route: '/diagnose', selector: '#unpack' },
  { id: 'S18-same-score', route: '/diagnose', selector: '#same-score' },
  { id: 'S19-comparison', route: '/diagnose', selector: '#profile-comparison' },
  { id: 'S20-teach-hero', route: '/teach', selector: 'main > section:has(h1)' },
  { id: 'S21-export', route: '/teach', heading: 'teach.generate.title' },
  { id: 'S22-classroom', route: '/teach', heading: 'teach.classroom.title' },
  { id: 'S23-grouping', route: '/teach', heading: 'teach.classroom.groupCaption' },
  { id: 'S24-three-more', route: '/teach', heading: 'teach.threeMore.title' },
  { id: 'S25-track-hero', route: '/track', selector: 'main > section:has(h1)' },
  { id: 'S26-trail', route: '/track', heading: 'track.evidence.title' },
  { id: 'S27-progress', route: '/track', heading: 'track.progress.heading' },
  { id: 'S28-empirical', route: '/track', heading: 'track.teachEmpirical.title' },
  { id: 'S29-predict-hero', route: '/predict', selector: '#predict-hero' },
  { id: 'S30-individual', route: '/predict', selector: '#individual' },
  { id: 'S31-cohort', route: '/predict', selector: '#cohort' },
  { id: 'S32-cohort-photo', route: '/predict', selector: '#cohort-photo' },
];

async function screenshot(page: Page, info: TestInfo, name: string) {
  mkdirSync(shots, { recursive: true });
  const body = await page.screenshot({ path: path.join(shots, `15-${name}.png`) });
  await info.attach(name, { body, contentType: 'image/png' });
}

async function pageWidth(page: Page, expected: number, phase: string) {
  const widths = await page.evaluate(() => ({
    viewport: innerWidth, body: document.body.scrollWidth,
    rootScroll: document.documentElement.scrollWidth, rootClient: document.documentElement.clientWidth,
    scrollingScroll: document.scrollingElement?.scrollWidth, scrollingClient: document.scrollingElement?.clientWidth,
  }));
  console.log('PAGE_WIDTH', page.url(), phase, JSON.stringify(widths));
  expect(widths.body).toBe(expected);
  expect(widths.rootClient).toBe(expected);
  expect(widths.rootScroll).toBe(expected);
  expect(widths.scrollingClient).toBe(expected);
  expect(widths.scrollingScroll).toBe(expected);
  return widths;
}

async function chart(page: Page, titleKey: string, values: readonly number[], ceiling?: string) {
  const figure = page.locator('figure').filter({ has: page.getByText(t(titleKey), { exact: true }) });
  const plot = figure.locator('[data-slot="bar-chart"]');
  await expect(plot).toHaveAccessibleName(/.+/);
  await expect(plot.locator(':scope > li')).toHaveCount(4);
  const cells = await plot.locator('.sr-only').allTextContents();
  expect(cells.map((cell) => Number(cell.split(': ').at(-1)))).toEqual(values);
  expect(cells.every((cell) => cell.split(': ')[0].trim().length > 5)).toBe(true);
  await expect(figure.getByText(/Illustrative sample data\./)).toBeVisible();
  if (ceiling) await expect(figure.getByText(ceiling, { exact: true })).toBeVisible();
  console.log('FIGURE_TEXT', titleKey, JSON.stringify(cells));
}

async function notice(page: Page, settings: {
  maintenance_mode: boolean; maintenance_message: string | null;
  announcement_enabled: boolean; announcement_message: string | null;
}) {
  const text = settings.maintenance_mode && settings.maintenance_message
    ? settings.maintenance_message
    : settings.announcement_enabled ? settings.announcement_message : null;
  const banner = page.locator('[data-slot="announcement-banner"], [data-slot="maintenance-banner"]');
  await expect(banner).toHaveCount(text ? 1 : 0);
  if (text) await expect(banner).toContainText(text);
  console.log('NOTICE_STATE', text ? 'on' : 'off');
}

async function keyboardFocus(page: Page, scope: Locator, trapped = false) {
  const controls = scope.locator('a[href], button, input:not([type="hidden"]), select, textarea, [tabindex="0"]');
  const total = await controls.count();
  const visible: number[] = [];
  const shadows = new Map<number, string>();
  for (let i = 0; i < total; i++) {
    const control = controls.nth(i);
    if (!(await control.isVisible()) || !(await control.isEnabled())) continue;
    visible.push(i);
    shadows.set(i, await control.evaluate((node) => getComputedStyle(node).boxShadow));
  }
  expect(visible.length).toBeGreaterThan(0);
  const reached = new Set<number>();
  for (let step = 0; step < visible.length + 12; step++) {
    await page.keyboard.press('Tab');
    // BaseUI wraps through a focus guard and redirects on the next animation frame.
    // Wait for that transition; a persistent focus escape still fails this assertion.
    if (trapped) await expect.poll(() => controls.evaluateAll((nodes) => nodes.findIndex((node) => node === document.activeElement)), { message: 'Focus escaped the mobile navigation dialog' }).toBeGreaterThanOrEqual(0);
    const index = await controls.evaluateAll((nodes) => nodes.findIndex((node) => node === document.activeElement));
    if (trapped) expect(index, 'Focus escaped the mobile navigation dialog').toBeGreaterThanOrEqual(0);
    if (!visible.includes(index)) continue; // Dev-tool controls outside the application scope.
    const control = controls.nth(index);
    await expect(control).toHaveAccessibleName(/.+/);
    const ring = await control.evaluate((node) => {
      const style = getComputedStyle(node);
      return { outline: parseFloat(style.outlineWidth), style: style.outlineStyle, color: style.outlineColor, shadow: style.boxShadow, focusVisible: node.matches(':focus-visible') };
    });
    expect(ring.focusVisible).toBe(true);
    expect((ring.outline > 0 && ring.style !== 'none' && ring.color !== 'rgba(0, 0, 0, 0)') || (ring.shadow !== 'none' && ring.shadow !== shadows.get(index)), `Missing focus indicator: ${await control.evaluate((node) => node.outerHTML.slice(0, 200))}`).toBe(true);
    reached.add(index);
    if (reached.size === visible.length) break;
  }
  expect([...reached].sort((a, b) => a - b)).toEqual(visible);
  if (trapped) {
    await page.keyboard.press('Tab');
    await expect.poll(() => scope.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  }
  console.log('KEYBOARD_REACHABLE_WITH_FOCUS', visible.length);
}

test('skip-link labels are translated and distinct from the primary navigation', () => {
  const labels = {
    en: 'Skip to main content', zh: '跳到主要内容', ko: '본문으로 건너뛰기',
    ms: 'Langkau ke kandungan utama', vi: 'Chuyển đến nội dung chính', th: 'ข้ามไปยังเนื้อหาหลัก',
  };
  for (const locale of ['en', 'zh', 'ko', 'ms', 'vi', 'th'] as const) {
    const catalogue = loadMessages(locale);
    expect(cat(catalogue, 'Eald.nav.skipToContent')).toBe(labels[locale]);
    expect(cat(catalogue, 'Eald.nav.skipToContent')).not.toBe(cat(catalogue, 'Eald.nav.label'));
  }
});

for (const route of routes) {
  test(`accessibility: ${route} at desktop and 375px`, async ({ page }) => {
    test.setTimeout(180_000);
    for (const width of [1440, 375]) {
      await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
      await page.goto(route);
      const main = page.getByRole('main');
      for (const role of ['banner', 'main', 'contentinfo'] as const) await expect(page.getByRole(role)).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await page.keyboard.press('Tab');
      const skip = page.locator('a[href="#main-content"]');
      expect(t('nav.skipToContent')).toBe('Skip to main content');
      expect(t('nav.skipToContent')).not.toBe(t('nav.label'));
      await expect(skip).toHaveCount(1);
      await expect(skip).toHaveAccessibleName(t('nav.skipToContent'));
      await expect(skip).toBeFocused();
      await expect(skip).toBeVisible();
      const skipBox = await skip.boundingBox();
      expect(skipBox).not.toBeNull();
      if (!skipBox) throw new Error('Focused skip link has no visible box');
      expect(skipBox.width).toBeGreaterThan(1);
      expect(skipBox.height).toBeGreaterThan(1);
      expect(skipBox.x).toBeGreaterThanOrEqual(0);
      expect(skipBox.y).toBeGreaterThanOrEqual(0);
      expect(skipBox.x + skipBox.width).toBeLessThanOrEqual(width);
      expect(skipBox.y + skipBox.height).toBeLessThanOrEqual(width === 375 ? 812 : 900);
      await page.keyboard.press('Enter');
      expect(await main.evaluate((node) => node === document.activeElement || node.contains(document.activeElement))).toBe(true);
      const navs = page.getByRole('navigation');
      const names: string[] = [];
      for (const nav of await navs.all()) {
        await expect(nav).toHaveAccessibleName(/.+/);
        names.push(await nav.evaluate((node) => node.getAttribute('aria-label') ?? (node.getAttribute('aria-labelledby') ?? '').split(' ').map((id) => document.getElementById(id)?.textContent ?? '').join(' ')));
      }
      if (width === 375) {
        await page.getByRole('button', { name: t('nav.openMenu'), exact: true }).click();
        await expect(page.getByRole('dialog').getByRole('button', { name: t('nav.closeMenu'), exact: true })).toBeFocused();
        names.push(t('nav.label'));
      }
      await expect(primary(page)).toHaveCount(1);
      await expect(primary(page).locator('[aria-current="page"]')).toHaveAttribute('href', route);
      expect(new Set(names).size).toBe(names.length);
      if (width === 375) {
        await keyboardFocus(page, page.getByRole('dialog'), true);
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(page.getByRole('button', { name: t('nav.openMenu'), exact: true })).toBeFocused();
      }
      const app = page.locator('div:has(> main)');
      await expect(app.locator('img:not([alt])')).toHaveCount(0);
      for (const control of await app.locator('input:not([type="hidden"]), select, textarea').all()) {
        if (await control.isVisible()) await expect(control).toHaveAccessibleName(/.+/);
      }
      expect(await app.locator('div').evaluateAll((nodes) => nodes.filter((node) => node.onclick !== null).map((node) => node.outerHTML.slice(0, 160)))).toEqual([]);
      await keyboardFocus(page, app);
      const widths = await pageWidth(page, width, 'after keyboard traversal');
      console.log('ACCESSIBILITY_FLOOR', route, width, JSON.stringify({ names, widths }));
    }
  });
}

test('all six figures expose every value when image requests are disabled', async ({ page }) => {
  test.setTimeout(120_000);
  await page.route('**/*', (route) => route.request().resourceType() === 'image' ? route.abort() : route.continue());
  await page.goto('/');
  await chart(page, 'home.evidenceChart.figureTitle', [42, 68, 84, 34, 58, 74, 30, 48, 64, 26, 38, 54]);
  await page.goto('/diagnose');
  const profile = page.locator('#unpack figure [role="group"]');
  await expect(profile).toHaveAccessibleName(/.+/);
  await expect(profile.locator('li .sr-only')).toHaveText([': 72%', ': 14%', ': 52%', ': 58%', ': 32%', ': 27%', ': 10%']);
  await chart(page, 'diagnose.comparison.figureTitle', [72, 46, 14, 80, 27, 62, 52, 44]);
  await page.goto('/teach');
  await chart(page, 'teach.grouping.figureTitle', [8, 5, 6, 6, 4, 6, 4, 5], '10 students');
  await page.goto('/track');
  await chart(page, 'track.progress.figureTitle', [24, 42, 66, 84, 18, 30, 52, 72, 36, 44, 58, 68, 16, 20, 26, 34]);
  await page.goto('/predict');
  await chart(page, 'predict.cohort.figureTitle', [9, 3, 6, 5, 5, 8, 2, 6], '10 students');
});

for (const width of [1440, 375]) {
  test(`visual inventory: all 32 surfaces at ${width}px`, async ({ page }, info) => {
    test.setTimeout(240_000);
    const height = width === 375 ? 812 : 900;
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(new Set(surfaces.map((surface) => surface.id)).size).toBe(32);
    for (const route of routes) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      await pageWidth(page, width, 'after load and fonts');
      for (const surface of surfaces.filter((entry) => entry.route === route)) {
        let target = surface.selector ? page.locator(surface.selector) : section(page, surface.heading ?? '');
        let state = '';
        if (surface.id === 'S04-notice' && await target.count() === 0) { target = page.getByRole('banner'); state = '-off'; }
        if (surface.id === 'S01-skip') await target.focus();
        await expect(target).toHaveCount(1);
        await target.scrollIntoViewIfNeeded();
        await target.locator('img').evaluateAll((images) => Promise.all(images.map((image) => {
          if (!(image instanceof HTMLImageElement)) throw new Error('Expected an HTML image');
          return image.decode();
        })));
        const bounds = await target.boundingBox();
        if (!bounds) throw new Error(`Missing surface ${surface.id}`);
        const header = await page.getByRole('banner').boundingBox();
        const inset = (header?.height ?? 0) + 16;
        const origin = await target.evaluate((node) => scrollY + node.getBoundingClientRect().top);
        const parts = Math.max(1, Math.ceil(bounds.height / (height - inset - 16)));
        for (let part = 0; part < parts; part++) {
          if (surface.id !== 'S01-skip') await page.evaluate(({ top }) => scrollTo({ top, behavior: 'instant' }), { top: origin - inset + part * (height - inset - 16) });
          await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
          await screenshot(page, info, `${surface.id}${state}-${width}${part ? `-part${part + 1}` : ''}`);
        }
        console.log('SURFACE_CAPTURED', surface.id, width, parts, state || 'present');
        const clippedFacts = await target.locator('[data-slot="stat-strip"] dt, [data-slot="stat-strip"] dd').evaluateAll((nodes) => nodes
          .filter((node) => node.scrollWidth > node.clientWidth)
          .map((node) => ({ text: node.textContent, scrollWidth: node.scrollWidth, clientWidth: node.clientWidth })));
        expect(clippedFacts, `Clipped facts in ${surface.id} at ${width}px`).toEqual([]);
      }
      await pageWidth(page, width, 'after all surface captures');
    }
  });
}

test('journey: all five pages, real registration and an invisible repeat registration', async ({ page, request }, info) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect((await request.get(`${api}/api/health`)).ok()).toBe(true);
  const settingsResponse = await request.get(`${api}/api/platform-settings/public`);
  expect(settingsResponse.status()).toBe(200);
  const settings: { data: Parameters<typeof notice>[1] } = await settingsResponse.json();
  const email = process.env.E2E_PILOT_EMAIL ?? `lp15-${Date.now()}@schooltest.local`;
  const responseBodies: string[] = [];
  // Exactly two POSTs in this test. Both whole journeys use the same address.
  for (const run of [1, 2]) {
    await test.step(`${run}.1 home chrome, notice and four-cell hero`, async () => {
      await page.goto('/');
      await expect(page.getByText(t('nav.utilityTagline'), { exact: true })).toBeVisible();
      await expect(page.getByRole('banner')).toHaveCount(1);
      await notice(page, settings.data);
      await expect(page.locator('main > section:has(h1) [data-slot="stat-strip"] dd')).toHaveCount(4);
    });
    await test.step(`${run}.2 programme and five facts`, async () => {
      await page.goto('/#programme');
      await expect(page.locator('#programme')).toBeVisible();
      await expect(page.locator('#programme dl dd')).toHaveCount(5);
    });
    await test.step(`${run}.3 five rows and truthful field-testing state`, async () => {
      const rows = section(page, 'home.whatYouGet.title').locator('ol > li');
      await expect(rows).toHaveCount(5);
      await expect(rows.nth(4).getByText(t('home.whatYouGet.inFieldTesting'), { exact: true })).toBeVisible();
      await expect(rows.nth(4).locator('a')).toHaveCount(0);
      await expect(page.locator('[data-slot="pilot-evidence-placeholder"]')).toHaveText(t('home.trustedBy.placeholder'));
    });
    await test.step(`${run}.4 Diagnose profile and comparison`, async () => {
      await section(page, 'home.whatYouGet.title').locator('a[href="/diagnose"]').click();
      await expect(page).toHaveURL(/\/diagnose$/);
      await expect(page.locator('#unpack figure [role="group"] li')).toHaveCount(7);
      await chart(page, 'diagnose.comparison.figureTitle', [72, 46, 14, 80, 27, 62, 52, 44]);
    });
    await test.step(`${run}.5 next-nav to Teach`, async () => {
      await section(page, 'shared.nextHeading').locator('a[href="/teach"]').click();
      await expect(page).toHaveURL(/\/teach$/);
      await expect(page.getByText(t('teach.generate.footnote'), { exact: true })).toBeVisible();
      await chart(page, 'teach.grouping.figureTitle', [8, 5, 6, 6, 4, 6, 4, 5], '10 students');
    });
    await test.step(`${run}.6 primary nav to Track`, async () => {
      await primary(page).getByRole('link', { name: t('nav.track'), exact: true }).click();
      await expect(page).toHaveURL(/\/track$/);
      await chart(page, 'track.progress.figureTitle', [24, 42, 66, 84, 18, 30, 52, 72, 36, 44, 58, 68, 16, 20, 26, 34]);
    });
    await test.step(`${run}.7 primary nav to Predict`, async () => {
      await primary(page).getByRole('link', { name: t('nav.predict'), exact: true }).click();
      await expect(page).toHaveURL(/\/predict$/);
      for (const value of ['34%', '81%']) await expect(page.locator('#individual').getByText(value, { exact: true })).toBeVisible();
      await chart(page, 'predict.cohort.figureTitle', [9, 3, 6, 5, 5, 8, 2, 6], '10 students');
    });
    await test.step(`${run}.8 CTA to real five-field registration`, async () => {
      await section(page, 'shared.cta.title').locator('a[href="/#register"]').click();
      await expect(page).toHaveURL(/\/#register$/);
      const form = page.locator('#register form');
      await expect(form.locator('input, select')).toHaveCount(5);
      await form.getByLabel(t('home.register.nameLabel'), { exact: true }).fill('Acceptance Reviewer');
      await form.getByLabel(t('home.register.schoolLabel'), { exact: true }).fill('Acceptance Test School');
      await form.locator('label').filter({ has: page.getByText(t('home.register.roleLabel'), { exact: true }) }).locator('select').selectOption({ label: t('home.register.roleHod') });
      await form.getByLabel(t('home.register.emailLabel'), { exact: true }).fill(email);
      await form.locator('label').filter({ has: page.getByText(t('home.register.studentsLabel'), { exact: true }) }).locator('select').selectOption({ label: t('home.register.students21to50') });
      const responsePromise = page.waitForResponse((response) =>
        new URL(response.url()).pathname === '/api/pilot-registrations/submit' && response.request().method() === 'POST');
      await form.getByRole('button', { name: t('home.register.submitButton'), exact: true }).click();
      const response = await responsePromise;
      console.log('JOURNEY_POST', run, response.status(), await response.text());
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({ data: { received: true }, meta: {} });
      expect(response.request().postDataJSON()).toEqual({ name: 'Acceptance Reviewer', school: 'Acceptance Test School', role: t('home.register.roleHod'), email, students: t('home.register.students21to50') });
      responseBodies.push(await response.text());
      await expect(page.locator('#register [role="status"]')).toContainText(t('home.register.successTitle'));
      await expect(page.locator('#register form')).toHaveCount(0);
      await page.locator('#register [role="status"]').scrollIntoViewIfNeeded();
      await screenshot(page, info, `S15-submitted-run${run}-1440`);
    });
    await test.step(`${run}.9 footer privacy and breadcrumb home`, async () => {
      await page.getByRole('contentinfo').locator('a[href="/privacy-policy"]').click();
      await expect(page).toHaveURL(/\/privacy-policy$/);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.getByRole('navigation', { name: cat(messages, 'Navigation.breadcrumbLabel'), exact: true }).locator('a[href="/"]').click();
      await expect(page).toHaveURL(/\/$/);
    });
    await test.step(`${run}.10 masthead search reaches search or its anonymous guard`, async () => {
      const intent = page.waitForRequest((request) => {
        const url = new URL(request.url());
        return url.pathname === '/dashboard/search' && url.searchParams.get('mode') === 'schools';
      });
      await page.getByRole('searchbox', { name: t('nav.searchLabel'), exact: true }).fill('Acceptance school');
      await page.getByRole('search').getByRole('button', { name: t('nav.searchSubmit'), exact: true }).click();
      await intent;
      await expect(page).toHaveURL(/\/(?:dashboard\/search\?mode=schools|sign-in(?:\?.*)?)$/);
    });
  }
  expect(responseBodies).toHaveLength(2);
  expect(responseBodies[1]).toBe(responseBodies[0]);
  console.log('JOURNEY_COMPLETE', JSON.stringify({ email, passes: 2, postCount: 2, responseBodies }));
});
