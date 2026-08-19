import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, loadMessages } from './helpers/i18n';

// Task 67 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Signs in as the seeded ops account and drives the C-IMP-01/02 bulk import
// panel on the ops school detail page: paste csv -> preview (counts and row
// reasons cross-checked against the live API for the SAME csv) -> commit ->
// result summary -> API re-preview proves add-only (every row skip_existing,
// zero duplicates). A second test covers the file-picker path.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const OPS = { email: 'admin@schooltest.local', password: process.env.E2E_OPS_PASSWORD ?? 'Admin1234!' };
const SCHOOL_DOCUMENT_ID = 'tcdu9a7g6qm2tg8brju2kosp'; // SchoolTest Demo School A
const CLASS_NAME = 'EAL/D Year 7 - Room 4';
const SEEDED_EMAIL = 'sofia.petrov@schooltest.local';

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
  const csv = [
    'first name,last name,email,first language,class,proficiency level',
    `Zz67,Alpha,${alpha},Mandarin Chinese,${CLASS_NAME},beginning`,
    `Zz67,Beta,${beta},Korean,${CLASS_NAME},`,
    `Sofia,Petrov,${SEEDED_EMAIL},English,${CLASS_NAME},emerging`,
    `Zz67,Badclass,zz67.badclass.${stamp}@schooltest.local,Thai,Room 99,developing`,
  ].join('\n');
  return { csv, alpha, beta };
}

async function opsJwt(request: APIRequestContext): Promise<string> {
  return loginCached(request, API, OPS);
}

async function apiPreview(request: APIRequestContext, jwt: string, csv: string) {
  const res = await fetchWithRetry(() =>
    request.post(`${API}/api/ops/schools/${SCHOOL_DOCUMENT_ID}/import-students/preview`, {
      headers: { Authorization: `Bearer ${jwt}` },
      data: { csv },
    }),
  );
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as PreviewBody).data;
}

async function signInAsOps(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(OPS.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(OPS.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  // late role redirect can never hijack the goto that follows. The axios
  // layer rides out any 429 on the auth POST, so allow for that here.
  await page.waitForURL('**/dashboard/ops/schools', { timeout: 90_000 });
  await page.goto(`/dashboard/ops/schools/${SCHOOL_DOCUMENT_ID}`);
  await expect(page.locator('[data-surface="ops-student-import"]')).toBeVisible({
    timeout: 20_000,
  });
}

test.describe('task 67: ops bulk student import vs live C-IMP-01/02', () => {
  // The timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  test.describe.configure({ timeout: 120_000 });
  test('paste csv -> preview matches the API -> commit -> add-only on re-upload', async ({
    page,
    request,
  }) => {
    const { csv, alpha, beta } = buildCsv(Date.now());
    const jwt = await opsJwt(request);

    // The API judgement of this exact csv is the expected shape for the UI.
    const expected = await apiPreview(request, jwt, csv);
    expect(expected.create.map((row) => row.email).sort()).toEqual([alpha, beta].sort());
    expect(expected.skip_existing).toEqual([{ row: 4, email: SEEDED_EMAIL }]);
    expect(expected.reject).toHaveLength(1);
    expect(expected.reject[0].reason).toContain('Room 99');

    await signInAsOps(page);
    const panel = page.locator('[data-surface="ops-student-import"]');

    // Commit stays disabled until a preview ran.
    await expect(
      panel.getByRole('button', { name: cat(en, 'Ops.import.commitButton'), exact: true }),
    ).toBeDisabled();

    await panel
      .getByLabel(cat(en, 'Ops.import.pasteLabel'), { exact: true })
      .fill(csv);
    await panel
      .getByRole('button', { name: cat(en, 'Ops.import.previewButton'), exact: true })
      .click();

    const preview = panel.locator('[data-surface="ops-import-preview"]');
    await expect(preview).toBeVisible({ timeout: 20_000 });
    await expect(
      preview.getByText('2 students will be created, 1 already exists, 1 row needs fixing', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(preview.getByText(alpha, { exact: true })).toBeVisible();
    await expect(preview.getByText(beta, { exact: true })).toBeVisible();
    await expect(preview.getByText(SEEDED_EMAIL, { exact: true })).toBeVisible();
    await expect(
      preview.getByText(`class "Room 99" does not exist in this school`, { exact: true }),
    ).toBeVisible();

    await panel
      .getByRole('button', { name: cat(en, 'Ops.import.commitButton'), exact: true })
      .click();
    await expect(panel.locator('[data-surface="ops-import-result"]')).toHaveText(
      'Import finished. Created: 2. Already existed: 1. Rejected: 1.',
      { timeout: 20_000 },
    );

    // Re-upload of the same csv: the API now judges every valid row existing.
    const after = await apiPreview(request, jwt, csv);
    expect(after.create).toHaveLength(0);
    expect(after.skip_existing.map((row) => row.email).sort()).toEqual(
      [alpha, beta, SEEDED_EMAIL].sort(),
    );
    expect(after.reject).toHaveLength(1);
  });

  test('file picker loads the csv and previews the same counts', async ({ page }) => {
    const { csv, alpha } = buildCsv(Date.now() + 1);
    await signInAsOps(page);
    const panel = page.locator('[data-surface="ops-student-import"]');

    await panel
      .getByLabel(cat(en, 'Ops.import.fileLabel'), { exact: true })
      .setInputFiles({ name: 'students.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await expect(panel.getByLabel(cat(en, 'Ops.import.pasteLabel'), { exact: true })).toHaveValue(
      csv,
    );

    await panel
      .getByRole('button', { name: cat(en, 'Ops.import.previewButton'), exact: true })
      .click();
    const preview = panel.locator('[data-surface="ops-import-preview"]');
    await expect(preview).toBeVisible({ timeout: 20_000 });
    await expect(
      preview.getByText('2 students will be created, 1 already exists, 1 row needs fixing', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(preview.getByText(alpha, { exact: true })).toBeVisible();
  });
});
