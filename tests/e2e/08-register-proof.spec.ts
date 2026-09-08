import path from 'node:path';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

const endpoint = '**/api/pilot-registrations/submit';
const isSubmission = (url: string) => url.endsWith('/api/pilot-registrations/submit');

async function capture(page: Page, info: TestInfo, name: string) {
  await page.locator('#register').evaluate((node) => node.scrollIntoView({ block: 'start' }));
  const target = path.resolve(process.cwd(), '../mvp/landing-pages/proof/shots', `08-${name}.png`);
  await page.screenshot({ path: target });
  await info.attach(name, { path: target, contentType: 'image/png' });
}

async function fillForm(page: Page, email: string) {
  await page.getByPlaceholder('Jane Smith').fill('Landing Eight Reviewer');
  await page.getByPlaceholder('School name').fill('Landing Eight Test School');
  await page.getByLabel('Your role').selectOption({ label: 'Head of department' });
  await page.getByPlaceholder('name@school.edu.au').fill(email);
  await page.getByLabel('Number of EAL/D students').selectOption({ label: '21–50' });
}

test.use({ viewport: { width: 1440, height: 900 } });

test('registration states, real success, retained retry values and real limiter', async ({
  page,
}, info) => {
  test.setTimeout(90_000);
  const email = `lp08-proof-${Date.now()}@schooltest.local`;
  const submit = page.getByRole('button', { name: 'Register interest', exact: true });
  const card = page.locator('#register [data-slot="data-panel"]');
  await page.goto('/eald', { waitUntil: 'networkidle' });
  await expect(card.getByRole('link', { name: 'Privacy statement' })).toHaveAttribute(
    'href',
    '/privacy-policy',
  );
  await expect(page.locator('#register form label')).toHaveCount(5);
  await expect(page.locator('#register li')).toHaveCount(3);
  await expect(page.locator('#register img')).toBeVisible();
  await capture(page, info, 'empty');

  let submissions = 0;
  page.on('request', (request) => {
    if (isSubmission(request.url())) submissions += 1;
  });
  await submit.click();
  await expect(card.getByRole('alert')).toHaveCount(5);
  expect(submissions).toBe(0);
  await capture(page, info, 'field-error');
  await page.setViewportSize({ width: 375, height: 900 });
  expect(await page.evaluate(() => document.body.scrollWidth)).toBe(375);
  const layout = await page.locator('#register > div > div').evaluate((grid) => {
    const panels = Array.from(grid.children).map((node) => node.getBoundingClientRect());
    return { firstBottom: panels[0].bottom, secondTop: panels[1].top };
  });
  expect(layout.secondTop).toBeGreaterThan(layout.firstBottom);
  await card.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.resolve(process.cwd(), '../mvp/landing-pages/proof/shots/08-mobile.png'),
  });
  await info.attach('mobile', {
    path: path.resolve(process.cwd(), '../mvp/landing-pages/proof/shots/08-mobile.png'),
    contentType: 'image/png',
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await fillForm(page, email);
  await page.route(endpoint, (route) => route.abort('failed'));
  await submit.click();
  await expect(card.getByRole('alert')).toHaveText(
    'Could not submit right now — please try again in a few minutes.',
  );
  await expect(page.getByPlaceholder('name@school.edu.au')).toHaveValue(email);
  await expect(page.getByPlaceholder('Jane Smith')).toHaveValue('Landing Eight Reviewer');
  await capture(page, info, 'network-error');
  await page.unroute(endpoint);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(endpoint, async (route) => {
    await gate;
    await route.continue();
  });
  const accepted = page.waitForResponse((response) => isSubmission(response.url()));
  await submit.click();
  await expect(submit).toBeDisabled();
  await expect(card.getByRole('status')).toHaveCount(0);
  release();
  const response = await accepted;
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ data: { received: true }, meta: {} });
  await page.unroute(endpoint);
  await expect(card.getByRole('status')).toContainText('Thanks for your interest');
  await expect(card.getByRole('heading')).toHaveText('Register your interest');
  await capture(page, info, 'success');
  console.log(`PROOF_REGISTRATION email=${email} status=200 body=${await response.text()}`);

  // Spend the remaining real IP-window requests on the same row, then prove 429.
  let limited = false;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page.goto('/eald', { waitUntil: 'networkidle' });
    await fillForm(page, email);
    const next = page.waitForResponse((result) => isSubmission(result.url()));
    await submit.click();
    const result = await next;
    console.log(
      `LIMITER_PROBE ${attempt + 1} status=${result.status()} retry-after=${result.headers()['retry-after'] ?? ''}`,
    );
    if (result.status() === 429) {
      limited = true;
      expect(Number(result.headers()['retry-after'])).toBeGreaterThan(0);
      await expect(card.getByRole('alert')).toHaveText(
        'Could not submit right now — please try again in a few minutes.',
      );
      await expect(page.getByPlaceholder('name@school.edu.au')).toHaveValue(email);
      await expect(page.getByPlaceholder('School name')).toHaveValue('Landing Eight Test School');
      await expect(submit).toBeEnabled();
      await expect(card.getByRole('status')).toHaveCount(0);
      await capture(page, info, 'rate-limit');
      break;
    }
    expect(result.status()).toBe(200);
    expect(await result.json()).toEqual({ data: { received: true }, meta: {} });
  }
  expect(limited).toBe(true);
});
async function frameCard(page: Page) {
  await page.locator('#register [data-slot="data-panel"]').evaluate((card) => {
    const masthead = document.querySelector('header');
    if (!masthead) throw new Error('Missing sticky masthead');
    window.scrollBy(
      0,
      card.getBoundingClientRect().top - masthead.getBoundingClientRect().bottom - 12,
    );
  });
}

