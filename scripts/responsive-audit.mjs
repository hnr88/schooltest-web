// Responsive audit: loads key public pages across a device-viewport matrix,
// reports horizontal overflow + out-of-viewport elements, saves screenshots.
// Usage: node scripts/responsive-audit.mjs [outdir]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const OUT = process.argv[2] || '/tmp/responsive-audit';

const routes = process.argv[3]
  ? JSON.parse(process.argv[3])
  : [
      { path: '/', name: 'home' },
      { path: '/sign-in', name: 'sign-in' },
      { path: '/sign-up', name: 'sign-up' },
      { path: '/forgot-password', name: 'forgot-password' },
      { path: '/track', name: 'track' },
      { path: '/articles', name: 'articles' },
      { path: '/teach', name: 'teach' },
      { path: '/privacy-policy', name: 'privacy-policy' },
    ];

const viewports = [
  { w: 320, h: 568, name: '320x568-phone-se1' },
  { w: 375, h: 667, name: '375x667-iphone-se' },
  { w: 390, h: 844, name: '390x844-iphone14' },
  { w: 768, h: 1024, name: '768x1024-ipad-portrait' },
  { w: 1024, h: 768, name: '1024x768-ipad-landscape' },
  { w: 1280, h: 800, name: '1280x800-small-laptop' },
  { w: 1366, h: 768, name: '1366x768-laptop' },
];

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const report = [];

for (const vp of viewports) {
  const mobile = vp.w < 1024;
  const context = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await context.newPage();

  for (const route of routes) {
    const entry = {
      viewport: vp.name,
      page: route.name,
      url: BASE + route.path,
    };
    try {
      const resp = await page.goto(BASE + route.path, { timeout: 90_000, waitUntil: 'load' });
      entry.status = resp?.status() ?? '?';
      await page.waitForTimeout(1200);

      const audit = await page.evaluate(() => {
        const vw = window.innerWidth;
        const doc = document.documentElement;
        const offenders = [];
        const seen = new Set();
        for (const el of document.querySelectorAll('body *')) {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          const r = el.getBoundingClientRect();
          if (r.width <= 0 || r.height <= 0) continue;
          const overRight = Math.round(r.right - vw);
          const overLeft = Math.round(-r.left);
          if (overRight > 2 || overLeft > 2) {
            const key = el.tagName + '|' + (el.className || '').toString().slice(0, 80) + '|' + overRight;
            if (seen.has(key)) continue;
            seen.add(key);
            offenders.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className || '').toString().slice(0, 140),
              id: el.id || undefined,
              left: Math.round(r.left),
              right: Math.round(r.right),
              width: Math.round(r.width),
              overRight,
              overLeft,
              text: (el.textContent || '').trim().slice(0, 60) || undefined,
            });
          }
        }
        offenders.sort((a, b) => Math.max(b.overRight, b.overLeft) - Math.max(a.overRight, a.overLeft));
        return {
          vw,
          docScrollW: doc.scrollWidth,
          bodyScrollW: document.body.scrollWidth,
          hOverflow: doc.scrollWidth > vw + 2,
          offenders: offenders.slice(0, 12),
        };
      });
      // Chrome mobile expands the layout viewport (shrink-to-fit zoom-out)
      // instead of scrolling when content is too wide, so innerWidth drifts
      // from the emulated viewport width — that drift IS an overflow bug.
      audit.emulatedW = vp.w;
      audit.viewportExpansion = audit.vw - vp.w;
      audit.hOverflow = audit.hOverflow || audit.viewportExpansion > 2;
      Object.assign(entry, audit);

      const shotDir = path.join(OUT, route.name);
      fs.mkdirSync(shotDir, { recursive: true });
      await page.screenshot({
        path: path.join(shotDir, `${vp.name}.png`),
        fullPage: true,
      });
    } catch (err) {
      entry.error = String(err).slice(0, 300);
    }
    report.push(entry);
    const flag = entry.hOverflow ? ' ⚠ OVERFLOW' : '';
    console.log(`${vp.name.padEnd(24)} ${route.name.padEnd(18)} status=${entry.status ?? 'ERR'}${flag}`);
    for (const o of entry.offenders?.slice(0, 4) ?? []) {
      console.log(`    → <${o.tag} class="${o.cls.slice(0, 60)}"> right=${o.right} vw=${entry.vw} over=${o.overRight}${o.text ? ` text="${o.text.slice(0, 40)}"` : ''}`);
    }
  }
  await context.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

const problems = report.filter((r) => r.hOverflow || r.error);
console.log(`\n=== ${problems.length} page/viewport combos with problems (of ${report.length}) ===`);
for (const p of problems) {
  console.log(`${p.viewport} / ${p.page}: ${p.error ? 'ERROR ' + p.error.slice(0, 120) : 'horizontal overflow ' + p.docScrollW + '>' + p.vw}`);
}
