import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, loadMessages } from './helpers/i18n';
import { roleCredentials } from './helpers/credentials';
// F3 2026-09-16: fixtureSchoolId() resolves through the docker-exec psql
// fallback, which on this machine holds a STALE database (the live API on :5500
// serves host port 5540 and 404s those ids). Resolve the demo school's natural
// key from the LIVE database instead.
import { liveDemoSchoolId } from './fleet3-helpers';

// Task 67 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Signs in as the seeded ops account and drives the C-IMP-01/02 bulk import
// panel on the ops school detail page: csv -> preview (counts and row reasons
// cross-checked against the live API for the SAME csv) -> commit -> result
// summary -> API re-preview proves add-only (every row skip_existing).
//
// F3 2026-09-16 REBASED ONTO TODAY'S UI: the import surface moved INTO the
// Students tab's modal, the class comes from a picker (never a csv column),
// the preview is AUTO (no Preview click), and commit requires a real FILE
// (the paste path has no file to guard, so paste is covered by test 2's
// preview-only flow).
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const OPS = roleCredentials('ops');
let SCHOOL_DOCUMENT_ID = ''; // SchoolTest Demo School A (live-resolved)
const CLASS_NAME = 'EAL/D Year 7 - Room 4';
// Journey-seed student (stable natural key). The older Sofia fixture has no
// email by design, so using a made-up address for her tested CREATE, not SKIP.
const SEEDED_EMAIL = 'a1s01@schooltest.local';

interface PreviewBody {
  data: {
    create: { row: number; email: string }[];
    skip_existing: { row: number; email: string }[];
    reject: { row: number; reason: string }[];
  };
}

function buildCsv(stamp: number): { csv: string; alpha: string; beta: string } {
  const alpha = `zz67.alpha.${stamp}@schooltest.local`;
  const beta = `zz67.beta.${stamp}@schooltest.local`;
  // The portal vocabulary: class is the PICKER's job now, and the reject row is
  // an unparseable email (a bad class can no longer be expressed in a row).
  const csv = [
    'given name,family name,email,date of birth,year level,home language',
    `Zz67,Alpha,${alpha},2013-03-04,8,english`,
    `Zz67,Beta,${beta},2013-03-04,8,korean`,
    `Sofia,Petrov,${SEEDED_EMAIL},2013-03-04,8,english`,
    'Zz67,Bad,not-an-email,2013-03-04,8,thai',
  ].join('\n');
  return { csv, alpha, beta };
}

async function opsJwt(request: APIRequestContext): Promise<string> {
  return loginCached(request, API, OPS);
}

/** The SAME versioned preview the portal fires, for the SAME csv and class. */
async function apiPreview(
  request: APIRequestContext,
  jwt: string,
  csv: string,
  classDocumentId: string,
) {
  const res = await fetchWithRetry(() =>
    request.post(`${API}/api/ops/schools/${SCHOOL_DOCUMENT_ID}/import-students/preview`, {
      headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' },
      data: { csv, class_documentId: classDocumentId },
    }),
  );
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as PreviewBody).data;
}