test('anchor framing clears the sticky header without submitting', async ({ page }, info) => {
  let submissions = 0;
  page.on('request', (request) => {
    if (isSubmission(request.url())) submissions += 1;
  });
  await page.goto('/eald#register', { waitUntil: 'networkidle' });
  await page.locator('#register').evaluate((node) => node.scrollIntoView({ block: 'start' }));
  const geometry = await page.locator('#register').evaluate((section) => {
    const header = document.querySelector('header');
    const title = section.querySelector('h3');
    if (!header || !title) throw new Error('Missing sticky masthead or card title');
    return {
      headerBottom: header.getBoundingClientRect().bottom,
      sectionTop: section.getBoundingClientRect().top,
      titleTop: title.getBoundingClientRect().top,
      scrollMargin: getComputedStyle(section).scrollMarginTop,
    };
  });
  expect(geometry.scrollMargin).toBe('96px');
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
  const submit = page.getByRole('button', { name: 'Register interest', exact: true });
  await submit.click();
  await expect(page.locator('#register [role="alert"]')).toHaveCount(5);
  await fillForm(page, 'lp08-framing@schooltest.local');
  await page.getByPlaceholder('Jane Smith').fill('');
  await submit.click();
  await expect(page.locator('#register [role="alert"]')).toHaveCount(1);
  await expect(page.locator('#register [role="alert"]')).toHaveText('Please enter your full name.');
  await frameCard(page);
  await page.screenshot({ path: path.join(shots, '08-field-error-framed.png') });
  await info.attach('field-error-framed', {
    path: path.join(shots, '08-field-error-framed.png'),
    contentType: 'image/png',
  });

  await page.setViewportSize({ width: 375, height: 900 });
  const mobile = await page.locator('#register > div > div').evaluate((grid) => {
    const panels = Array.from(grid.children).map((node) => node.getBoundingClientRect());
    return {
      bodyWidth: document.body.scrollWidth,
      firstBottom: panels[0].bottom,
      secondTop: panels[1].top,
    };
  });
  expect(mobile.bodyWidth).toBe(375);
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
