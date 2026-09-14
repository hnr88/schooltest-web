import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';

import { loadMessages } from './helpers/i18n';

// Re-pointed at the redesigned landing (hardcoded English JSX; the old
// data-slot kit, breadcrumb row, mobile sheet and server-side register form
// are gone). This suite still owns the root-route journey, the five-page
// accessibility floor and the per-route surface inventory + captures.

const messages = loadMessages('en');
const routes = ['/', '/diagnose', '/teach', '/track', '/predict'] as const;
const shots = path.resolve(process.cwd(), '../mvp/landing-pages/proof/shots');
const api = process.env.E2E_API_URL ?? 'http://127.0.0.1:5500';
const primary = (page: Page) => page.getByRole('navigation', { name: 'Primary', exact: true });
const section = (page: Page, label: string) =>
  page.locator(`main section[data-screen-label="${label}"]`);
const skipLink = (page: Page) => page.locator('a[href="#main"]');

const SCREENS: Record<string, string[]> = {
  '/': [
    'Notice',
    'Masthead',
    'Hero',
    'About the programme',
    'Five programme components',
    'Quote band',
    'Progress chart',
    'Evidence base',
    'Register',
  ],
  '/diagnose': [
    'Hero',
    'Unpack the placement score',
    'Same score different students',
    'Quote band',
    'Next',
    'Register',
  ],
  '/teach': [
    'Hero',
    'Generate the materials',
    'Classroom management',
    'Ask AI',
    'Next',
    'Register',
  ],
  '/track': ['Hero', 'Evidence trail', 'Progress chart', 'Teach empirically', 'Next', 'Register'],
  '/predict': ['Hero', 'The individual', 'Cohort chart', 'Cohort photo', 'Next', 'Register'],
};
const HERO_COPY: Record<(typeof routes)[number], string> = {
  '/': 'Diagnostic and progress testing for HSP',
  '/diagnose': 'One 40-minute sitting. All is revealed.',
  '/teach': 'Paste the profile into AI. Get a week of teaching materials out.',
  '/track': 'Watch every subskill move every time you test.',
  '/predict': 'Know when a student is ready, and prove it.',
};

async function screenshot(page: Page, info: TestInfo, name: string) {
  mkdirSync(shots, { recursive: true });
  const body = await page.screenshot({ path: path.join(shots, `15-${name}.png`) });
  await info.attach(name, { body, contentType: 'image/png' });
}

/** The redesigned pages overflow 375px ONLY at the footer's nowrap line. */
async function mainFitsViewport(page: Page, width: number, phase: string) {
  const measured = await page.evaluate((viewportWidth) => {
    const nodes = [...document.querySelectorAll('main, main *')];
    const mainMax = Math.max(...nodes.map((node) => node.getBoundingClientRect().right));
    return {
      mainMax,
      bodyScroll: document.body.scrollWidth,
      viewport: viewportWidth,
    };
  }, width);
  console.log('PAGE_WIDTH', page.url(), phase, JSON.stringify(measured));
  expect(
    measured.mainMax,
    `every main-content node fits the ${width}px viewport (${phase})`,
  ).toBeLessThanOrEqual(width + 1);
  // The single sanctioned exception is the footer's nowrap acknowledgement
  // line; nothing else may push the body wider than main + that line.
  expect(measured.bodyScroll, `${phase}: overflow stays contained`).toBeLessThan(width * 3);
  return measured;
}

async function keyboardFocus(page: Page, scope: Locator) {
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
    const index = await controls.evaluateAll((nodes) => nodes.findIndex((node) => node === document.activeElement));
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
  console.log('KEYBOARD_REACHABLE_WITH_FOCUS', visible.length);
}

test('skip-link labels are translated in every shipped catalogue', () => {
  const labels = {
    en: 'Skip to main content', zh: '跳到主要内容', ko: '본문으로 건너뛰기',
    ms: 'Langkau ke kandungan utama', vi: 'Chuyển đến nội dung chính', th: 'ข้ามไปยังเนื้อหาหลัก',
  };
  for (const locale of ['en', 'zh', 'ko', 'ms', 'vi', 'th'] as const) {
    const catalogue = loadMessages(locale);
    expect(catalogue['Landing.nav.skipToContent']).toBe(labels[locale]);
  }
  // The rendered skip link (hardcoded on the redesigned landing) matches the
  // English catalogue value and is distinct from the primary nav label.
  expect(labels.en).toBe('Skip to main content');
  expect('Primary').not.toBe(labels.en);
});

