/**
 * UI-CLASS-AVATAR — on the school-admin Classes list and class detail, the
 * class badge chip's label stays inside the chip and never runs into the class
 * name, at 1280, 1440 and 390 wide, for the seeded "Reading 8A — Farsi" class
 * and for a long class name.
 *
 * Real stack: schooladmin-b signs in through the portal form; the long-named
 * class is created, and deleted afterwards, through the admin's own API.
 * Screenshots: $BUG_PROOF_DIR/UI-CLASS-AVATAR/<PROOF_PHASE>-*.png.
 */
import fs from 'node:fs';
import path from 'node:path';

import { expect, test, type Locator, type Page } from '@playwright/test';

import { roleCredentials } from './helpers/credentials';
import { loginCached } from './helpers/http';
import { loginAs } from './helpers/roles';

const API = 'http://127.0.0.1:5500';
const PROOF_DIR = path.join(
  process.env.BUG_PROOF_DIR ?? '/Users/hunor.nagy/Desktop/live_feedback_1/proof',
  'UI-CLASS-AVATAR',
);
const PHASE = process.env.PROOF_PHASE ?? 'after';
const WIDTHS = [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
] as const;
const SEEDED = 'Reading 8A — Farsi (School B)';
const LONG = `Comprehensive Reading Intervention Programme — Year 10 Honours Extension Stream ${Date.now()}`;

let jwt = '';
let longId = '';

interface Geometry {
  label: string;
  chipLeft: number;
  chipRight: number;
  textLeft: number;
  textRight: number;
  nameLeft: number;
  overlapsName: boolean;
}

async function geometry(chip: Locator, name: Locator): Promise<Geometry> {
  const nameBox = await name.evaluate((el) => {
    const b = el.getBoundingClientRect();
    return { left: b.left, right: b.right, top: b.top, bottom: b.bottom };
  });
  return chip.evaluate((el, n) => {
    const box = el.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(el);
    const text = range.getBoundingClientRect();
    const right = Math.max(box.right, text.right);
    const left = Math.min(box.left, text.left);
    const overlapsName =
      left < n.right - 0.5 && right > n.left + 0.5 && box.top < n.bottom && box.bottom > n.top;
    return {
      label: el.textContent ?? '',
      chipLeft: box.left,
      chipRight: box.right,
      textLeft: text.left,
      textRight: text.right,
      nameLeft: n.left,
      overlapsName,
    };
  }, nameBox);
}

function expectContained(g: Geometry, where: string): void {
  expect
    .soft(g.textLeft, `${where}: badge "${g.label}" starts inside its chip`)
    .toBeGreaterThanOrEqual(g.chipLeft - 0.5);
  expect
    .soft(g.textRight, `${where}: badge "${g.label}" ends inside its chip`)
    .toBeLessThanOrEqual(g.chipRight + 0.5);
  expect.soft(g.overlapsName, `${where}: badge "${g.label}" overlaps the class name`).toBe(false);
}

async function shot(page: Page, name: string, target?: Locator): Promise<void> {
  fs.mkdirSync(PROOF_DIR, { recursive: true });
  const file = path.join(PROOF_DIR, `${PHASE}-${name}.png`);
  if (target) await target.screenshot({ path: file });
  else await page.screenshot({ path: file, fullPage: true });
}

test.beforeAll(async ({ request }) => {
  jwt = await loginCached(request, API, roleCredentials('schoolAdminB'));
  const res = await request.post(`${API}/api/schools/me/classes`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: { name: LONG },
  });
  expect(res.status(), await res.text()).toBe(201);
  longId = ((await res.json()) as { data: { documentId: string } }).data.documentId;
});

test.afterAll(async ({ request }) => {
  if (!longId) return;
  const res = await request.delete(`${API}/api/schools/me/classes/${longId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.ok()).toBe(true);
});

test('the class badge chip never overlaps the class name (list + detail, 1280/1440/390)', async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  const list = await request.get(`${API}/api/schools/me/classes`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const rows = ((await list.json()) as { data: Array<{ documentId: string; name: string }> }).data;
  const seededId = rows.find((row) => row.name === SEEDED)?.documentId;
  expect(seededId, `seeded class "${SEEDED}" exists in School B`).toBeTruthy();

  await loginAs(page, 'schoolAdminB');

  for (const size of WIDTHS) {
    await page.setViewportSize(size);
    await page.goto('/dashboard/school/classes');
    const screen = page.locator('[data-slot="school-classes"]');
    for (const name of [SEEDED, LONG]) {
      const link = screen.locator('a[data-row-href]').filter({ hasText: name });
      await expect(link).toBeVisible({ timeout: 30_000 });
      await page.evaluate(() => document.fonts.ready);
      const g = await geometry(
        link.locator('span[aria-hidden="true"]').first(),
        link.getByTitle(name, { exact: true }),
      );
      expectContained(g, `list @${size.width} "${name}"`);
      await shot(
        page,
        `list-${size.width}-row-${name === LONG ? 'long' : 'seeded'}`,
        link.locator('xpath=ancestor::*[@role="row"][1]'),
      );
    }
    await shot(page, `list-${size.width}`);

    for (const [slug, id, name] of [
      ['seeded', seededId, SEEDED],
      ['long', longId, LONG],
    ] as const) {
      await page.goto(`/dashboard/school/classes/${id}`);
      const heading = page
        .locator('[data-slot="school-class-detail"]')
        .getByRole('heading', { level: 1, name });
      await expect(heading).toBeVisible({ timeout: 30_000 });
      await page.evaluate(() => document.fonts.ready);
      const chip = heading.locator('xpath=../preceding-sibling::span[@aria-hidden="true"][1]');
      expectContained(await geometry(chip, heading), `detail @${size.width} "${name}"`);
      await shot(page, `detail-${size.width}-${slug}`);
    }
  }
});
