/**
 * Filters/header audit proof for every ops list surface's toolbar + filter
 * area, measured element-by-element against `Ops Portal.dc.html`:
 *
 * - Schools list: caption + 32px h1, 44px w-260 pill search, 44px navy Create
 *   pill, 38px status pills with count badges, 40px pill selects (1.5px
 *   #D8DFEA border, radius 999, 13.5px/500, label hidden), blue 13.5/600 Clear
 *   filters, right 13px count + 40px sort pill.
 * - Detail tabs (Admins users/invited arms, Teachers, Classes, Students):
 *   19px/600 card title + 13px summary, 40px radius-12 Export/primary buttons,
 *   34px chips, the same 40px pill select/search language.
 *
 * Each capture prints a geometry dump (bounding box + computed styles) for the
 * audited controls, and saves 1440px screenshots — "before" into
 * tests/proofs/ops-filters-audit/, "after" (PROOF_DIR=fixed) into
 * tests/proofs/ops-filters-audit/fixed/.
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

const en = loadMessages('en');
const ACTION_TIMEOUT = 30_000;
const OUT_ROOT = path.resolve(__dirname, '../../proofs/ops-filters-audit');

let schoolId = '';
let studentIds: string[] = [];
const ledger = new OpsFixtureLedger();

test.describe.configure({ timeout: 240_000, mode: 'serial' });

test.beforeAll(async ({ request }) => {
  test.setTimeout(120_000);
  schoolId = (await createOpsFixtureSchool(request, ledger, 'ops-filters-proof')).documentId;
  await createOpsFixtureTeacher(request, ledger, schoolId, 'ops-filters-proof');
  const headers = await fixtureHeaders(
    'ops',
    await loginCached(request, 'http://127.0.0.1:5500', roleCredentials('opsApi')),
  );
  for (const name of ['Proof Class Alpha', 'Proof Class Beta']) {
    const res = await request.post(`http://127.0.0.1:5500/api/ops/schools/${schoolId}/classes`, {
      headers,
      data: { name, year_band: '7' },
    });
    expect(res.status(), await res.text()).toBe(201);
  }
  await setOpsFixtureSeats(request, schoolId, 25);
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

interface Audit {
  selector: string;
  rect: { x: number; y: number; w: number; h: number };
  fontSize: string;
  fontWeight: string;
  borderRadius: string;
  borderWidth: string;
  borderColor: string;
  color: string;
  height: string;
  width: string;
  padding: string;
}

/** Dumps rect + computed styles for every match, so the audit is measurable. */
async function audit(page: Page, label: string, selector: string): Promise<void> {
  const found = await page.locator(selector).evaluateAll(
    (nodes, sel) =>
      nodes.slice(0, 8).map<Audit>((node) => {
        const el = node as HTMLElement;
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return {
          selector: sel,
          rect: {
            x: Math.round(r.x),
            y: Math.round(r.y),
            w: Math.round(r.width),
            h: Math.round(r.height),
          },
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          borderRadius: s.borderRadius,
          borderWidth: s.borderWidth,
          borderColor: s.borderColor,
          color: s.color,
          height: s.height,
          width: s.width,
          padding: s.padding,
        };
      }),
    selector,
  );
  console.log(`[audit] ${label} (${selector}): ${JSON.stringify(found)}`);
}

async function shot(page: Page, label: string, outDir: string, locator?: ReturnType<Page['locator']>) {
  if (locator) {
    if (!(await locator.isVisible().catch(() => false))) return;
    await locator.screenshot({ path: path.join(outDir, `${label}.png`) });
    return;
  }
  await page.screenshot({ path: path.join(outDir, `${label}.png`), fullPage: true });
}

/** Toolbar/header audit shared by the schools list and every detail tab. */
async function auditChrome(page: Page, label: string, outDir: string): Promise<void> {
  await page.waitForTimeout(600);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(200);

  await audit(page, `${label} h1`, 'h1');
  await audit(page, `${label} search input`, '[data-slot="directory-toolbar"] input[type="search"], [data-testid="ops-schools-search"]');
  await audit(page, `${label} toolbar select triggers`, '[data-slot="directory-toolbar"] [data-slot="select-trigger"]');
  await audit(
    page,
    `${label} toolbar field labels`,
    '[data-slot="directory-toolbar"] [data-slot="field-shell"] label',
  );
  await audit(page, `${label} chips`, '[data-slot="directory-chip"]');
  await audit(page, `${label} status pills`, '[data-slot="ops-schools-pills"] button');
  await audit(page, `${label} count label`, '[data-slot="directory-toolbar"] p[role="status"]');
  await audit(page, `${label} clear button`, '[data-slot="directory-toolbar"] button:not([aria-haspopup])');
  await audit(page, `${label} panel header title`, '[data-slot="panel-header-row"] h2');
  await audit(page, `${label} panel header description`, '[data-slot="panel-header-row"] p');
  await audit(page, `${label} panel header buttons`, '[data-slot="panel-header-row"] button, [data-slot="panel-header-row"] a');

  await shot(page, `${label}-1440-full`, outDir);
  await shot(page, `${label}-1440-toolbar`, outDir, page.locator('[data-slot="directory-toolbar"]').first());
  await shot(page, `${label}-1440-directory`, outDir, page.locator('[data-slot="directory"]').first());
  await shot(
    page,
    `${label}-1440-header`,
    outDir,
    page.locator('[data-slot="panel-header-row"]').first(),
  );
}

