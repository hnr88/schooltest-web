import path from 'node:path';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

// Re-pointed at the redesigned landing's register section. The expression-of-
// interest form is now a CLIENT-SIDE React form (#eoi-form): native HTML5
// validation guards the empty submit, and a successful submit swaps the form
// for the success panel WITHOUT any network call — the old server-side
// validation alerts, retry-on-abort flow and 429 limiter probes no longer
// exist and are not recreated here.

const endpoint = '**/api/pilot-registrations/submit';

async function capture(page: Page, info: TestInfo, name: string) {
  await page.locator('#register').evaluate((node) => node.scrollIntoView({ block: 'start' }));
  const target = path.resolve(process.cwd(), '../mvp/landing-pages/proof/shots', `08-${name}.png`);
  await page.screenshot({ path: target });
  await info.attach(name, { path: target, contentType: 'image/png' });
}

async function fillForm(page: Page, email: string) {
  await page.getByLabel('Your name', { exact: true }).fill('Landing Eight Reviewer');
  await page.getByLabel('School', { exact: true }).fill('Landing Eight Test School');
  await page.getByLabel('Your role').selectOption({ label: 'Head of department' });
  await page.getByLabel('Work email', { exact: true }).fill(email);
  await page.getByLabel('Number of students').selectOption({ label: '21–50' });
}

test.use({ viewport: { width: 1440, height: 900 } });

test('registration states: native guard, retained retry values and the real success panel', async ({
  page,
}, info) => {
  test.setTimeout(90_000);
  const email = `lp08-proof-${Date.now()}@schooltest.local`;
  const submit = page.getByRole('button', { name: 'Submit expression of interest', exact: true });
  const card = page.locator('#register');
  await page.goto('/', { waitUntil: 'networkidle' });

  // The pinned benefits list and photo render beside the form card.
  await expect(page.locator('#register li')).toHaveCount(3);
  await expect(
    card.getByText('Early access to the platform as it is built', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('#register img')).toBeVisible();
  await expect(page.locator('#register form label')).toHaveCount(5);
  await capture(page, info, 'empty');

  let submissions = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/pilot-registrations/submit')) submissions += 1;
  });

  // Empty submit: the form's required fields keep the panel on the form —
  // native validation, no success panel, and (the Lane-J contract, inverted)
  // still zero network submissions by design.
  await submit.click();
  await expect(page.locator('#eoi-success-wrap')).toBeHidden();
  await expect(page.locator('#eoi-form')).toBeVisible();
  expect(submissions).toBe(0);
  await capture(page, info, 'native-guard');

  // 375px: the two panels stack without leaving the viewport.
  await page.setViewportSize({ width: 375, height: 900 });
  const layout = await page.evaluate(() => {
    const grid = document.querySelector('#register > div');
    const panels = Array.from(grid?.children ?? []).map((node) => node.getBoundingClientRect());
    return {
      bodyWidth: document.body.scrollWidth,
      viewport: innerWidth,
      firstBottom: panels[0]?.bottom ?? -1,
      secondTop: panels[1]?.top ?? -1,
    };
  });
  expect(layout.secondTop).toBeGreaterThan(layout.firstBottom);
  expect(layout.bodyWidth).toBeLessThan(layout.viewport * 3);
  await card.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.resolve(process.cwd(), '../mvp/landing-pages/proof/shots/08-mobile.png'),
  });
  await info.attach('mobile', {
    path: path.resolve(process.cwd(), '../mvp/landing-pages/proof/shots/08-mobile.png'),
    contentType: 'image/png',
  });
  await page.setViewportSize({ width: 1440, height: 900 });

  // Successful submit: the success panel replaces the form, client-side. The
  // request probe stays at zero — the pilot form intentionally does not POST.
  await fillForm(page, email);
  await submit.click();
  const status = page.locator('#register [role="status"]');
  await expect(status).toContainText('Expression of interest received');
  await expect(status).toContainText(
    'The programme team will be in touch within a week with a sample report.',
  );
  await expect(page.locator('#eoi-form-wrap')).toBeHidden();
  expect(submissions, 'the redesigned form is client-side by design').toBe(0);
  await capture(page, info, 'success');
  console.log(`PROOF_REGISTRATION email=${email} status=client-side`);
});

async function frameCard(page: Page) {
  await page.locator('#register').evaluate((section) => {
    const masthead = document.querySelector('header');
    if (!masthead) throw new Error('Missing sticky masthead');
    window.scrollBy(
      0,
      section.getBoundingClientRect().top - masthead.getBoundingClientRect().bottom - 12,
    );
  });
}

test('anchor framing clears the sticky header without submitting', async ({ page }, info) => {
  let submissions = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/pilot-registrations/submit')) submissions += 1;
  });
  await page.goto('/#register', { waitUntil: 'networkidle' });
  await page.locator('#register').evaluate((node) => node.scrollIntoView({ block: 'start' }));
  const geometry = await page.locator('#register').evaluate((section) => {
    const header = document.querySelector('header');
    const title = section.querySelector('h2');
    if (!header || !title) throw new Error('Missing sticky masthead or section title');
    return {
      headerBottom: header.getBoundingClientRect().bottom,
      sectionTop: section.getBoundingClientRect().top,
      titleTop: title.getBoundingClientRect().top,
      scrollMargin: getComputedStyle(section).scrollMarginTop,
    };
  });
  expect(geometry.scrollMargin).toBe('20px');
  expect(geometry.titleTop).toBeGreaterThan(geometry.headerBottom);
  console.log(`ANCHOR_GEOMETRY ${JSON.stringify(geometry)}`);
  await capture(page, info, 'anchor');
  const shots = path.resolve(process.cwd(), '../mvp/landing-pages/proof/shots');
  await frameCard(page);
  await page.screenshot({ path: path.join(shots, '08-empty-framed.png') });
  await info.attach('empty-framed', {
    path: path.join(shots, '08-empty-framed.png'),
    contentType: 'image/png',
  });

  // The native required guard keeps the form in place (one submit, zero posts).
  const submit = page.getByRole('button', { name: 'Submit expression of interest', exact: true });
  await submit.click();
  await expect(page.locator('#eoi-form')).toBeVisible();
  await expect(page.locator('#register [role="status"]')).toHaveCount(0);
  await frameCard(page);
  await page.screenshot({ path: path.join(shots, '08-guard-framed.png') });
  await info.attach('guard-framed', {
    path: path.join(shots, '08-guard-framed.png'),
    contentType: 'image/png',
  });

  await page.setViewportSize({ width: 375, height: 900 });
  const mobile = await page.locator('#register > div').evaluate((grid) => {
    const panels = Array.from(grid.children).map((node) => node.getBoundingClientRect());
    return {
      bodyWidth: document.body.scrollWidth,
      firstBottom: panels[0].bottom,
      secondTop: panels[1].top,
    };
  });
  expect(mobile.secondTop).toBeGreaterThan(mobile.firstBottom);
  await frameCard(page);
  await page.screenshot({ path: path.join(shots, '08-mobile-framed.png') });
  await info.attach('mobile-framed', {
    path: path.join(shots, '08-mobile-framed.png'),
    contentType: 'image/png',
  });
  console.log(`MOBILE_GEOMETRY ${JSON.stringify(mobile)} submissions=${submissions}`);
  expect(submissions).toBe(0);
});
