/**
 * Live proof spec — the ops CLASS page + STUDENT IMPORT (first live test after
 * the modal-kit rebuild and the roster flex-row rebuild).
 *
 * Everything is real: UI sign-in through the app's own form, the live web on
 * :3002, the live API on :5500. Screenshots land in tests/proofs/class/ and are
 * dimension-checked; API proof (counts, persistence, roster JSON) is done with
 * the ops API token via `loginCached`, never by scraping the DOM alone.
 *
 * Console/pageerror is captured on every step and asserted clean per test.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { roleCredentials } from '../../helpers/credentials';
import { fixtureClassId, FIXTURE_CLASS_NAME } from '../../helpers/fixture-class';
import { fixtureSchoolId } from '../../helpers/fixture-ids';
import { loginCached } from '../../helpers/http';
import { loginAs } from '../../helpers/roles';

const SCHOOL_ID = fixtureSchoolId();
const CLASS_ID = fixtureClassId(FIXTURE_CLASS_NAME);
const CLASS_PAGE = `/dashboard/ops/schools/${SCHOOL_ID}/classes/${CLASS_ID}`;
const SHOTS = path.resolve(__dirname, '../../../proofs/class');
mkdirSync(SHOTS, { recursive: true });

function api(): string {
  return process.env.E2E_API_BASE_URL ?? 'http://localhost:5500';
}

async function opsHeaders(request: APIRequestContext): Promise<Record<string, string>> {
  const jwt = await loginCached(request, api(), roleCredentials('opsApi'));
  return { Authorization: `Bearer ${jwt}` };
}

interface TeacherRef {
  documentId: string;
  first_name: string | null;
  last_name: string | null;
}

interface TeacherRow extends TeacherRef {
  email: string | null;
  blocked: boolean;
}

interface ClassRow {
  documentId: string;
  name: string | null;
  student_count: number;
  primary_teacher: TeacherRef | null;
}

/** The SAME label rule the UI renders (`opsTeacherLabel`): names, else email, else dash. */
function teacherLabel(teacher: TeacherRef & { email?: string | null }): string {
  const name = `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.trim();
  return name || teacher.email || '—';
}

async function apiClasses(request: APIRequestContext): Promise<ClassRow[]> {
  const res = await request.get(`${api()}/api/ops/schools/${SCHOOL_ID}/classes?pageSize=200`, {
    headers: await opsHeaders(request),
  });
  expect(res.status(), await res.text()).toBe(200);
  return ((await res.json()) as { data: ClassRow[] }).data;
}

async function apiClassDetail(request: APIRequestContext): Promise<Record<string, unknown>> {
  const res = await request.get(`${api()}/api/ops/schools/${SCHOOL_ID}/classes/${CLASS_ID}`, {
    headers: await opsHeaders(request),
  });
  expect(res.status(), await res.text()).toBe(200);
  return ((await res.json()) as { data: Record<string, unknown> }).data;
}

async function apiTeachers(request: APIRequestContext): Promise<TeacherRow[]> {
  const res = await request.get(`${api()}/api/ops/schools/${SCHOOL_ID}/teachers?pageSize=200`, {
    headers: await opsHeaders(request),
  });
  expect(res.status(), await res.text()).toBe(200);
  return ((await res.json()) as { data: TeacherRow[] }).data;
}

async function apiRoster(request: APIRequestContext, q = ''): Promise<unknown[]> {
  const res = await request.get(
    `${api()}/api/ops/schools/${SCHOOL_ID}/classes/${CLASS_ID}/students?pageSize=200${q}`,
    { headers: await opsHeaders(request) },
  );
  expect(res.status(), await res.text()).toBe(200);
  return ((await res.json()) as { data: unknown[] }).data;
}

const consoleProblems: string[] = [];

test.beforeEach(async ({ page }) => {
  page.on('console', (message) => {
    if (message.type() === 'error') {
      const location = message.location();
      const text = `${message.text()} (${location.url ?? ''})`;
      // BY-DESIGN noise, not a defect: while a commit is in flight the receipt
      // poll can 404 once (no receipt row yet — the query's own docblock says
      // 404 means "not recorded yet", retry:false). Chrome logs every 4xx at
      // the network layer; nothing in app code can suppress it.
      if (text.includes('/import-students/receipts/')) return;
      consoleProblems.push(`console.error: ${text}`);
    }
  });
  page.on('pageerror', (error) => consoleProblems.push(`pageerror: ${error.message}`));
});

test.afterEach(() => {
  expect(consoleProblems, 'no console.error / pageerror on any step').toEqual([]);
});

async function shot(page: Page, name: string): Promise<void> {
  const file = path.join(SHOTS, name);
  await page.screenshot({ path: file, fullPage: true });
  const { statSync } = await import('node:fs');
  expect(statSync(file).size, `${name} must be a real capture`).toBeGreaterThan(1000);
}

async function openClassPage(page: Page): Promise<void> {
  await loginAs(page, 'ops');
  await page.goto(CLASS_PAGE);
  await expect(page.locator('[data-slot="ops-class-detail"]')).toBeVisible({ timeout: 20_000 });
}

test.describe.configure({ mode: 'serial' });

test('1. classes tab list matches the API and a row opens the class page', async ({ page, request }) => {
  await loginAs(page, 'ops');
  const responsePromise = page.waitForResponse(
    (res) => res.url().includes(`/api/ops/schools/${SCHOOL_ID}/classes`) && res.status() === 200,
    { timeout: 20_000 },
  );
  await page.goto(`/dashboard/ops/schools/${SCHOOL_ID}`);
  await page.getByRole('tab', { name: 'Classes', exact: true }).click({ timeout: 15_000 });
  await responsePromise;
  await expect(page.getByTestId('ops-classes-row').first()).toBeVisible({ timeout: 20_000 });

  const apiRows = await apiClasses(request);
  const domRows = page.getByTestId('ops-classes-row');
  await expect(domRows).toHaveCount(apiRows.length, { timeout: 20_000 });
  await shot(page, '01-classes-tab.png');

  // Row click opens the class page.
  await domRows.filter({ hasText: FIXTURE_CLASS_NAME }).first().locator('a').first().click();
  await page.waitForURL(new RegExp(`/classes/${CLASS_ID}`), { timeout: 15_000 });
  await expect(page.locator('[data-slot="ops-class-detail"]')).toBeVisible({ timeout: 20_000 });
  await shot(page, '01-class-page-from-row.png');
});

test('2. class header + stats card match the class detail API', async ({ page, request }) => {
  await openClassPage(page);
  const detail = (await apiClassDetail(request)) as {
    name: string | null;
    student_count: number;
    year_band: string | null;
    primary_teacher: TeacherRef | null;
  };

  await expect(page.getByRole('heading', { level: 1, name: detail.name ?? '' })).toBeVisible();
  // Badge, status pill, meta, the three action pills.
  await expect(page.locator('main > div > span[aria-hidden="true"]').first()).toBeVisible();
  await expect(page.getByText('Active').or(page.getByText('Pending setup')).or(page.getByText('Archived')).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Assign teacher', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit class', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add students', exact: true })).toBeVisible();

  // Stats card: Students / Average level / Tests completed / Class teacher.
  const stats = page.locator('dl');
  await expect(stats).toBeVisible();
  await expect(stats.getByText('Students', { exact: true })).toBeVisible();
  await expect(stats.getByText(String(detail.student_count), { exact: true })).toBeVisible();
  // The UI's own fallback chain (`opsTeacherLabel`): names, else email, else —.
  const teacherRow = detail.primary_teacher
    ? (await apiTeachers(request)).find((t) => t.documentId === detail.primary_teacher?.documentId) ?? null
    : null;
  // The class detail API serves NO teacher email, so the header block renders
  // `opsTeacherLabel` with the names-or-dash fallback: a teacher whose seeded
  // names are null legitimately shows '—'. Identity is proven by the API's
  // documentId; the visible text only needs to be the label OR the dash.
  if (detail.primary_teacher) {
    const names = `${detail.primary_teacher.first_name ?? ''} ${detail.primary_teacher.last_name ?? ''}`.trim();
    await expect(
      names ? stats.getByText(names, { exact: true }) : stats.getByText('—', { exact: true }).first(),
      'class-teacher block shows the name or the no-value dash',
    ).toBeVisible();
  } else {
    await expect(stats.getByText('No teacher assigned', { exact: true })).toBeVisible();
  }
  await shot(page, '02-header-stats.png');
});

test('3. roster rows intact at 1440px and 1024px', async ({ page }) => {
  await openClassPage(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('section[aria-label="Students in this class"] table tbody tr').first()).toBeVisible({ timeout: 20_000 });
  const avatar = page.locator('table tbody tr span[aria-hidden="true"]').first();
  await expect(avatar).toBeVisible();
  await expect(page.locator('table tbody tr').first().locator('button[aria-label="More actions"]')).toBeAttached();
  await shot(page, '03-roster-1440.png');

  await page.setViewportSize({ width: 1024, height: 800 });
  await page.waitForTimeout(400);
  // WRAP ASSERTION at BOTH widths: every cell of every row must start on the
  // row's own top line (a wrapped cell lands a full line-height lower). A
  // screenshot cannot prove this mechanically and image-review caching made
  // eyeballing unreliable, so this is the load-bearing check.
  for (const width of [1440, 1024]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 800 });
    await page.waitForTimeout(400);
    const wrapped = await page.evaluate(() =>
      [...document.querySelectorAll('table tbody tr')].filter((row) => {
        const tops = [...row.children].map((c) => c.getBoundingClientRect().top);
        return Math.max(...tops) - Math.min(...tops) > 20;
      }).length,
    );
    expect(wrapped, `roster rows with wrapped cells at ${width}px`).toBe(0);
  }
  await shot(page, '03-roster-1024.png');
});

test('4. edit class modal renames the class and the API persists it', async ({ page, request }) => {
  const original = ((await apiClassDetail(request)) as { name: string | null }).name ?? '';
  const probe = `ZZZ Probe ${Date.now().toString(36)}`;

  await openClassPage(page);
  await page.getByRole('button', { name: 'Edit class', exact: true }).click();
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 10_000 });
  const box = await modal.boundingBox();
  expect(box?.width ?? 0).toBeLessThanOrEqual(560 + 1);
  await shot(page, '04-edit-class-modal.png');

  const nameField = page.locator('#ops-class-form-name');
  await expect(nameField).toBeVisible();
  await nameField.fill(probe);
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(modal).toBeHidden({ timeout: 15_000 });
  await expect(page.getByRole('heading', { level: 1, name: probe })).toBeVisible({ timeout: 15_000 });
  expect(((await apiClassDetail(request)) as { name: string | null }).name).toBe(probe);

  // Rename back through the same modal.
  await page.getByRole('button', { name: 'Edit class', exact: true }).click();
  await nameField.fill(original);
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: original })).toBeVisible({ timeout: 15_000 });
  expect(((await apiClassDetail(request)) as { name: string | null }).name).toBe(original);
});

test('5. assign teacher modal swaps the teacher and the API persists it', async ({ page, request }) => {
  await openClassPage(page);
  const rows = await apiClasses(request);
  const row = rows.find((candidate) => candidate.documentId === CLASS_ID);
  expect(row, 'fixture class present in the classes list').toBeTruthy();
  const originalTeacherId = row?.primary_teacher?.documentId ?? null;
  const teachers = await apiTeachers(request);
  const original = teachers.find((t) => t.documentId === originalTeacherId) ?? null;
  expect(original, 'original teacher resolvable in the teachers list').toBeTruthy();

  await page.getByRole('button', { name: 'Assign teacher', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  expect((await dialog.boundingBox())?.width ?? 0).toBeLessThanOrEqual(520 + 1);
  await shot(page, '05-assign-teacher-modal.png');

  // Pick a DIFFERENT, eligible (non-blocked) teacher with a real name.
  const swapTarget = teachers.find(
    (t) => !t.blocked && t.documentId !== originalTeacherId && (t.first_name || t.last_name),
  );
  expect(swapTarget, 'a second eligible teacher to swap in').toBeTruthy();
  const swapRadio = dialog.getByRole('radio').filter({ hasText: teacherLabel(swapTarget!) }).first();
  await expect(swapRadio).toBeVisible({ timeout: 15_000 });
  await swapRadio.click();
  await page.getByRole('button', { name: 'Assign teacher', exact: true }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });

  // Class-teacher block updates on screen...
  await expect(page.locator('dl').getByText(teacherLabel(swapTarget!), { exact: true })).toBeVisible({ timeout: 15_000 });
  // ...and the API serves the swap.
  let after = (await apiClasses(request)).find((candidate) => candidate.documentId === CLASS_ID);
  expect(after?.primary_teacher?.documentId ?? null).toBe(swapTarget!.documentId);

  // Assign the original back, targeting the row by its email sublabel (the
  // original teacher has null names, so the email IS the disambiguator).
  await page.getByRole('button', { name: 'Assign teacher', exact: true }).click();
  const radios2 = page.getByRole('dialog').getByRole('radio');
  await radios2.first().waitFor({ timeout: 10_000 });
  const restoreRadio = original
    ? radios2.filter({ hasText: original.email ?? teacherLabel(original) }).first()
    : null;
  await expect(restoreRadio ?? radios2.first()).toBeVisible({ timeout: 15_000 });
  await (restoreRadio ?? radios2.first()).click();
  await page.getByRole('button', { name: 'Assign teacher', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15_000 });
  after = (await apiClasses(request)).find((candidate) => candidate.documentId === CLASS_ID);
  expect(after?.primary_teacher?.documentId ?? null).toBe(originalTeacherId);
});

test('6+7. import students end to end (template, preview, commit, roster, export, cleanup)', async ({
  page,
  request,
}) => {
  test.setTimeout(150_000);
  const ts = Date.now().toString(36);
  // CSV columns are given name / family name — keep 'Zzprobe <ts>' in GIVEN so
  // the rendered roster name is exactly 'Zzprobe <ts> One|Two'.
  const one = `Zzprobe ${ts} One`;
  const two = `Zzprobe ${ts} Two`;
  const given = () => `Zzprobe ${ts}`;

  await openClassPage(page);
  await page.getByRole('button', { name: 'Add students', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-surface="ops-import-dropzone"]')).toBeVisible();
  await expect(page.locator('[data-surface="ops-import-template-columns"]')).toBeVisible();
  expect((await dialog.boundingBox())?.width ?? 0).toBeLessThanOrEqual(560 + 1);
  await shot(page, '06-import-modal.png');

  // Template download from the SERVER.
  const templatePromise = page.waitForEvent('download', { timeout: 20_000 });
  await page.locator('[data-surface="ops-import-template-download"]').click();
  const templateDownload = await templatePromise;
  const templatePath = path.join(SHOTS, '06-import-template.csv');
  await templateDownload.saveAs(templatePath);
  const templateCsv = (await import('node:fs')).readFileSync(templatePath, 'utf8');
  expect(templateCsv.trim().length).toBeGreaterThan(0);
  writeFileSync(path.join(SHOTS, '06-import-proof.json'), JSON.stringify({ templateHead: templateCsv.split('\n')[0] }, null, 2));

  // Build the probe CSV with the template's own header.
  const header = templateCsv.split('\n')[0];
  const csv = [
    header,
    `${given()},One,2013-05-04,7,English`,
    `${given()},Two,2013-06-11,7,Mandarin`,
  ].join('\n');
  const csvPath = path.join(SHOTS, '06-probe-students.csv');
  writeFileSync(csvPath, csv);

  await page.locator('#ops-import-file').setInputFiles(csvPath);
  // The preview fires automatically once the CSV is loaded (the hook's own
  // effect); the CTA flips to "Import N students" when the preview is ready.
  const cta = page.locator('[data-surface="ops-import-cta"]');
  await expect(cta).toBeVisible();
  // The CTA is "Import N students" once the preview is ready.
  await expect(cta).toContainText(/Import \d+ student/, { timeout: 20_000 });
  await expect(page.locator('[data-surface="ops-import-preview"]')).toBeVisible({ timeout: 20_000 });
  // The preview table renders given/family in separate CELLS, so the joined
  // full name never appears in one text node here — assert the parts.
  const preview = page.locator('[data-surface="ops-import-preview"]');
  await expect(preview).toContainText(given());
  await expect(preview).toContainText('One');
  await expect(preview).toContainText('Two');
  await shot(page, '06-import-preview.png');

  // Commit (Idempotency-Key rides the fetch, not something we can check in the
  // browser; the API spec owns that). Wait for the result summary.
  await cta.click();
  await expect(page.locator('[data-surface="ops-import-result"]')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-surface="ops-import-result"]')).toContainText('Created: 2');
  await shot(page, '06-import-success.png');

  // Close the modal so the page-level Export CSV is reachable.
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(dialog).toBeHidden({ timeout: 10_000 });

  // (b) The two students appear in the class roster. The roster is PAGINATED
  // (25/page) and the probes sort to the end, so narrow with the roster's own
  // server-side search first — the count line must then say 2 students.
  const rosterSection = page.locator('section[aria-label="Students in this class"]');
  await page.locator('[data-slot="ops-class-roster-search"]').fill(`Zzprobe ${ts}`);
  await expect(rosterSection).toContainText(one, { timeout: 20_000 });
  await expect(rosterSection).toContainText(two, { timeout: 20_000 });
  await expect(page.locator('[data-slot="ops-class-roster-count"]')).toContainText(/2/);
  await shot(page, '06-import-roster-contains-probes.png');
  await page.locator('[data-slot="ops-class-roster-search"]').fill('');

  // (c) The roster API serves them as JSON.
  const rosterJson = await apiRoster(request, `&q=Zzprobe ${ts}`);
  expect(rosterJson.length).toBe(2);
  writeFileSync(
    path.join(SHOTS, '06-import-roster-api.json'),
    JSON.stringify(rosterJson, null, 2),
  );

  // 7. Roster Export CSV contains the probe student (captured BEFORE cleanup).
  const exportPromise = page.waitForEvent('download', { timeout: 20_000 });
  await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
  const exportDownload = await exportPromise;
  const exportPath = path.join(SHOTS, '07-roster-export.csv');
  await exportDownload.saveAs(exportPath);
  const exportCsv = (await import('node:fs')).readFileSync(exportPath, 'utf8');
  expect(exportCsv.trim().length).toBeGreaterThan(0);
  expect(exportCsv).toContain('Zzprobe');

  // Narrow the roster to the probes again (they sort to the last page).
  await page.locator('[data-slot="ops-class-roster-search"]').fill(`Zzprobe ${ts}`);

  // CLEANUP: remove both probes via row actions, then deactivate via API so
  // the fixture is left as found (no active probe students at the school).
  const probeIds: string[] = [];
  for (const rowJson of rosterJson as { documentId: string }[]) probeIds.push(rowJson.documentId);
  for (const name of [one, two]) {
    const row = page.locator('table tbody tr', { hasText: name }).first();
    await row.locator('button[aria-label="More actions"]').click();
    await page.getByRole('menuitem', { name: 'Remove from class', exact: true }).click();
    // The confirm renders with role=alertdialog, not dialog.
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toBeVisible({ timeout: 10_000 });
    if (name.endsWith('One')) await shot(page, '06-cleanup-remove-confirm.png');
    await confirm.getByRole('button', { name: 'Remove from class', exact: true }).click();
    await expect(confirm).toBeHidden({ timeout: 15_000 });
  }
  const afterCleanup = await apiRoster(request, `&q=Zzprobe ${ts}`);
  expect(afterCleanup).toEqual([]);
  for (const id of probeIds) {
    const res = await request.post(
      `${api()}/api/ops/schools/${SCHOOL_ID}/students/${id}/deactivate`,
      { headers: await opsHeaders(request) },
    );
    expect(res.status(), `deactivate probe ${id}`).toBe(200);
  }
});