test('ops list headers + filters match the design', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${page.url()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`${page.url()}: ${error.message}`));

  const outDir = process.env.PROOF_DIR === 'fixed' ? path.join(OUT_ROOT, 'fixed') : OUT_ROOT;
  await mkdir(outDir, { recursive: true });

  await loginAs(page, 'ops');

  // ---- Schools list -------------------------------------------------------
  await page.goto('/dashboard/ops/schools');
  await expect(page.locator('[data-testid="ops-schools-search"]')).toBeVisible({
    timeout: ACTION_TIMEOUT,
  });
  await expect(page.locator('[data-slot="ops-schools-pills"] button').first()).toBeVisible();
  await audit(page, 'schools caption', 'main p');
  await auditChrome(page, 'schools', outDir);

  // ---- School detail tabs -------------------------------------------------
  await page.goto(`/dashboard/ops/schools/${schoolId}`);
  const adminsTab = page.getByRole('tab', {
    name: cat(en, 'Ops.schoolTables.tab.admins'),
    exact: true,
  });
  await expect(adminsTab).toBeVisible({ timeout: ACTION_TIMEOUT });
  await adminsTab.click({ timeout: ACTION_TIMEOUT });
  await expect(page.locator('[data-directory-row], [data-slot="directory-empty"]').first()).toBeVisible({
    timeout: ACTION_TIMEOUT,
  });
  await auditChrome(page, 'admins', outDir);

  // The merged Invited arm.
  const invitedChip = page.getByRole('button', {
    name: cat(en, 'Ops.schoolTables.statusInvited'),
    exact: true,
  });
  if (await invitedChip.isVisible().catch(() => false)) {
    await invitedChip.click({ timeout: ACTION_TIMEOUT });
    await expect
      .poll(async () => page.locator('[data-directory-row]').count(), { timeout: ACTION_TIMEOUT })
      .toBeGreaterThan(0);
    await auditChrome(page, 'admins-invited', outDir);
  }

  for (const [key, name] of [
    ['teachers', cat(en, 'Ops.schoolTables.tab.teachers')],
    ['students', cat(en, 'Ops.schoolTables.tab.students')],
    ['classes', cat(en, 'Ops.schoolTables.tab.classes')],
  ] as const) {
    const tab = page.getByRole('tab', { name, exact: true });
    await tab.click({ timeout: ACTION_TIMEOUT });
    await expect
      .poll(
        async () =>
          page.locator('[data-directory-row], [data-slot="directory-empty"]').count(),
        { timeout: ACTION_TIMEOUT },
      )
      .toBeGreaterThan(0);
    await auditChrome(page, key, outDir);
    // With a filter active, the design's blue "Clear filters" text pill shows
    // beside the controls — capture and measure it, then clear through it.
    if (key === 'classes') {
      const secondChip = page.locator('[data-slot="directory-chip"]').nth(1);
      await secondChip.click({ timeout: ACTION_TIMEOUT });
      const clear = page
        .locator('[data-slot="directory-toolbar"]')
        .getByRole('button', { name: cat(en, 'Ops.classesTab.clearFilters'), exact: true });
      await expect(clear).toBeVisible({ timeout: ACTION_TIMEOUT });
      await audit(page, 'classes-filtered clear button', '[data-slot="directory-toolbar"] button:not([aria-haspopup])');
      await shot(page, 'classes-1440-toolbar-filtered', outDir, page.locator('[data-slot="directory-toolbar"]').first());
      await clear.click({ timeout: ACTION_TIMEOUT });
      await expect(page.locator('[data-slot="directory-chip"]').first()).toHaveAttribute('aria-pressed', 'true');
    }
  }

  test.info().annotations.push({ type: 'console-errors', description: errors.join('\n') || 'none' });
  expect(errors, errors.join('\n')).toEqual([]);
});
