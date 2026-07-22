import { chromium, request } from '@playwright/test';
import fs from 'node:fs';

const OUT = process.argv[2] ?? 'before';
const DIR = '/tmp/claude-1000/-home-hnr-Code-schooltest/ede58a9d-0975-47c6-937c-98341dfe504b/scratchpad/shots';
fs.mkdirSync(DIR, { recursive: true });

const api = await request.newContext();
const res = await api.post('http://localhost:5500/api/auth/local', {
  data: { identifier: 'parent@schooltest.local', password: 'Parent1234!' },
});
const { jwt } = await res.json();

const browser = await chromium.launch();
for (const [name, size] of [
  ['desktop', { width: 1440, height: 1000 }],
  ['mobile', { width: 375, height: 812 }],
]) {
  const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 2 });
  await ctx.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://localhost:3100/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${DIR}/${OUT}-${name}.png`, fullPage: true });
  const overflow = await page
    .locator('html')
    .evaluate((el) => el.scrollWidth > el.clientWidth);
  console.log(name, 'overflow:', overflow, 'errors:', errors.join(' | ') || 'none');
  await ctx.close();
}
await browser.close();
