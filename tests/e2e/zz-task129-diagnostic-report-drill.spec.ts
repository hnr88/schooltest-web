import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, icu, loadMessages } from './helpers/i18n';
import { fixtureClassId } from './helpers/fixture-class';
import { fixtureTeacherCredentials } from './helpers/credentials';

// Task 129 (st-mvp-pivot): the permanent C-RPT-01 v2 drill spec — mvp-updates
// spec 4.9 "one single click down" from the class diagnostic to a student's
// full report. A mastery row with a result behind it renders
// data-slot="mastery-report-link" to /dashboard/reports/<latest_result_document_id>;
// the click lands on the teacher report for THAT result (URL/result identity —
// task 126 established the report never renders the student ref), and rows
// with no result render no anchor at all. Every content expectation is
// computed from the live C-RPT-01 / C-4 payloads, never pinned.
const en = loadMessages('en');
const zh = loadMessages('zh');

const API = 'http://127.0.0.1:5500';
const TEACHER = fixtureTeacherCredentials();
const CLASS_ID = fixtureClassId(); // "EAL/D Year 7 - Room 4"
const DOCUMENT_ID_PATTERN = /^[a-z0-9]{24}$/;

async function login(
  request: APIRequestContext,
  credentials: { email: string; password: string },
): Promise<string> {
  return loginCached(request, API, credentials);
}

async function signIn(page: Page, credentials: { email: string; password: string }): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(credentials.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(credentials.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  // late role redirect can never hijack the goto that follows.
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 90_000 });
}

interface DiagnosticPayload {
  mastery: Array<{
    student_ref: string;
    latest_result_document_id: string | null;
  }>;
}

async function fetchDiagnostic(request: APIRequestContext): Promise<DiagnosticPayload> {
  const teacherJwt = await login(request, TEACHER);
  const res = await fetchWithRetry(() =>
    request.get(`${API}/api/schools/me/classes/${CLASS_ID}/diagnostic`, {
      headers: { Authorization: `Bearer ${teacherJwt}` },
    }),
  );
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { data: DiagnosticPayload }).data;
}

interface ResultPayload {
  document_id: string;
  status: string;
  attributes: Record<string, unknown> | null;
}

// C-4: GET /api/results/:documentId answers a BARE ResultView (no {data, meta}).
async function fetchResult(
  request: APIRequestContext,
  resultDocumentId: string,
): Promise<ResultPayload> {
  const teacherJwt = await login(request, TEACHER);
  const res = await fetchWithRetry(() =>
    request.get(`${API}/api/results/${resultDocumentId}`, {
      headers: { Authorization: `Bearer ${teacherJwt}` },
    }),
  );
  expect(res.ok()).toBeTruthy();
  return (await res.json()) as ResultPayload;
}

// The drill target: a mastery row with a result AND a ref unique across the
// class (the fixture carries duplicate refs, so an ambiguous ref would make
// the row lookup flaky). The negative case needs the same uniqueness.
function uniqueRefRows(diagnostic: DiagnosticPayload) {
  const refs = diagnostic.mastery.map((row) => row.student_ref);
  const isUnique = (ref: string) => refs.filter((other) => other === ref).length === 1;
  const populated = diagnostic.mastery.filter(
    (row) => row.latest_result_document_id !== null && isUnique(row.student_ref),
  );
  const empty = diagnostic.mastery.filter(
    (row) => row.latest_result_document_id === null && isUnique(row.student_ref),
  );
  return { populated, empty };
}

