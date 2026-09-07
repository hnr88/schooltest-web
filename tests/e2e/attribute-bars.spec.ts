import { expect, test, type Page } from '@playwright/test';

import { apiEnv, runSql } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';

// TASK 36 — F-WEB-ATTRIBUTE-BARS re-pointed at ResultView v2, driven against the
// REAL portal, the REAL Strapi and the REAL Postgres. Every expectation below is
// read out of `public.results.attributes` with psql first and then compared to
// what the page rendered: nothing is fixtured and no shape is assumed. Bars are
// domain scores (0–100); prob / prob_se are audit fields and must never render.
const en = loadMessages('en');

// Row order is the measurement-model order from the shared contract
// (mvp/contracts/scoring/src/enums.ts attributeNameSchema), not locale order.
const MEMO_ORDER = ['Decoding', 'Vocab_A2', 'Grammar', 'Vocab_B1', 'Gist', 'Detail', 'Inference'];

interface WireEntry {
  status?: string;
  domain_score?: number;
  delta_display?: string | null;
  items_seen?: number;
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

test.describe('teacher report — attribute scores, evidence counts and not_assessed', () => {
  test('every stored attribute renders one row whose score is its Postgres domain score', async ({
    page,
  }) => {
    const documentId = teacherOwned(`and r.attributes::text like '%domain_score%'`);
    const stored = storedAttributes(documentId);
    const names = MEMO_ORDER.filter((name) => name in stored);
    expect(names.length).toBeGreaterThan(1);

    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${documentId}`);

    const panel = page.locator('[data-slot="report-attributes"]');
    await expect(panel).toHaveAttribute('data-state', 'rows', { timeout: 20_000 });

    const rows = page.locator('[data-slot="report-attribute-row"]');
    await expect(rows).toHaveCount(names.length);
    expect(
      await rows.evaluateAll((els) => els.map((el) => el.getAttribute('data-attribute'))),
    ).toEqual(names);

    for (const name of names) {
      const entry = stored[name];
      const row = page.locator(`li[data-slot="report-attribute-row"][data-attribute="${name}"]`);
      const assessed = entry !== 'not_assessed' && typeof entry.domain_score === 'number';
      await expect(row, name).toHaveAttribute('data-state', assessed ? 'assessed' : 'not_assessed');

      if (assessed) {
        // The honesty guardrail: a bare domain score, never a percentage.
        await expect(row.locator('[data-slot="report-attribute-score"]'), name).toHaveText(
          String(entry.domain_score),
        );
        // useBarReveal flips to revealed on mount, so the transform is the score.
        const style = await row
          .locator('[data-slot="report-attribute-track"] span')
          .getAttribute('style');
        expect(style, name).toContain(`scaleX(${entry.domain_score! / 100})`);
        await expect(row.locator('[data-slot="report-evidence-count"]'), name).toHaveAttribute(
          'data-items-seen',
          String(entry.items_seen),
        );
        await expect(row.locator('[data-slot="status-pill"]'), name).toHaveText(
          cat(en, `Report.attributeStatus.${entry.status}`),
        );
        if (entry.delta_display != null) {
          // delta_display renders verbatim; the client never computes a delta.
          await expect(row.locator('[data-slot="trend-delta"]'), name).toContainText(
            entry.delta_display,
          );
        }
      } else {
        // A visible gap, never a 0: no score, no evidence meter, no delta.
        await expect(row.locator('[data-slot="report-attribute-score"]'), name).toHaveCount(0);
        await expect(row.locator('[data-slot="report-evidence-count"]'), name).toHaveCount(0);
        await expect(row.locator('[data-slot="trend-delta"]'), name).toHaveCount(0);
        await expect(
          row.locator('p[data-slot="report-attribute-not-assessed-note"]'),
          name,
        ).toHaveText(cat(en, 'Report.attributeNotAssessedNote'));
        await expect(row.locator('[data-slot="status-pill"]'), name).toHaveText(
          cat(en, 'Report.attributeStatus.not_assessed'),
        );
      }
    }
  });

  test('no posterior reaches the page — probabilities are audit fields, not display values', async ({
    page,
  }) => {
    const documentId = teacherOwned(`and r.attributes::text like '%domain_score%'`);
    const stored = storedAttributes(documentId);

    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${documentId}`);

    await expect(page.locator('[data-slot="report-attributes"]')).toHaveAttribute(
      'data-state',
      'rows',
      { timeout: 20_000 },
    );
    await expect(page.locator('[data-slot="report-attribute-probability"]')).toHaveCount(0);

    // A prob of 0.85 with domain_score 80 must render 80, not 85 — re-prove per row.
    for (const name of MEMO_ORDER.filter((n) => n in stored)) {
      const entry = stored[name];
      if (entry === 'not_assessed' || typeof entry.domain_score !== 'number') continue;
      const row = page.locator(`li[data-slot="report-attribute-row"][data-attribute="${name}"]`);
      await expect(row.locator('[data-slot="report-attribute-score"]'), name).toHaveText(
        String(entry.domain_score),
      );
    }
  });

  test('the evidence summary states real coverage from the stored items_seen counts', async ({
    page,
  }) => {
    const documentId = teacherOwned(`and r.attributes::text like '%domain_score%'`);
    const stored = storedAttributes(documentId);
    const names = MEMO_ORDER.filter((name) => name in stored);
    const counts = names.flatMap((name) => {
      const entry = stored[name];
      return entry !== 'not_assessed' && typeof entry.items_seen === 'number'
        ? [entry.items_seen]
        : [];
    });
    expect(counts.length).toBeGreaterThan(0);

    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${documentId}`);

    const expected = cat(en, 'Report.evidenceSummaryAssessed')
      .replace('{assessed}', String(counts.length))
      .replace('{total}', String(names.length))
      .replace('{min}', String(Math.min(...counts)))
      .replace('{max}', String(Math.max(...counts)));

    const summaries = page.locator('[data-slot="report-evidence-summary"]');
    await expect(summaries.first()).toHaveText(expected, { timeout: 20_000 });
    for (const text of await summaries.allTextContents()) expect(text).toBe(expected);
  });

  test('the rows survive a hard reload byte for byte (they come from Postgres)', async ({
    page,
  }) => {
    const documentId = teacherOwned(`and r.attributes::text like '%domain_score%'`);
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

  test('a productive-skill result says the attributes do not apply, not "not derived yet"', async ({
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

  test('a legacy-r7 result renders the caveat and its stored bands as text only', async ({
    page,
  }) => {
    // Never fabricate the legacy case: skip when the seed holds no pre-v2 result.
    const legacyId = runSql(
      `select r.document_id
         from results r
         join results_student_lnk rs on rs.result_id = r.id
         join students s on s.id = rs.student_id
         join students_teacher_lnk tl on tl.student_id = s.id
         join up_users u on u.id = tl.user_id
        where u.email = 'teacher@schooltest.local'
          and r.destination = 'official'
          and r.skill in ('reading', 'listening')
          and (r.attributes is null or r.attributes::text not like '%domain_score%')
        order by r.created_at desc
        limit 1`,
    ).split('\n')[0];
    test.skip(
      !legacyId || legacyId === 'UNRESOLVED_FIXTURE_ID',
      'no legacy (pre-domain_score) teacher-owned result seeded',
    );

    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${legacyId}`);

    const surface = page.locator('[data-surface="legacy-report"]');
    await expect(surface).toBeVisible({ timeout: 20_000 });
    await expect(surface.locator('p[role="note"]')).toHaveText(cat(en, 'Report.legacyModelCaveat'));
    // Text only: no bars, no scores, and no percent sign anywhere on a legacy row.
    await expect(surface.locator('[data-slot="report-attribute-score"]')).toHaveCount(0);
    await expect(surface.locator('[data-slot="report-attribute-track"]')).toHaveCount(0);
    expect(await surface.innerText()).not.toContain('%');
  });
});