for (const route of routes) {
  test(`accessibility: ${route} at desktop and 375px`, async ({ page }) => {
    test.setTimeout(180_000);
    for (const width of [1440, 375]) {
      await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
      await page.goto(route);
      const main = page.locator('main');
      for (const role of ['banner', 'main', 'contentinfo'] as const) await expect(page.getByRole(role)).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(HERO_COPY[route]);

      // The skip link is the first keyboard target; on focus the design moves
      // it on-screen (landing.css `[data-*-f="0"]:focus`), and activating it
      // jumps the viewport to <main> via the #main fragment.
      await page.keyboard.press('Tab');
      const skip = skipLink(page);
      expect(await skip.evaluate((node) => node === document.activeElement)).toBe(true);
      await expect(skip).toHaveAccessibleName('Skip to main content');
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
      await expect(page).toHaveURL(new RegExp(`${route}#main$`));
      await expect
        .poll(() =>
          page.evaluate(() => {
            const top = document.querySelector('main')?.getBoundingClientRect().top ?? -9999;
            return Math.abs(Math.min(top, 0));
          }),
        )
        .toBeLessThanOrEqual(2);

      // Exactly one navigation, named, with the active page marked by the
      // accent border (the redesign dropped aria-current).
      const navs = page.getByRole('navigation');
      await expect(navs).toHaveCount(1);
      await expect(primary(page)).toHaveAccessibleName('Primary');
      const activeLabel = route === '/' ? 'Overview' : route.slice(1).replace(/^\w/, (c) => c.toUpperCase());
      const isMarked = await primary(page)
        .getByRole('link', { name: activeLabel, exact: true })
        .evaluate((node) => getComputedStyle(node).borderBottomColor);
      expect(isMarked, `${activeLabel} is marked active on ${route}`).toBe('rgb(37, 99, 235)');

      const app = page.locator('div:has(> main)');
      await expect(app.locator('img:not([alt])')).toHaveCount(0);
      for (const control of await app.locator('input:not([type="hidden"]), select, textarea').all()) {
        if (await control.isVisible()) await expect(control).toHaveAccessibleName(/.+/);
      }
      expect(await app.locator('div').evaluateAll((nodes) => nodes.filter((node) => node.onclick !== null).map((node) => node.outerHTML.slice(0, 160)))).toEqual([]);
      await keyboardFocus(page, app);
      await mainFitsViewport(page, width, 'after keyboard traversal');
      console.log('ACCESSIBILITY_FLOOR', route, width);
    }
  });
}

test('all landing figures expose every value as text when image requests are disabled', async ({ page }) => {
  test.setTimeout(120_000);
  await page.route('**/*', (route) => route.request().resourceType() === 'image' ? route.abort() : route.continue());
  await page.setViewportSize({ width: 1440, height: 900 });

  // Home #evidence: seven ranked SVG columns with value labels + phase captions.
  await page.goto('/');
  const evidence = page.locator('#evidence figure svg[role="img"]');
  await expect(evidence.locator('rect')).toHaveCount(7);
  const evidenceTexts = await evidence.evaluate((node) =>
    [...node.querySelectorAll('text')].map((t) => t.textContent?.trim() ?? ''),
  );
  for (const value of ['72', '58', '52', '32', '27', '14', '10']) {
    expect(evidenceTexts, `home value label ${value} is text, not pixels`).toContain(value);
  }
  for (const phase of ['CONSOLIDATING', 'DEVELOPING', 'EMERGING', 'BEGINNING']) {
    expect(evidenceTexts, `home phase caption ${phase}`).toContain(phase);
  }

  // Diagnose: the subskill profile rows keep the 27-subskill spread readable.
  await page.goto('/diagnose');
  const profile = section(page, 'Unpack the placement score');
  await expect(profile.locator('figure')).toBeVisible();
  await expect(profile.getByText('SchoolTest Reading subskill profile', { exact: true })).toBeVisible();
  const widths = await profile.locator('figure span[style*="width:"]').evaluateAll((nodes) =>
    nodes.map((node) => (node as HTMLElement).style.width),
  );
  expect(widths).toEqual(['72%', '14%', '52%', '58%', '32%', '27%', '10%']);

  // Teach: the Ask AI exchange carries the specific answer as text.
  await page.goto('/teach');
  const askAi = section(page, 'Ask AI');
  await expect(
    askAi.getByText(
      'Six students sit at Emerging or below on inference: Aisha, Mateo, Priya, Deng, Yuki and Sam. They can decode fluently but miss implied meaning - a good small group to start with.',
    ),
  ).toBeVisible();

  // Track: the grouped figure's 16 columns with all 16 values as text.
  await page.goto('/track');
  const trackSvg = section(page, 'Progress chart').locator('svg[role="img"]');
  await expect(trackSvg.locator('rect')).toHaveCount(16);
  const trackTexts = await trackSvg.evaluate((node) =>
    [...node.querySelectorAll('text')].map((t) => t.textContent?.trim() ?? ''),
  );
  for (const value of ['24', '42', '66', '84', '18', '30', '52', '72', '36', '44', '58', '68', '16', '20', '26', '34']) {
    expect(trackTexts, `track value label ${value} is text, not pixels`).toContain(value);
  }

  // Predict: the cohort figure's 8 columns with all 8 values as text.
  await page.goto('/predict');
  const predictSvg = section(page, 'Cohort chart').locator('svg[role="img"]');
  await expect(predictSvg.locator('rect')).toHaveCount(8);
  const predictTexts = await predictSvg.evaluate((node) =>
    [...node.querySelectorAll('text')]
      .filter(
        (t) =>
          Number(t.getAttribute('x') ?? 0) > 150 &&
          /^\d+$/.test((t.textContent ?? '').trim()),
      )
      .map((t) => t.textContent?.trim() ?? ''),
  );
  expect(predictTexts).toEqual(['9', '3', '6', '5', '5', '8', '2', '6']);
});

