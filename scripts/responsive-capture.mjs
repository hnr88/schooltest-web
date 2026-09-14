// Viewport-sized captures at scroll offsets for close visual review.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const OUT = process.argv[2] || '/tmp/responsive-vp';

const jobs = JSON.parse(process.argv[3] || 'null') || [
  { page: '/', name: 'home', offsets: [0, 1, 2, 3, 4] },
  { page: '/sign-in', name: 'sign-in', offsets: [0, 1] },
  { page: '/sign-up', name: 'sign-up', offsets: [0, 1, 2] },
  { page: '/track', name: 'track', offsets: [0, 1, 2] },
  { page: '/articles', name: 'articles', offsets: [0, 1] },
  { page: '/teach', name: 'teach', offsets: [0, 1, 2] },
];

const vps = JSON.parse(process.argv[4] || 'null') || [
  { w: 320, h: 568, name: '320' },
  { w: 375, h: 667, name: '375' },
];

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

for (const vp of vps) {
  const context = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  for (const job of jobs) {
    await page.goto(BASE + job.page, { timeout: 90_000, waitUntil: 'load' });
    await page.waitForTimeout(1000);
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const vh = vp.h;
    for (const off of job.offsets) {
      const y = Math.min(Math.round((total - vh) * (off / Math.max(job.offsets.length - 1, 1))), Math.max(total - vh, 0));
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(400);
      const dir = path.join(OUT, `${vp.name}/${job.name}`);
      fs.mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: path.join(dir, `y${y}.png`) });
    }
    console.log(`${vp.name} ${job.name}: height=${total}`);
  }
  await context.close();
}
await browser.close();
console.log('done');