test.describe('task 129: mastery row click-through to the full report (C-RPT-01 v2)', () => {
  // The timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test('API baseline: rows with results expose a 24-char drill target the teacher can read', async ({
    request,
  }) => {
    const diagnostic = await fetchDiagnostic(request);
    const { populated, empty } = uniqueRefRows(diagnostic);
    expect(populated.length).toBeGreaterThan(0);
    expect(empty.length).toBeGreaterThan(0);

    for (const row of diagnostic.mastery) {
      if (row.latest_result_document_id !== null) {
        expect(row.latest_result_document_id).toMatch(DOCUMENT_ID_PATTERN);
      }
    }

    // The drill target is a real, teacher-readable result with attribute data
    // to render — otherwise the click-through below would land on a gone report.
    const result = await fetchResult(request, populated[0]!.latest_result_document_id!);
    expect(result.document_id).toBe(populated[0]!.latest_result_document_id);
    expect(result.attributes).not.toBeNull();
    expect(Object.keys(result.attributes!).length).toBeGreaterThan(0);
  });

  test('drill: one click from the mastery row link to that result teacher report', async ({
    page,
    request,
  }) => {
    const diagnostic = await fetchDiagnostic(request);
    const { populated } = uniqueRefRows(diagnostic);
    expect(populated.length).toBeGreaterThan(0);
    const target = populated[0]!;
    const result = await fetchResult(request, target.latest_result_document_id!);
    const attributeCodes = Object.keys(result.attributes!);

    await signIn(page, TEACHER);
    await page.goto(`/en/dashboard/teach/results/${CLASS_ID}`);
    const screen = page.locator('[data-surface="teacher-diagnostic"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });
    const masteryTable = screen.locator('[data-slot="mastery-table"]');
    await expect(masteryTable).toBeVisible();
    await expect(masteryTable.locator(':scope > li')).toHaveCount(diagnostic.mastery.length);

    // The row link: catalog label, href pointing at the wire's result id.
    const label = icu(cat(en, 'Teach.diagnostic.mastery.viewFullReport'), {
      student: target.student_ref,
    });
    const link = masteryTable.getByRole('link', { name: label, exact: true });
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute(
      'href',
      new RegExp(`/dashboard/reports/${target.latest_result_document_id}$`),
    );

    // One click down (mvp-updates 4.9): class view -> the full report.
    await link.click();
    await page.waitForURL(`**/dashboard/reports/${target.latest_result_document_id}`);

    // Same result identity: the report route id IS the row's wire id, and the
    // teacher report renders that result's attribute panel (the report never
    // renders the student ref — task 126 — so identity is asserted here).
    const report = page.locator('[data-surface="teacher-report"]');
    await expect(report).toBeVisible({ timeout: 20_000 });
    const panel = report.locator('[data-slot="report-attributes"][data-state="rows"]');
    await expect(panel).toBeVisible();
    await expect(panel.locator('[data-slot="report-attribute-row"]')).toHaveCount(
      attributeCodes.length,
    );
    for (const code of attributeCodes) {
      await expect(
        panel.locator(`[data-slot="report-attribute-row"][data-code="${code}"]`),
      ).toHaveCount(1);
    }

    // Copy guard: model internals (G-DINA, Q-matrix) never reach the DOM. The
    // ACARA phase label itself is the teacher-mode crosswalk fact (E11-02),
    // not jargon — it is not part of this ban.
    const reportText = ((await report.textContent()) ?? '').toLowerCase();
    expect(reportText).not.toContain('g-dina');
    expect(reportText).not.toContain('q-matrix');
  });

  test('negative: rows without a result render no report link and no anchor', async ({
    page,
    request,
  }) => {
    const diagnostic = await fetchDiagnostic(request);
    const populatedCount = diagnostic.mastery.filter(
      (row) => row.latest_result_document_id !== null,
    ).length;
    const { empty } = uniqueRefRows(diagnostic);
    expect(empty.length).toBeGreaterThan(0);

    await signIn(page, TEACHER);
    await page.goto(`/en/dashboard/teach/results/${CLASS_ID}`);
    const screen = page.locator('[data-surface="teacher-diagnostic"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });
    const masteryTable = screen.locator('[data-slot="mastery-table"]');
    await expect(masteryTable).toBeVisible();

    // Table-wide: exactly one report link per result-backed wire row.
    await expect(masteryTable.locator('[data-slot="mastery-report-link"]')).toHaveCount(
      populatedCount,
    );

    // Row-scoped: a no-result row carries no anchor element at all — no dead
    // affordance, not even a hidden one.
    const rows = masteryTable.locator(':scope > li');
    for (const row of empty) {
      const rowItem = rows.filter({ has: page.getByText(row.student_ref, { exact: true }) });
      await expect(rowItem).toHaveCount(1);
      await expect(rowItem.locator('a')).toHaveCount(0);
    }
  });

  test('zh locale: the row link renders the translated label, never a raw key', async ({
    page,
    request,
  }) => {
    const diagnostic = await fetchDiagnostic(request);
    const { populated } = uniqueRefRows(diagnostic);
    expect(populated.length).toBeGreaterThan(0);
    const target = populated[0]!;

    await signIn(page, TEACHER);
    await page.goto(`/zh/dashboard/teach/results/${CLASS_ID}`);
    const screen = page.locator('[data-surface="teacher-diagnostic"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });
    const masteryTable = screen.locator('[data-slot="mastery-table"]');
    await expect(masteryTable).toBeVisible();

    const zhLabel = icu(cat(zh, 'Teach.diagnostic.mastery.viewFullReport'), {
      student: target.student_ref,
    });
    const link = masteryTable.getByRole('link', { name: zhLabel, exact: true });
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute(
      'href',
      new RegExp(`/dashboard/reports/${target.latest_result_document_id}$`),
    );

    // No next-intl failure leaks: neither the raw key nor a MISSING_MESSAGE.
    const tableText = (await masteryTable.textContent()) ?? '';
    expect(tableText).not.toContain('mastery.viewFullReport');
    expect(tableText).not.toContain('MISSING_MESSAGE');
  });
});