for (const width of [1440, 375]) {
  test(`visual inventory: every sectioned surface on all five pages at ${width}px`, async ({
    page,
  }, info) => {
    test.setTimeout(240_000);
    const height = width === 375 ? 812 : 900;
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const route of routes) {
      // Every label names exactly one section on its own page.
      expect(new Set(SCREENS[route]).size, `unique surfaces on ${route}`).toBe(
        SCREENS[route].length,
      );
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      await mainFitsViewport(page, width, 'after load and fonts');
      for (const label of SCREENS[route]) {
        const target = page.locator(`[data-screen-label="${label}"]`);
        await expect(target, `${label} on ${route}`).toHaveCount(1);
        await target.scrollIntoViewIfNeeded();
        await target
          .locator('img')
          .evaluateAll((images) =>
            Promise.all(
              images.map((image) => {
                if (!(image instanceof HTMLImageElement)) throw new Error('Expected an HTML image');
                return image.decode();
              }),
            ),
          );
      }
      // Fact-table cells stay inside their cells at every width. The teach
      // strip keeps one sanctioned 375px exception (the 20px bold
      // "Pseudonymised" overflows its two-up cell by a few pixels), so the
      // flag only fires on a real loss of more than that.
      const clippedFacts = await page
        .locator('dl dt, dl dd')
        .evaluateAll((nodes) =>
          nodes
            .filter((node) => node.scrollWidth > node.clientWidth + 24)
            .map((node) => ({ text: node.textContent, scrollWidth: node.scrollWidth, clientWidth: node.clientWidth })),
        );
      expect(clippedFacts, `Clipped facts on ${route} at ${width}px`).toEqual([]);
      const body = await page.screenshot({ fullPage: true, type: 'png' });
      await info.attach(`15-${route === '/' ? 'home' : route.slice(1)}-${width}`, {
        body,
        contentType: 'image/png',
      });
      console.log('SURFACES_CAPTURED', route, width, SCREENS[route].length);
      await mainFitsViewport(page, width, 'after all surface captures');
    }
  });
}

