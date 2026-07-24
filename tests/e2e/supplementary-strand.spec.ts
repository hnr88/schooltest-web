import { expect, test, type Page } from '@playwright/test';

import { apiEnv, runSql } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';

// E11-05 — F-WEB-SUPPLEMENTARY-STRAND, driven against the REAL portal, the REAL
// Strapi and the REAL Postgres. Every expectation below is read out of
// `public.results.supplementary` with psql first and then compared to what the
// page rendered: nothing is fixtured and no shape is assumed.
const en = loadMessages('en');

const PERCENT = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 0 });

interface WireSupplementary {
  vocab_band_a2_accuracy: number | null;
  vocab_band_b1_accuracy: number | null;
  dprime?: number | null;
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

function storedSupplementary(documentId: string): WireSupplementary {
  const raw = runSql(`select supplementary::text from results where document_id = '${documentId}'`);
  return JSON.parse(raw) as WireSupplementary;
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

test.describe('teacher report — the out-of-model vocabulary strand', () => {
  test('both bands render the real stored proportion, and a stored 0 renders as 0%', async ({
    page,
  }) => {
    // A row whose B1 band is a genuine measured ZERO — the case E11-05 forbids
    // conflating with "not administered".
    const documentId = teacherOwned(
      `and (r.supplementary ->> 'vocab_band_b1_accuracy')::numeric = 0
         and r.supplementary ->> 'vocab_band_a2_accuracy' is not null`,
    );
    const stored = storedSupplementary(documentId);
    expect(stored.vocab_band_b1_accuracy).toBe(0);

    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${documentId}`);

    const panel = page.locator('[data-slot="report-supplementary"]');
    await expect(panel).toHaveAttribute('data-state', 'bands', { timeout: 20_000 });

    const bands = page.locator('[data-slot="report-supplementary-band"]');
    await expect(bands).toHaveCount(2);
    // Fixed A2 -> B1 order, so the contrast reads as a step between two rows.
    expect(await bands.evaluateAll((els) => els.map((el) => el.getAttribute('data-code')))).toEqual(
      ['a2', 'b1'],
    );

    for (const [code, accuracy] of [
      ['a2', stored.vocab_band_a2_accuracy],
      ['b1', stored.vocab_band_b1_accuracy],
    ] as const) {
      const row = page.locator(`[data-slot="report-supplementary-band"][data-code="${code}"]`);
      expect(accuracy).not.toBeNull();
      await expect(row, code).toHaveAttribute('data-state', 'measured');
      await expect(row, code).toHaveAttribute('data-accuracy', String(accuracy));
      await expect(row.locator('[data-slot="report-supplementary-value"]'), code).toHaveText(
        PERCENT.format(accuracy as number),
      );
    }

    // The measured zero is a percentage, NOT the absence phrase.
    await expect(
      page.locator('[data-slot="report-supplementary-band"][data-code="b1"]'),
    ).toHaveText(/0%/);
    await expect(
      page
        .locator('[data-slot="report-supplementary-band"][data-code="b1"]')
        .getByText(cat(en, 'Report.supplementaryNotAdministered'), { exact: true }),
    ).toHaveCount(0);
  });

  test('a null band says "not administered" and renders no percentage at all', async ({ page }) => {
    const documentId = teacherOwned(
      `and r.supplementary is not null
         and r.supplementary ->> 'vocab_band_b1_accuracy' is null`,
    );
    const stored = storedSupplementary(documentId);
    expect(stored.vocab_band_b1_accuracy).toBeNull();

    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${documentId}`);

    const row = page.locator('[data-slot="report-supplementary-band"][data-code="b1"]');
    await expect(row).toHaveAttribute('data-state', 'not_administered', { timeout: 20_000 });
    // The shape carries no accuracy, so there is no attribute to default to 0.
    expect(await row.getAttribute('data-accuracy')).toBeNull();
    await expect(row.locator('[data-slot="report-supplementary-value"]')).toHaveText(
      cat(en, 'Report.supplementaryNotAdministered'),
    );
    await expect(row).not.toHaveText(/%/);
    await expect(row).toContainText(cat(en, 'Report.supplementaryNotAdministeredNote'));
  });

  test('the strand is a card of its own, outside the modelled attribute bars', async ({ page }) => {
    const documentId = teacherOwned(`and r.supplementary is not null and r.attributes is not null`);

    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${documentId}`);

    const strand = page.locator('[data-slot="report-supplementary"]');
    await expect(strand).toHaveAttribute('data-state', 'bands', { timeout: 20_000 });

    // Not nested inside the attribute panel, and carrying no attribute rows.
    expect(
      await strand.evaluate((el) => el.closest('[data-slot="report-attributes"]') !== null),
    ).toBe(false);
    await expect(strand.locator('[data-slot="report-attribute-row"]')).toHaveCount(0);
    await expect(strand.locator('[data-slot="report-attribute-track"]')).toHaveCount(0);
    await expect(strand.locator('[data-slot="status-pill"]')).toHaveText(
      cat(en, 'Report.supplementaryOutOfModel'),
    );
    await expect(strand).toContainText(cat(en, 'Report.supplementarySource'));
  });

  test('the qualifier cross-reference is exactly what the server composed — no more, no less', async ({
    page,
  }) => {
    // Premise, re-proved from the datastore rather than assumed: the two rows in
    // this database whose display_label carries a jaggedness qualifier have NO
    // student link at all, so no teacher can reach one and the positive branch
    // has no live row to drive today. The assertion below is written for both
    // branches off the REAL stored label, so it proves the negative now and
    // starts proving the positive the moment a qualified official result exists.
    expect(
      runSql(
        `select count(*) from results r
           join results_student_lnk rs on rs.result_id = r.id
          where r.display_label like '%(%'`,
      ),
    ).toBe('0');

    const documentId = teacherOwned(`and r.supplementary is not null`);
    const displayLabel = runSql(
      `select coalesce(display_label, '') from results where document_id = '${documentId}'`,
    );
    const match = /\(([^()]*)\)$/.exec(displayLabel.trim());
    const qualifiers = (
      match === null ? [] : match[1].split(';').map((part) => part.trim())
    ).filter((part) => part.length > 0);

    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${documentId}`);

    const strand = page.locator('[data-slot="report-supplementary"]');
    await expect(strand).toHaveAttribute('data-state', 'bands', { timeout: 20_000 });

    const link = page.locator('[data-slot="report-supplementary-qualifier-link"]');
    if (qualifiers.length === 0) {
      // Nothing invented: a label with no qualifier gets no cross-reference line.
      await expect(link).toHaveCount(0);
      await expect(page.locator('[data-slot="report-jaggedness-qualifiers"]')).toHaveCount(0);
    } else {
      await expect(link).toBeVisible();
      for (const qualifier of qualifiers) await expect(link).toContainText(qualifier);
    }
  });

  test('a receptive result with no strand yet says "not derived yet", not 0%', async ({ page }) => {
    const documentId = teacherOwned(`and r.skill = 'reading' and r.supplementary is null`);

    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${documentId}`);

    const panel = page.locator('[data-slot="report-supplementary"]');
    await expect(panel).toHaveAttribute('data-state', 'pending', { timeout: 20_000 });
    await expect(panel.locator('[data-slot="report-supplementary-absent"]')).toHaveText(
      cat(en, 'Report.supplementaryPending'),
    );
    await expect(panel).not.toHaveText(/%/);
  });

  test('a productive-skill result says the strand does not apply to it', async ({ page }) => {
    const documentId = teacherOwned(`and r.skill = 'writing' and r.supplementary is null`);

    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${documentId}`);

    const panel = page.locator('[data-slot="report-supplementary"]');
    await expect(panel).toHaveAttribute('data-state', 'not_applicable', { timeout: 20_000 });
    await expect(panel.locator('[data-slot="report-supplementary-absent"]')).toHaveText(
      cat(en, 'Report.supplementaryNotApplicable'),
    );
  });

  test('the strand survives a hard reload byte for byte (it comes from Postgres)', async ({
    page,
  }) => {
    const documentId = teacherOwned(`and r.supplementary is not null`);

    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${documentId}`);

    const bands = page.locator('[data-slot="report-supplementary-band"]');
    await expect(bands.first()).toBeVisible({ timeout: 20_000 });
    const before = await bands.allInnerTexts();
    expect(before.join('')).not.toBe('');

    await page.reload();
    await expect(bands.first()).toBeVisible({ timeout: 20_000 });
    expect(await bands.allInnerTexts()).toEqual(before);
  });
});
