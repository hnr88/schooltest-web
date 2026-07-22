import { chromium, request } from '@playwright/test';
import fs from 'node:fs';

const DIR = '/home/hnr/Code/schooltest/schooltest-web/.qa/screenshots';
fs.mkdirSync(DIR, { recursive: true });

const api = await request.newContext();
const res = await api.post('http://localhost:5500/api/auth/local', {
  data: { identifier: 'parent@schooltest.local', password: 'Parent1234!' },
});
const { jwt } = await res.json();

const browser = await chromium.launch();
for (const [name, size] of [
  ['1280', { width: 1280, height: 900 }],
  // The app scrolls in [data-slot="dashboard-content"], not the document, so a
  // fullPage shot only ever captures the viewport. A tall viewport is the only
  // way to see the whole column at once.
  ['1280-full', { width: 1280, height: 2400 }],
  ['375', { width: 375, height: 812 }],
  ['375-full', { width: 375, height: 3000 }],
]) {
  const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 1 });
  await ctx.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://localhost:3100/dashboard', { waitUntil: 'networkidle' });
  await page.locator('[data-slot="dashboard-overview"]').waitFor({ timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${DIR}/dashboard-redesign-${name}.png`, fullPage: true });
  const overflow = await page.locator('html').evaluate((el) => el.scrollWidth > el.clientWidth);
  const slots = await page.evaluate(() =>
    [...document.querySelectorAll('[data-slot^="dashboard-"]')].map((el) =>
      el.getAttribute('data-slot'),
    ),
  );
  console.log(name, 'overflow:', overflow, '| slots:', slots.join(','));
  console.log(name, 'errors:', errors.join(' | ') || 'none');
  await ctx.close();
}
await browser.close();
