import { expect, test, type Page } from '@playwright/test';

// Leaf import, not the barrel: the barrel re-exports React components and
// Playwright evaluates specs in plain Node, where next-intl's client navigation
// entry cannot resolve. The rule about barrel-only imports governs src/modules.
import { splitDisplayLabel } from '@/modules/report/lib/display-label';

import { apiEnv, runSql } from './helpers/auth-db';
import { SEEDED_PARENT } from './helpers/auth';
import { cat, loadMessages } from './helpers/i18n';

// E11-01 / F-WEB-TEACHER-REPORT — the teacher route guard and the C-4/C-11
// report data layer, driven against the REAL portal, the REAL Strapi and the
// REAL Postgres. Nothing here is fixtured: the expected display label is read
// out of `public.results` with psql and compared to what the page renders.
const en = loadMessages('en');

interface SeededResult {
  documentId: string;
  displayLabel: string;
}

function teacherOwnedResult(): SeededResult {
  const row = runSql(
    `select r.document_id, r.display_label
       from results r
       join results_student_lnk rs on rs.result_id = r.id
       join students s on s.id = rs.student_id
       join students_teacher_lnk tl on tl.student_id = s.id
       join up_users u on u.id = tl.user_id
      where u.email = 'teacher@schooltest.local'
        and r.destination = 'official'
        and r.display_label is not null
      order by r.created_at desc
      limit 1`,
  );
  const [documentId, displayLabel] = row.split('\n')[0].split('|');
  if (!documentId || !displayLabel)
    throw new Error(`[e2e] no teacher-owned labelled result: ${row}`);
  return { documentId, displayLabel };
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL('**/dashboard');
}

const signInAsTeacher = (page: Page) =>
  signIn(page, 'teacher@schooltest.local', apiEnv('SEED_TEACHER_PASSWORD'));

test.describe('teacher report route guard + data layer', () => {
  test('anonymous visitor is bounced off the report routes to /sign-in', async ({ page }) => {
    await page.goto('/dashboard/reports');
    await page.waitForURL('**/sign-in');
    await expect(
      page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }),
    ).toBeVisible();
  });

  test('teacher sees the rail entry, the C-11 list and the C-4 report', async ({ page }) => {
    const seeded = teacherOwnedResult();
    await signInAsTeacher(page);

    const reportsNav = page.getByRole('link', { name: cat(en, 'Shell.nav.reports'), exact: true });
    await expect(reportsNav).toBeVisible({ timeout: 20_000 });
    await reportsNav.click();
    await page.waitForURL('**/dashboard/reports');

    const rows = page.locator('[data-slot="report-list-row"]');
    await expect(rows.first()).toBeVisible({ timeout: 20_000 });
    expect(await rows.count()).toBeGreaterThan(0);

    await page.goto(`/dashboard/reports/${seeded.documentId}`);
    const label = page.locator('[data-slot="report-display-label-value"]');
    await expect(label).toBeVisible({ timeout: 20_000 });
    await expect(label).toHaveText(seeded.displayLabel.replace(/\s+\([^()]*\)$/, ''));
    await expect(page.getByText(cat(en, 'Report.displayLabelSource'))).toBeVisible();
  });

  test('the rendered label survives a hard reload (it comes from Postgres, not state)', async ({
    page,
  }) => {
    const seeded = teacherOwnedResult();
    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${seeded.documentId}`);
    const label = page.locator('[data-slot="report-display-label-value"]');
    await expect(label).toBeVisible({ timeout: 20_000 });
    const before = await label.textContent();

    await page.reload();
    await expect(label).toBeVisible();
    expect(await label.textContent()).toBe(before);
    expect(before).toBe(seeded.displayLabel.replace(/\s+\([^()]*\)$/, ''));
  });

  test('an unknown result documentId renders the gone state, never an empty report', async ({
    page,
  }) => {
    await signInAsTeacher(page);
    await page.goto('/dashboard/reports/e2enosuchresult000000000');
    await expect(page.locator('[data-query-error="gone"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(cat(en, 'Report.reportGoneTitle'))).toBeVisible();
  });

  test('a productive-skill result says the ladder does not apply, not "not derived yet"', async ({
    page,
  }) => {
    const documentId = runSql(
      `select r.document_id
         from results r
         join results_student_lnk rs on rs.result_id = r.id
         join students s on s.id = rs.student_id
         join students_teacher_lnk tl on tl.student_id = s.id
         join up_users u on u.id = tl.user_id
        where u.email = 'teacher@schooltest.local'
          and r.destination = 'official'
          and r.skill = 'writing'
          and r.display_label is null
        order by r.created_at desc
        limit 1`,
    ).split('\n')[0];
    expect(documentId).not.toBe('');

    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${documentId}`);
    const absent = page.locator('[data-slot="report-display-label-absent"]');
    await expect(absent).toBeVisible({ timeout: 20_000 });
    await expect(absent).toHaveAttribute('data-state', 'not_applicable');
    await expect(absent).toHaveText(cat(en, 'Report.displayLabelNotApplicable'));
  });

  test('the label/qualifier split round-trips every display_label the seed has produced', () => {
    // Bracketed so runSql's trim cannot eat the join's significant trailing space.
    const [format, bracketedJoin] = runSql(
      `select label_rules->>'qualifier_format', concat('[', label_rules->>'qualifier_join', ']')
         from crosswalks where active = true and skill = 'reading' limit 1`,
    ).split('|');
    const join = bracketedJoin.slice(1, -1);
    expect(format).toBe('{label} ({qualifiers})');
    expect(join).toBe('; ');

    const labels = runSql(
      `select distinct display_label from results where display_label is not null`,
    ).split('\n');
    expect(labels.length).toBeGreaterThan(1);

    for (const original of labels) {
      const parts = splitDisplayLabel(original);
      const recomposed =
        parts.qualifiers.length === 0
          ? parts.label
          : format
              .replace('{label}', parts.label)
              .replace('{qualifiers}', parts.qualifiers.join(join));
      expect(recomposed, original).toBe(original);
      expect(parts.qualifiers.length > 0, original).toBe(/\([^()]+\)$/.test(original));
    }
  });

  test('a parent account gets no rail entry and is redirected off the report route', async ({
    page,
  }) => {
    await signIn(page, SEEDED_PARENT.email, SEEDED_PARENT.password);
    await expect(
      page.getByRole('link', { name: cat(en, 'Shell.nav.reports'), exact: true }),
    ).toHaveCount(0);

    await page.goto('/dashboard/reports');
    await page.waitForURL('**/dashboard');
    await expect(page.locator('[data-surface="teacher-report-list"]')).toHaveCount(0);
  });
});