async function classDocumentIdFor(request: APIRequestContext, jwt: string): Promise<string> {
  const res = await request.get(
    `${API}/api/ops/schools/${SCHOOL_DOCUMENT_ID}/classes?page=1&pageSize=200`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  expect(res.ok(), await res.text()).toBeTruthy();
  const match = ((await res.json()) as { data: { documentId: string; name: string }[] }).data.find(
    (klass) => klass.name === CLASS_NAME,
  );
  expect(match, `class ${CLASS_NAME} in the demo school`).toBeTruthy();
  return match!.documentId;
}

async function signInAsOps(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(OPS.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(OPS.password);
  await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
  // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  // late role redirect can never hijack the goto that follows. The axios
  // layer rides out any 429 on the auth POST, so allow for that here.
  await page.waitForURL('**/dashboard/ops/schools', { timeout: 90_000 });
  await page.goto(`/dashboard/ops/schools/${SCHOOL_DOCUMENT_ID}?tab=students`);
  await expect(page.getByRole('tabpanel', { name: 'Students' })).toBeVisible({ timeout: 20_000 });
  // ops/26: the import surface opens INSIDE the modal launched from the
  // Students tab's header button — it is no longer inline on the page.
  await page
    .getByRole('button', { name: cat(en, 'Ops.schoolTables.studentsImportCta'), exact: true })
    .click({ timeout: 20_000 });
  await expect(page.locator('[data-surface="ops-student-import"]')).toBeVisible({
    timeout: 20_000,
  });
}

test.describe('task 67: ops bulk student import vs live C-IMP-01/02', () => {
  // The timeout carries the 429 ride-out budget for batch runs (helpers/http.ts)
  // plus the dev server's on-demand compile of the school detail page.
  test.describe.configure({ timeout: 180_000 });

  test.beforeAll(async ({ request }) => {
    SCHOOL_DOCUMENT_ID = await liveDemoSchoolId();
  });

  test('file csv -> auto-preview matches the API -> commit -> add-only on re-upload', async ({
    page,
    request,
  }) => {
    const { csv, alpha, beta } = buildCsv(Date.now());
    const jwt = await opsJwt(request);
    const classDocumentId = await classDocumentIdFor(request, jwt);

    // The API judgement of this exact csv is the expected shape for the UI.
    const expected = await apiPreview(request, jwt, csv, classDocumentId);
    expect(expected.create.map((row) => row.email).sort()).toEqual([alpha, beta].sort());
    expect(expected.skip_existing).toEqual([{ row: 3, email: SEEDED_EMAIL }]);
    expect(expected.reject).toHaveLength(1);
    expect(expected.reject[0].reason).toContain('valid email');

    await signInAsOps(page);
    const panel = page.locator('[data-surface="ops-student-import"]');

    // Load the FILE (commit's guard needs one), pick the class: the design
    // auto-validates the moment both are set — there is no Preview button.
    await panel
      .getByLabel(cat(en, 'Ops.import.fileLabel'), { exact: true })
      .setInputFiles({ name: 'students.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await panel.locator('#ops-import-class').click();
    await page.getByRole('option', { name: CLASS_NAME, exact: true }).click();

    const preview = panel.locator('[data-surface="ops-import-preview"]');
    await expect(preview).toBeVisible({ timeout: 20_000 });
    await expect(
      preview.getByText('2 students will be created, 1 already exists, 1 rows need fixing', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(panel).toHaveAttribute('data-card', 'rowErrors');
    await expect(preview.getByText(alpha, { exact: true })).toBeVisible();
    await expect(preview.getByText(beta, { exact: true })).toBeVisible();
    await expect(
      preview.getByText('email must be a valid email address', { exact: true }),
    ).toBeVisible();

    // The ONE CTA carries the real count and commits.
    const cta = panel.locator('[data-surface="ops-import-cta"]');
    await expect(cta).toContainText('Import 2 students');
    await cta.click();
    await expect(panel.locator('[data-surface="ops-import-result"]')).toHaveText(
      'Import finished. Created: 2. Already existed: 1. Rejected: 1.',
      { timeout: 20_000 },
    );

    // Re-upload of the same csv: the API now judges every valid row existing.
    const after = await apiPreview(request, jwt, csv, classDocumentId);
    expect(after.create).toHaveLength(0);
    expect(after.skip_existing.map((row) => row.email).sort()).toEqual(
      [alpha, beta, SEEDED_EMAIL].sort(),
    );
    expect(after.reject).toHaveLength(1);

    // Hygiene the old panel version lacked: undo the commit so the demo
    // school keeps no zz67 fixtures.
    const undo = panel
      .locator('[data-surface="ops-import-result"]')
      .getByRole('button', { name: cat(en, 'Ops.import.undoButton'), exact: true });
    await expect(undo).toBeVisible({ timeout: 15_000 });
    await undo.click();
    await expect(panel.locator('[data-surface="ops-import-result"]')).toBeHidden({
      timeout: 20_000,
    });
  });

  test('paste path feeds the same auto-preview (no commit without a file)', async ({
    page,
    request,
  }) => {
    const { csv, alpha } = buildCsv(Date.now() + 1);
    await signInAsOps(page);
    const panel = page.locator('[data-surface="ops-student-import"]');

    await panel.getByLabel(cat(en, 'Ops.import.pasteLabel'), { exact: true }).fill(csv);
    await panel.locator('#ops-import-class').click();
    await page.getByRole('option', { name: CLASS_NAME, exact: true }).click();

    const preview = panel.locator('[data-surface="ops-import-preview"]');
    await expect(preview).toBeVisible({ timeout: 20_000 });
    await expect(
      preview.getByText('2 students will be created, 1 already exists, 1 rows need fixing', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(preview.getByText(alpha, { exact: true })).toBeVisible();

    // The paste path has NO file behind it, so committing is refused with the
    // form-level guard — never a request.
    await panel.locator('[data-surface="ops-import-cta"]').click();
    await expect(panel.getByText(cat(en, 'Ops.import.guardNoFile'), { exact: true })).toBeVisible();
  });
});
