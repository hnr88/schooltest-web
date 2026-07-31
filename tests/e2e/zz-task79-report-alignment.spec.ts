import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { cat, icu, loadMessages } from './helpers/i18n';

// Task 79 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Report module vs the REAL C-4 payloads (task 50 semantics): the mixed-evidence
// result renders not_assessed explicitly (never 0%), the all-not_assessed result
// carries no percentage anywhere, labels/bands/readiness match the API JSON
// exactly, the provisional and low-confidence caveats render, the effort_valid
// caveat renders on an effort-invalid result and is absent on an effort-valid
// one, and the parent toggle still swaps to the allow-list parent view.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = { email: 'verify21@schooltest.local', password: 'Verify21!pw' };

// Live results settled in task 50 (plus one effort-invalid sitting).
const MIXED = 'hvupac2i7ydbtu5zzcczznmm'; // R1-R3 assessed, R4-R7 "not_assessed"
const NONE = 'ndmrbjr6bdvlmnnr5cr4ioks'; // all seven "not_assessed"
const FULL = 'l8148n4woi89kvzlzkrug249'; // all seven mastered, deltas, Critical Reader
const EFFORT_INVALID = 'miqhycrej19pxzjndotuw9vk'; // effort_valid false

interface AttributeObject {
  status: string;
  prob: number | null;
  items: number;
  delta: number | null;
}
type AttributeEntry = AttributeObject | 'not_assessed';
interface ResultPayload {
  document_id: string;
  skill: string | null;
  attributes: Record<string, AttributeEntry> | null;
  display_label: string | null;
  acara_phase: string | null;
  cefr_band: string | null;
  readiness: string | null;
  low_confidence: boolean | null;
  effort_valid: boolean | null;
}

const percent = (prob: number) =>
  new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 1 }).format(prob);

