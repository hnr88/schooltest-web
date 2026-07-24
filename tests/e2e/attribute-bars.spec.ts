import { expect, test, type Page } from '@playwright/test';

import { apiEnv, runSql } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';

// E11-03 / E11-04 / E11-09 — F-WEB-ATTRIBUTE-BARS, driven against the REAL
// portal, the REAL Strapi and the REAL Postgres. Every expectation below is read
// out of `public.results.attributes` with psql first and then compared to what
// the page rendered: nothing is fixtured and no shape is assumed.
const en = loadMessages('en');

interface WireEntry {
  status?: string;
  prob?: number | null;
  prob_se?: number;
  items?: number;
  delta?: number | null;
}

function teacherOwned(extraSql: string): string {
  const id = runSql(
    `select r.document_id
       from results r
       join results_student_lnk rs on rs.result_id = r.id
       join students s on s.id = rs.student_id
       join students_teacher_lnk tl on tl.student_id = s.id
       join up_users u on u.id = tl.user_id
      where u.email = 'teacher@schooltest.local'
        and r.destination = 'official'
        ${extraSql}
      order by r.created_at desc
      limit 1`,
  ).split('\n')[0];
  if (!id) throw new Error(`[e2e] no teacher-owned result for: ${extraSql}`);
  return id;
}

/** The stored evidence map minus the reserved peer keys the C-4 mapper strips. */
function storedAttributes(documentId: string): Record<string, WireEntry | 'not_assessed'> {
  const raw = runSql(`select attributes::text from results where document_id = '${documentId}'`);
  const parsed = JSON.parse(raw) as Record<string, WireEntry | 'not_assessed'>;
  return Object.fromEntries(
    Object.entries(parsed).filter(([key]) => key !== '_artefacts' && key !== 'provisional'),
  );
}

function orderedCodes(map: Record<string, unknown>): string[] {
  return Object.keys(map).sort((a, b) => a.localeCompare(b, 'en'));
}

async function signInAsTeacher(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page
    .getByLabel(cat(en, 'Auth.emailLabel'), { exact: true })
    .fill('teacher@schooltest.local');
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(apiEnv('SEED_TEACHER_PASSWORD'));
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL('**/dashboard');
}

