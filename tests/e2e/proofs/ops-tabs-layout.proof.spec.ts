/**
 * Layout-repair proof for the ops school-detail tabs rendered through the
 * directory kit's flex-card row arm. Signs in as ops, opens a throwaway fixture
 * school (teachers, students and classes created through the real ops writes),
 * walks Admins / Teachers / Students / Classes and captures a full-page plus a
 * close-up (rows card only) screenshot of each tab at 1440px and 1024px,
 * recording console errors alongside. Output lives in tests/proofs/tabs/broken
 * (before the fix) and tests/proofs/tabs/fixed (after).
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { cat, loadMessages } from '../helpers/i18n';
import { loginAs } from '../helpers/roles';
import { deleteStudents } from '../helpers/student-cleanup';
import {
  OpsFixtureLedger,
  createOpsFixtureSchool,
  createOpsFixtureStudents,
  createOpsFixtureTeacher,
  fixtureHeaders,
  setOpsFixtureSeats,
} from '../helpers/ops-portal';
import { loginCached } from '../helpers/http';
import { roleCredentials } from '../helpers/credentials';
import { OPS_PORTAL_VERSION, OPS_PORTAL_VERSION_HEADER } from '@schooltest/ops-contracts';

const en = loadMessages('en');
const ACTION_TIMEOUT = 30_000;
const OUT_ROOT = path.resolve(__dirname, '../../proofs/tabs');

const VIEWPORTS = [
  { label: '1440', width: 1440, height: 900 },
  { label: '1024', width: 1024, height: 768 },
] as const;

let schoolId = '';
let studentIds: string[] = [];
const ledger = new OpsFixtureLedger();

async function opsHeaders(request: APIRequestContext) {
  return fixtureHeaders('ops', await loginCached(request, 'http://127.0.0.1:5500', roleCredentials('opsApi')));
}

test.describe.configure({ timeout: 240_000, mode: 'serial' });

test.beforeAll(async ({ request }) => {
  test.setTimeout(120_000);
  schoolId = (await createOpsFixtureSchool(request, ledger, 'ops-tabs-proof')).documentId;
  // A teacher row for the Admins/Teachers directories; the class create is the
  // REAL ops write (task 23). Two classes, both unassigned — the fixture
  // teacher is email-unconfirmed, so assign-teacher would 403; the unassigned
  // shape is the design's own "No teacher" column case.
  await createOpsFixtureTeacher(request, ledger, schoolId, 'ops-tabs-proof');
  const headers = await opsHeaders(request);
  for (const name of ['Proof Class Alpha', 'Proof Class Beta']) {
    const res = await request.post(`http://127.0.0.1:5500/api/ops/schools/${schoolId}/classes`, {
      headers,
      data: { name, year_band: '7' },
    });
    expect(res.status(), await res.text()).toBe(201);
  }
  await setOpsFixtureSeats(request, schoolId, 25);
  // A pending ADMIN invitation, so the Admins tab's merged Invited arm (the
  // invitation-row shape: email title, dashes for specialty/activity, Invited
  // pill, menu) renders in the captures too.
  const invite = await request.post(
    `http://127.0.0.1:5500/api/ops/schools/${schoolId}/admin-invitations`,
    {
      headers,
      data: {
        email: `invited.${Date.now().toString(36)}@fixture.schooltest.local`,
        first_name: 'Invited',
        last_name: 'Admin',
      },
    },
  );
  expect(invite.status(), await invite.text()).toBeLessThan(300);
  studentIds = await createOpsFixtureStudents(request, schoolId, 3);
});

test.afterAll(async ({ request }) => {
  await deleteStudents(request, studentIds);
  await ledger.cleanup(request);
});

async function captureRows(page: Page, tabKey: string, dir: 'broken' | 'fixed') {
  await page.waitForTimeout(600); // settle fonts/images

  // Geometry log: the first row's child boxes, so layout regressions are
  // measurable from the run output, not only from the PNGs.
  const firstRow = page.locator('[data-directory-row]').first();
  if (await firstRow.isVisible()) {
    const dump = await firstRow.evaluate((row) => {
      const r = row.getBoundingClientRect();
      const chain = [] as string[];
      let node: HTMLElement | null = row.parentElement;
      for (let i = 0; node && i < 12; i += 1) {
        chain.push(`${node.getAttribute('data-slot') ?? node.tagName}@${Math.round(node.getBoundingClientRect().width)}`);
        node = node.parentElement;
      }
      const kids = Array.from(row.children).map((child) => {
        const b = child.getBoundingClientRect();
        return `x=+${Math.round(b.x - r.x)} w=${Math.round(b.width)} lineY=${Math.round(b.y - r.y)} "${(child.textContent ?? '').slice(0, 26).replace(/\s+/g, ' ').trim()}"`;
      });
      return [
        `ROW h=${Math.round(r.height)} w=${Math.round(r.width)} | chain: ${chain.join(' < ')}`,
        ...kids,
      ].join('\n');
    });
    console.log(`[proof] ${tabKey} geometry\n${dump}`);
  }

  const outDir = path.join(OUT_ROOT, dir);
  await mkdir(outDir, { recursive: true });
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(200);
    const rowBox = page.locator('[data-directory-row]').first();
    if (await rowBox.isVisible()) {
      const box = await rowBox.boundingBox();
      if (box) console.log(`[proof] ${tabKey} @${viewport.label} first row h=${Math.round(box.height)}`);
    }
    await page.screenshot({
      path: path.join(outDir, `${tabKey}-${viewport.label}-full.png`),
      fullPage: true,
    });
    const card = page.locator('[data-slot="directory-rows"]').first();
    if (await card.isVisible()) {
      await card.screenshot({ path: path.join(outDir, `${tabKey}-${viewport.label}-rows.png`) });
    }
  }
}

async function captureTab(page: Page, tabKey: string, tabName: string, dir: 'broken' | 'fixed') {
  const tab = page.getByRole('tab', { name: tabName, exact: true });
  await tab.click({ timeout: ACTION_TIMEOUT });
  await expect
    .poll(
      async () =>
        page
          .locator(
            '[data-directory-row], [data-slot="directory-empty"]',
          )
          .count(),
      { timeout: ACTION_TIMEOUT },
    )
    .toBeGreaterThan(0);
  await captureRows(page, tabKey, dir);
}

test('ops tab rows lay out as the design’s card rows', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${page.url()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`${page.url()}: ${error.message}`));

  await loginAs(page, 'ops');
  await page.goto(`/dashboard/ops/schools/${schoolId}`);
  await expect(
    page.getByRole('tab', { name: cat(en, 'Ops.schoolTables.tab.admins'), exact: true }),
  ).toBeVisible({ timeout: ACTION_TIMEOUT });

  const dir = process.env.PROOF_DIR === 'fixed' ? 'fixed' : 'broken';
  await captureTab(page, 'admins', cat(en, 'Ops.schoolTables.tab.admins'), dir);
  // The Admins tab's merged Invited arm — invitation rows are their own shape
  // (email title, no activity, Invited pill) and get their own captures.
  const invitedChip = page.getByRole('button', { name: cat(en, 'Ops.schoolTables.statusInvited'), exact: true });
  if (await invitedChip.isVisible().catch(() => false)) {
    await invitedChip.click({ timeout: ACTION_TIMEOUT });
    await expect
      .poll(async () => page.locator('[data-directory-row]').count(), { timeout: ACTION_TIMEOUT })
      .toBeGreaterThan(0);
    await captureRows(page, 'admins-invited', dir);
  }
  await captureTab(page, 'teachers', cat(en, 'Ops.schoolTables.tab.teachers'), dir);
  await captureTab(page, 'students', cat(en, 'Ops.schoolTables.tab.students'), dir);
  await captureTab(page, 'classes', cat(en, 'Ops.schoolTables.tab.classes'), dir);

  test.info().annotations.push({ type: 'console-errors', description: errors.join('\n') || 'none' });
  expect(errors, errors.join('\n')).toEqual([]);
});