async function login(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API}/api/auth/local`, {
    data: { identifier: TEACHER.email, password: TEACHER.password },
  });
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { jwt: string }).jwt;
}

async function fetchResult(request: APIRequestContext, jwt: string, id: string) {
  const res = await request.get(`${API}/api/results/${id}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()) as ResultPayload;
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(TEACHER.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(TEACHER.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL('**/dashboard', { timeout: 30_000 });
}

function row(page: Page, code: string) {
  return page.locator(`[data-slot="report-attribute-row"][data-code="${code}"]`);
}

test.describe('task 79: report module vs live C-4 payloads', () => {
  test.describe.configure({ mode: 'serial' });

  test('mixed-evidence result: not_assessed explicit, values equal payload', async ({
    page,
    request,
  }) => {
    const jwt = await login(request);
    const payload = await fetchResult(request, jwt, MIXED);
    expect(payload.effort_valid).toBe(true);

    await signIn(page);
    await page.goto(`/en/dashboard/reports/${MIXED}`);

    // Header facts straight off the payload, no client-side derivation.
    await expect(page.locator('[data-slot="report-display-label-value"]')).toHaveText(
      payload.display_label ?? '',
    );
    await expect(page.locator('[data-slot="report-provisional"]')).toBeVisible();
    await expect(page.locator('[data-slot="report-effort-invalid"]')).toHaveCount(0);

    const attributes = payload.attributes ?? {};
    for (const [code, entry] of Object.entries(attributes)) {
      const r = row(page, code);
      await expect(r).toBeVisible();
      if (entry === 'not_assessed') {
        await expect(r).toHaveAttribute('data-state', 'not_assessed');
        await expect(r.locator('[data-slot="report-attribute-probability"]')).toHaveCount(0);
        await expect(r.locator('[data-slot="report-attribute-not-assessed-note"]')).toHaveText(
          cat(en, 'Report.attributeNotAssessedNote'),
        );
      } else {
        await expect(r).toHaveAttribute('data-state', 'assessed');
        await expect(r.locator('[data-slot="report-attribute-probability"]')).toHaveText(
          percent(entry.prob ?? Number.NaN),
        );
      }
    }

    // Not a single "0%" over the whole attributes panel.
    const panel = page.locator('[data-slot="report-attributes"]');
    await expect(panel.getByText('0%', { exact: true })).toHaveCount(0);

    // low_confidence true on this result: the caveat callout renders.
    await expect(page.locator('[data-slot="report-low-confidence"]')).toBeVisible();
    await expect(
      page.getByText(cat(en, 'Report.confidenceLowNote'), { exact: true }),
    ).toBeVisible();
  });

  test('all-not_assessed result: no percentage, no zero bar, explicit absence', async ({
    page,
  }) => {
    await signIn(page);
    await page.goto(`/en/dashboard/reports/${NONE}`);

    const rows = page.locator('[data-slot="report-attribute-row"]');
    await expect(rows).toHaveCount(7);
    for (const r of await rows.all()) {
      await expect(r).toHaveAttribute('data-state', 'not_assessed');
    }
    await expect(page.locator('[data-slot="report-attribute-probability"]')).toHaveCount(0);
    await expect(page.locator('[data-slot="report-attribute-not-assessed-note"]')).toHaveCount(7);

    const panel = page.locator('[data-slot="report-attributes"]');
    await expect(panel.getByText(/[0-9]+%/)).toHaveCount(0);

    // The evidence summary states the absence; readiness renders the wire value.
    await expect(
      page
        .getByText(icu(cat(en, 'Report.evidenceSummaryNoneAssessed'), { total: '7' }), {
          exact: true,
        })
        .first(),
    ).toBeVisible();
    await expect(
      page.getByText(cat(en, 'Report.readinessValues.not_assessed'), { exact: true }).first(),
    ).toBeVisible();
  });

  test('full-evidence result: Critical Reader, deltas, no false caveats', async ({ page }) => {
    await signIn(page);
    await page.goto(`/en/dashboard/reports/${FULL}`);

    await expect(page.locator('[data-slot="report-display-label-value"]')).toHaveText(
      'Critical Reader',
    );
    const rows = page.locator('[data-slot="report-attribute-row"]');
    await expect(rows).toHaveCount(7);
    for (const r of await rows.all()) {
      await expect(r).toHaveAttribute('data-state', 'assessed');
    }
    // low_confidence false and effort_valid true: neither caveat fires.
    await expect(page.locator('[data-slot="report-low-confidence"]')).toHaveCount(0);
    await expect(page.locator('[data-slot="report-effort-invalid"]')).toHaveCount(0);
  });

  test('effort-invalid result: effort caveat surfaced, not hidden', async ({ page, request }) => {
    const jwt = await login(request);
    const payload = await fetchResult(request, jwt, EFFORT_INVALID);
    expect(payload.effort_valid).toBe(false);

    await signIn(page);
    await page.goto(`/en/dashboard/reports/${EFFORT_INVALID}`);
    await expect(page.locator('[data-slot="report-effort-invalid"]')).toBeVisible();
    await expect(
      page.getByText(cat(en, 'Report.effortInvalidNote'), { exact: true }),
    ).toBeVisible();
  });

  test('parent toggle intact: allow-list parent view of the same read', async ({ page }) => {
    await signIn(page);
    await page.goto(`/en/dashboard/reports/${MIXED}`);

    await expect(page.locator('[data-slot="report-view-toggle"]')).toBeVisible();
    await page.getByText(cat(en, 'Report.viewModes.parent'), { exact: true }).click();

    await expect(page.locator('[data-slot="report-parent-view"]')).toBeVisible();
    await expect(page.locator('[data-slot="report-parent-headline-value"]')).toHaveText(
      'Sentence Reader',
    );
    // Teacher blocks are removed from the DOM, not hidden: no codes, no percents.
    await expect(page.locator('[data-slot="report-attribute-row"]')).toHaveCount(0);
    await expect(page.locator('[data-slot="report-crosswalk-facts"]')).toHaveCount(0);
    await expect(page.locator('[data-slot="report-parent-view"]').getByText(/[0-9]+%/)).toHaveCount(
      0,
    );
    await expect(page.locator('[data-slot="report-parent-view"]').getByText('R1')).toHaveCount(0);
  });
});