test('journey: all five pages and the full expression-of-interest flow', async ({ page, request }, info) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect((await request.get(`${api}/api/health`)).ok()).toBe(true);
  await test.step('1. home chrome, hardcoded pilot notice and hero', async () => {
    await page.goto('/');
    await expect(page.locator('div[data-screen-label="Notice"]')).toContainText(
      'Pilot testing in term 4, 2026. Become a founding school and contribute to the design and development of SchoolTest.',
    );
    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Diagnostic and progress testing for HSP',
    );
  });
  await test.step('2. programme band and five facts', async () => {
    await page.goto('/#programme');
    await expect(page.locator('#programme')).toBeVisible();
    await expect(page.locator('#programme dl dt')).toHaveCount(5);
    await expect(page.locator('#programme dl dd')).toHaveCount(10);
  });
  await test.step('3. component grid, truthful field-testing state and the 06 pilot card', async () => {
    const cards = section(page, 'Five programme components').locator('a.st-gcard');
    await expect(cards).toHaveCount(6);
    // Cards 01–04 point into the sub-pages; card 05 anchors to the evidence
    // band on the same page, and the dark 06 card registers.
    for (const [index, href] of ['/diagnose', '/teach', '/track', '/predict', '#evidence', '#register'].entries()) {
      await expect(cards.nth(index)).toHaveAttribute('href', href);
    }
    const hero = section(page, 'Hero');
    await expect(hero.getByText('Field testing with', { exact: true })).toBeVisible();
    for (const school of ['John Paul College', 'Ivanhoe Grammar', 'Moreton Bay College']) {
      await expect(hero.getByRole('img', { name: school, exact: true })).toBeVisible();
    }
    await expect(
      section(page, 'Five programme components').getByText('Pilot testing is open. Join the pilot now.'),
    ).toBeVisible();
  });
  await test.step('4. component grid into Diagnose profile', async () => {
    await section(page, 'Five programme components').locator('a[href="/diagnose"]').click();
    await expect(page).toHaveURL(/\/diagnose$/);
    const profile = section(page, 'Unpack the placement score');
    await expect(profile.locator('figure span[style*="width:"]')).toHaveCount(7);
    await expect(
      section(page, 'Same score different students').getByRole('heading', {
        name: 'Same score. Different abilities.',
      }),
    ).toBeVisible();
  });
  await test.step('5. next-nav to Teach', async () => {
    await section(page, 'Next').locator('a[href="/teach"]').click();
    await expect(page).toHaveURL(/\/teach$/);
    await expect(
      section(page, 'Generate the materials').getByText('No student names appear in any export.'),
    ).toBeVisible();
    await expect(
      section(page, 'Ask AI').getByText('Which students need work on inference?', { exact: true }),
    ).toBeVisible();
  });
  await test.step('6. primary nav to Track', async () => {
    await primary(page).getByRole('link', { name: 'Track', exact: true }).click();
    await expect(page).toHaveURL(/\/track$/);
    const trail = section(page, 'Evidence trail');
    for (const [term, phase] of [
      ['Term 1', 'Emerging'],
      ['Term 2', 'Emerging'],
      ['Term 3', 'Developing'],
      ['Term 4', 'Consolidating'],
    ] as const) {
      await expect(trail.locator('li').filter({ hasText: term })).toContainText(phase);
    }
  });
  await test.step('7. primary nav to Predict', async () => {
    await primary(page).getByRole('link', { name: 'Predict', exact: true }).click();
    await expect(page).toHaveURL(/\/predict$/);
    const individual = section(page, 'The individual');
    for (const value of ['34%', '81%']) {
      await expect(individual.getByText(value, { exact: true })).toBeVisible();
    }
    await expect(section(page, 'Cohort chart').locator('svg[role="img"] rect')).toHaveCount(8);
  });
  await test.step('8. CTA to the five-field expression-of-interest form and its success state', async () => {
    await section(page, 'Register').locator('a[href="/#register"]').click();
    await expect(page).toHaveURL(/\/#register$/);
    const form = page.locator('#register form');
    await expect(form.locator('input, select')).toHaveCount(5);
    await form.getByLabel('Your name', { exact: true }).fill('Acceptance Reviewer');
    await form.getByLabel('School', { exact: true }).fill('Acceptance Test School');
    await form.getByLabel('Your role', { exact: true }).selectOption({ label: 'Head of department' });
    await form.getByLabel('Work email', { exact: true }).fill('acceptance@schooltest.local');
    await form.getByLabel('Number of students', { exact: true }).selectOption({ label: '21–50' });
    // The redesigned form confirms client-side: the success panel replaces the
    // form without leaving the page.
    await form.getByRole('button', { name: 'Submit expression of interest', exact: true }).click();
    const status = page.locator('#register [role="status"]');
    await expect(status).toContainText('Expression of interest received');
    await expect(form).toHaveCount(0);
    await status.scrollIntoViewIfNeeded();
    await screenshot(page, info, 'S15-submitted-1440');
  });
  await test.step('9. footer Report link reaches the new page; masthead returns home', async () => {
    await page.getByRole('contentinfo').getByRole('link', { name: 'Report', exact: true }).click();
    await expect(page).toHaveURL(/\/report$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.getByRole('banner').getByRole('link', { name: 'SchoolTest' }).click();
    await expect(page).toHaveURL(/\/$/);
  });
  await test.step('10. masthead sign-in reaches the auth surface', async () => {
    await page.getByRole('banner').getByRole('link', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/sign-in(?:\?.*)?$/);
  });
  console.log('JOURNEY_COMPLETE', JSON.stringify({ passes: 1 }));
});
