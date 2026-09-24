/**
 * Structured data + answer-engine structure on every public page, in every
 * locale: each JSON-LD block parses, the @id graph has no dangling references,
 * every type carries Google's required properties, FAQ/HowTo copy is visible
 * on the page, and the page has one <h1>, a <main> and no skipped heading level.
 *
 * Set JSONLD_REPORT_DIR to also write the extracted graphs and a summary.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { checkPageJsonLd } from './helpers/json-ld-rules';
import { PUBLIC_PATHS } from './helpers/seo';

const LOCALES = ['en', 'zh', 'ko', 'ms', 'vi', 'th'] as const;
const REPORT_DIR = process.env.JSONLD_REPORT_DIR;

function localised(pathname: string, locale: string): string {
  if (locale === 'en') return pathname;
  return pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
}

test.describe('public JSON-LD and AEO structure', () => {
  for (const locale of LOCALES) {
    for (const pathname of PUBLIC_PATHS) {
      const url = localised(pathname, locale);
      test(`flow: ${url} has a valid, connected JSON-LD graph and one h1`, async ({ page }) => {
        const response = await page.goto(url);
        expect(response?.status(), `${url} status`).toBe(200);
        // Next dev hides <body> until its stylesheets load (FOUC guard); read
        // the visible text only once the page is actually painted.
        await page.waitForFunction(() => document.body.innerText.trim().length > 0);

        const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
        const blocks = raw.map((text, index) => {
          expect(text, `${url} block ${index} must not contain a raw "<"`).not.toContain('<');
          return JSON.parse(text) as Record<string, unknown>;
        });
        const facts = await page.evaluate(() => {
          const selectors = ['h1', '[data-speakable="summary"]'];
          const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Number(h.tagName[1]));
          return {
            visibleText: (document.body.innerText ?? '').replace(/\s+/g, ' '),
            selectorHits: Object.fromEntries(selectors.map((s) => [s, document.querySelectorAll(s).length])),
            h1Count: document.querySelectorAll('h1').length,
            mainCount: document.querySelectorAll('main').length,
            skips: levels.flatMap((level, i) => (i > 0 && level > levels[i - 1] + 1 ? [`h${levels[i - 1]}->h${level}`] : [])),
          };
        });

        const errors = checkPageJsonLd(blocks, {
          locale,
          isHome: pathname === '/',
          visibleText: facts.visibleText,
          selectorHits: facts.selectorHits,
        });

        if (REPORT_DIR) {
          const dir = path.join(REPORT_DIR, 'graphs');
          mkdirSync(dir, { recursive: true });
          const name = `${locale}${pathname === '/' ? '_home' : pathname.replace(/\//g, '_')}.json`;
          writeFileSync(
            path.join(dir, name),
            JSON.stringify({ url, errors, h1Count: facts.h1Count, mainCount: facts.mainCount, skips: facts.skips, blocks }, null, 2),
          );
        }

        expect(errors, `${url} JSON-LD violations`).toEqual([]);
        expect(facts.h1Count, `${url} h1 count`).toBe(1);
        expect(facts.mainCount, `${url} main count`).toBe(1);
        expect(facts.skips, `${url} heading level skips`).toEqual([]);
      });
    }
  }
});