test.describe('teacher report — attribute bars, evidence counts and not_assessed', () => {
  test('every stored attribute renders one bar whose state matches the row in Postgres', async ({
    page,
  }) => {
    const documentId = teacherOwned(`and r.attributes::text like '%not_assessed%'`);
    const stored = storedAttributes(documentId);
    const codes = orderedCodes(stored);
    expect(codes.length).toBeGreaterThan(1);

    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${documentId}`);

    const panel = page.locator('[data-slot="report-attributes"]');
    await expect(panel).toHaveAttribute('data-state', 'rows', { timeout: 20_000 });

    const rows = page.locator('[data-slot="report-attribute-row"]');
    await expect(rows).toHaveCount(codes.length);
    // Rendered in deterministic ladder order, not json insertion order.
    expect(await rows.evaluateAll((els) => els.map((el) => el.getAttribute('data-code')))).toEqual(
      codes,
    );

    for (const code of codes) {
      const entry = stored[code];
      const row = page.locator(`[data-slot="report-attribute-row"][data-code="${code}"]`);
      const assessed =
        entry !== 'not_assessed' &&
        entry.prob !== null &&
        entry.status !== 'not_assessed' &&
        entry.items !== 0;

      await expect(row, code).toHaveAttribute('data-state', assessed ? 'assessed' : 'not_assessed');

      if (assessed) {
        await expect(row.locator('[data-slot="report-attribute-probability"]'), code).toHaveText(
          `${Number((entry.prob! * 100).toFixed(1))}%`,
        );
        await expect(row.locator('[data-slot="status-pill"]'), code).toHaveText(
          cat(en, `Report.attributeStatus.${entry.status}`),
        );
        // E11-04: the item count travels with the claim, verbatim from the row.
        await expect(row.locator('[data-slot="report-evidence-count"]'), code).toHaveAttribute(
          'data-items',
          String(entry.items),
        );
        await expect(row.locator('[data-slot="report-attribute-track"]'), code).toHaveAttribute(
          'data-state',
          'assessed',
        );
      } else {
        // E11-09: no percentage, no delta, no evidence meter — and a distinct track.
        await expect(row.locator('[data-slot="report-attribute-probability"]'), code).toHaveCount(
          0,
        );
        await expect(row.locator('[data-slot="report-evidence-count"]'), code).toHaveCount(0);
        await expect(row.locator('[data-slot="trend-delta"]'), code).toHaveCount(0);
        await expect(row.locator('[data-slot="report-attribute-track"]'), code).toHaveAttribute(
          'data-state',
          'not_assessed',
        );
        await expect(
          row.locator('[data-slot="report-attribute-not-assessed-note"]'),
          code,
        ).toHaveText(cat(en, 'Report.attributeNotAssessedNote'));
        await expect(row.locator('[data-slot="status-pill"]'), code).toHaveText(
          cat(en, 'Report.attributeStatus.not_assessed'),
        );
      }
    }
  });

  test('the evidence summary states real coverage and the real item range', async ({ page }) => {
    const documentId = teacherOwned(`and r.attributes::text like '%not_assessed%'`);
    const stored = storedAttributes(documentId);
    const items = Object.values(stored).flatMap((entry) =>
      entry !== 'not_assessed' && entry.prob !== null && entry.items !== 0 ? [entry.items!] : [],
    );
    expect(items.length).toBeGreaterThan(0);

    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${documentId}`);

    const expected = cat(en, 'Report.evidenceSummaryAssessed')
      .replace('{assessed}', String(items.length))
      .replace('{total}', String(Object.keys(stored).length))
      .replace('{min}', String(Math.min(...items)))
      .replace('{max}', String(Math.max(...items)));

    const summaries = page.locator('[data-slot="report-evidence-summary"]');
    await expect(summaries.first()).toHaveText(expected, { timeout: 20_000 });
    // Rendered next to the display label AND next to the readiness lookup.
    expect(await summaries.count()).toBeGreaterThan(1);
    for (const text of await summaries.allTextContents()) expect(text).toBe(expected);
  });

  test('no standard error is persisted, so no error bar is drawn and the page says so', async ({
    page,
  }) => {
    // The premise, re-proved from the datastore rather than assumed.
    expect(runSql(`select count(*) from results where attributes::text like '%prob_se%'`)).toBe(
      '0',
    );

    const documentId = teacherOwned(`and r.attributes::text like '%not_assessed%'`);
    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${documentId}`);

    await expect(page.locator('[data-slot="report-attributes-se-absent"]')).toHaveText(
      cat(en, 'Report.confidenceIntervalAbsent'),
      { timeout: 20_000 },
    );
    await expect(page.locator('[data-slot="report-attribute-interval"]')).toHaveCount(0);
    await expect(page.locator('[data-slot="report-attribute-se"]')).toHaveCount(0);
  });

  test('the bars survive a hard reload byte for byte (they come from Postgres)', async ({
    page,
  }) => {
    const documentId = teacherOwned(`and r.attributes::text like '%not_assessed%'`);
    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${documentId}`);

    const rows = page.locator('[data-slot="report-attribute-row"]');
    await expect(rows.first()).toBeVisible({ timeout: 20_000 });
    const before = await rows.allInnerTexts();
    expect(before.join('')).not.toBe('');

    await page.reload();
    await expect(rows.first()).toBeVisible({ timeout: 20_000 });
    expect(await rows.allInnerTexts()).toEqual(before);
  });

  test('a productive-skill result says the ladder does not apply, not "not derived yet"', async ({
    page,
  }) => {
    const documentId = teacherOwned(`and r.skill = 'writing' and r.attributes is null`);
    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${documentId}`);

    const panel = page.locator('[data-slot="report-attributes"]');
    await expect(panel).toHaveAttribute('data-state', 'not_applicable', { timeout: 20_000 });
    await expect(page.locator('[data-slot="report-attributes-absent"]')).toHaveText(
      cat(en, 'Report.attributesNotApplicable'),
    );
    await expect(page.locator('[data-slot="report-attribute-row"]')).toHaveCount(0);
    await expect(page.locator('[data-slot="report-evidence-summary"]')).toHaveCount(0);
  });

  test('a fully mastered listening result renders seven assessed bars and no empty state', async ({
    page,
  }) => {
    const documentId = teacherOwned(
      `and r.skill = 'listening' and r.attributes is not null and r.attributes::text not like '%not_assessed%'`,
    );
    const stored = storedAttributes(documentId);

    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${documentId}`);

    const rows = page.locator('[data-slot="report-attribute-row"]');
    await expect(rows).toHaveCount(Object.keys(stored).length, { timeout: 20_000 });
    expect(await rows.evaluateAll((els) => els.map((el) => el.getAttribute('data-state')))).toEqual(
      Object.keys(stored).map(() => 'assessed'),
    );
  });
});
