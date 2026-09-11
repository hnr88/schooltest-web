/**
 * ops-empty-audit proof — the design's two EMPTY blocks measured on the live
 * surfaces (`Ops Portal.dc.html:188-195` schools list, `:412-415` tab tables).
 * Signs in as ops, drives the schools list into a no-match (gibberish search)
 * and opens a bare fixture school (no admins/teachers/students/classes, via
 * the real fixture write) so every tab shows its true-empty arm. Each state is
 * screenshot into tests/proofs/empty-states/ and its computed styles are
 * asserted against the design numbers (46px radius-14 tile + 40px navy CTA on
 * the list; plain centered 15/600 + 13.5 with NO icon and NO CTA in the tabs).
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type Locator } from '@playwright/test';

import { cat, loadMessages } from '../helpers/i18n';
import { loginAs } from '../helpers/roles';
import { OpsFixtureLedger, createOpsFixtureSchool } from '../helpers/ops-portal';

const en = loadMessages('en');
const OUT_DIR = path.resolve(__dirname, '../../proofs/empty-states');
const TIMEOUT = 30_000;

test.describe.configure({ mode: 'serial' });

let schoolId = '';
const ledger = new OpsFixtureLedger();

test.beforeAll(async ({ request }) => {
  schoolId = (await createOpsFixtureSchool(request, ledger, 'ops-empty-proof')).documentId;
});

test.afterAll(async ({ request }) => {
  await ledger.cleanup(request);
});

/** The design numbers, asserted off the DOM's computed styles. */
async function expectDesignStyles(empty: Locator, decor: 'icon' | 'plain') {
  const styles = await empty.evaluate((node) => {
    const h2 = node.querySelector('h2');
    const p = node.querySelector('p');
    if (h2 === null || p === null) throw new Error('empty state lost its title/body');
    const cs = (el: Element) => getComputedStyle(el);
    const title = cs(h2);
    const body = cs(p);
    const tile = node.querySelector('svg');
    const button = node.querySelector('button');
    const tileBox = tile?.parentElement?.getBoundingClientRect();
    const tileCs = tile?.parentElement ? cs(tile.parentElement) : null;
    const buttonCs = button ? cs(button) : null;
    return {
      padY: cs(node).paddingTop,
      titleSize: title.fontSize,
      titleWeight: title.fontWeight,
      titleColor: title.color,
      bodySize: body.fontSize,
      bodyColor: body.color,
      bodyMarginTop: body.marginTop,
      tile: tileBox ? `${Math.round(tileBox.width)}x${Math.round(tileBox.height)}` : null,
      tileRadius: tileCs?.borderRadius ?? null,
      tileBg: tileCs?.backgroundColor ?? null,
      buttonHeight: buttonCs?.height ?? null,
      buttonRadius: buttonCs?.borderRadius ?? null,
      buttonBg: buttonCs?.backgroundColor ?? null,
    };
  });
  expect(styles.titleSize, 'title 15px').toBe('15px');
  expect(styles.titleWeight, 'title 600').toBe('600');
  expect(styles.titleColor, 'title navy').toBe('rgb(14, 35, 80)');
  expect(styles.bodySize, 'body 13.5px').toBe('13.5px');
  expect(styles.bodyColor, 'body grey').toBe('rgb(124, 134, 152)');
  expect(styles.bodyMarginTop, 'body margin-top 5px').toBe('5px');
  if (decor === 'icon') {
    // :188-195 — 56px block, 46px radius-14 #F4F6FA tile, 40px navy pill CTA.
    expect(styles.padY).toBe('56px');
    expect(styles.tile).toBe('46x46');
    expect(styles.tileRadius).toBe('14px');
    expect(styles.tileBg).toBe('rgb(244, 246, 250)');
    expect(styles.buttonHeight).toBe('40px');
    // `border-radius:999px` computes to its clamped USED value in Chrome
    // (≈3.4e7px on this button) — assert "far rounder than the 20px half-height".
    expect(Number.parseFloat(styles.buttonRadius ?? '0')).toBeGreaterThan(1000);
    expect(styles.buttonBg).toBe('rgb(14, 35, 80)');
  } else {
    // :412-415 — 52px block, no icon, no CTA.
    expect(styles.padY).toBe('52px');
    expect(styles.tile, 'no icon tile').toBeNull();
    expect(styles.buttonHeight, 'no CTA').toBeNull();
  }
}

async function capture(page: import('@playwright/test').Page, name: string) {
  await mkdir(OUT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true });
}

test('ops empty states match the design blocks', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`${page.url()}: ${error.message}`));

  await loginAs(page, 'ops');

  // ---- schools list, search no-match → the ICON block (:188-195) ----
  await page.goto('/dashboard/ops/schools');
  const search = page.getByTestId('ops-schools-search');
  await expect(search).toBeVisible({ timeout: TIMEOUT });
  await search.fill('zzqqx no such school');
  const schoolsEmpty = page.locator('[data-slot="directory-empty"]');
  await expect(schoolsEmpty).toBeVisible({ timeout: TIMEOUT });
  expect(await schoolsEmpty.getAttribute('data-decor')).toBe('icon');
  await expectDesignStyles(schoolsEmpty, 'icon');
  await capture(page, 'schools-list-nomatch');

  // ---- bare fixture school: every tab true-empty → the PLAIN block (:412-415) ----
  await page.goto(`/dashboard/ops/schools/${schoolId}`);
  for (const [tabKey, messageKey] of [
    ['admins', 'Ops.schoolTables.tab.admins'],
    ['teachers', 'Ops.schoolTables.tab.teachers'],
    ['students', 'Ops.schoolTables.tab.students'],
    ['classes', 'Ops.schoolTables.tab.classes'],
  ] as const) {
    await page
      .getByRole('tab', { name: cat(en, messageKey), exact: true })
      .click({ timeout: TIMEOUT });
    const empty = page.locator('[data-slot="directory-empty"]');
    await expect(empty).toBeVisible({ timeout: TIMEOUT });
    expect(await empty.getAttribute('data-decor'), `${tabKey} plain`).toBe('plain');
    await expectDesignStyles(empty, 'plain');
    await capture(page, `tab-${tabKey}-empty`);
    if (tabKey === 'students') {
      // The tab no-match serves through the SAME plain block (`:1296-1298`).
      // The tab toolbar's search is `type="search"` → role searchbox.
      const box = page.getByPlaceholder(cat(en, 'Ops.schoolTables.studentsSearchPlaceholder'));
      await box.fill('zzqqx no such student');
      await expect(empty).toBeVisible({ timeout: TIMEOUT });
      expect(await empty.getAttribute('data-decor')).toBe('plain');
      await expectDesignStyles(empty, 'plain');
      await capture(page, 'tab-students-nomatch');
    }
  }

  expect(errors, errors.join('\n')).toEqual([]);
});
