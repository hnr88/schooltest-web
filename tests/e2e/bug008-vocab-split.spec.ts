import path from 'node:path';

import { expect, test, type Locator, type Page } from '@playwright/test';

import { apiEnv } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';
import { bridgeApi, PRE_INTEGRATION, PROOF_DIR, vocabSplitResult } from './helpers/vocab-split';

// BUG-008 — vocabulary is reported as two named skills, Everyday (Vocab_A2) and
// Classroom (Vocab_B1), and the blended "Vocabulary" figure is gone. Driven against the
// REAL portal (this worktree's `next dev`), the REAL API and the REAL Postgres: the
// result is picked from the database, the expected labels come from the shipped
// catalogue. See helpers/vocab-split.ts for the CORS bridge and the pre-integration shim.
const en = loadMessages('en');
const TEACHER = process.env.BUG008_TEACHER_EMAIL ?? 'teacher@schooltest.local';
const EVERYDAY = cat(en, 'Report.attributes.Vocab_A2');
const CLASSROOM = cat(en, 'Report.attributes.Vocab_B1');
const MODE = PRE_INTEGRATION ? 'pre-integration' : 'integrated';
const BLENDED_LABEL = /^\s*Vocabulary\s*(\((A2|B1)\))?\s*$/;

test.use({ viewport: { width: 1440, height: 1000 } });

function shot(page: Page, name: string) {
  return page.screenshot({ path: path.join(PROOF_DIR, `${MODE}-${name}.png`), fullPage: true, animations: 'disabled' });
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(TEACHER);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(apiEnv('SEED_TEACHER_PASSWORD'));
  await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
  await page.waitForURL('**/dashboard', { timeout: 60_000 });
}

/** No element whose whole text is a bare/blended "Vocabulary" label. */
async function expectNoBlendedLabel(scope: Locator): Promise<void> {
  await expect(scope.getByText(BLENDED_LABEL)).toHaveCount(0);
}

test.describe(`BUG-008 vocabulary split (${MODE})`, () => {
  test.beforeEach(async ({ page, baseURL }) => {
    test.setTimeout(300_000);
    await bridgeApi(page, new URL(baseURL ?? 'http://localhost:3000').origin);
    await signIn(page);
  });

  test('teacher report: Everyday and Classroom Vocabulary are two rows, each with its own band; no blended row', async ({ page }) => {
    const target = vocabSplitResult(TEACHER);
    test.info().annotations.push({ type: 'result', description: JSON.stringify(target) });
    await page.goto(`/dashboard/reports/${target.resultId}`);

    const panel = page.locator('[data-slot="report-attributes"]');
    await expect(panel).toBeVisible({ timeout: 90_000 });
    const everyday = panel.locator('[data-slot="report-attribute-row"][data-attribute="Vocab_A2"]');
    const classroom = panel.locator('[data-slot="report-attribute-row"][data-attribute="Vocab_B1"]');
    await expect(everyday).toContainText(EVERYDAY);
    await expect(classroom).toContainText(CLASSROOM);
    await expect(everyday.locator('[data-slot="report-attribute-score"]')).toHaveText(String(target.a2));
    await expect(classroom.locator('[data-slot="report-attribute-score"]')).toHaveText(String(target.b1));
    await expect(panel.locator('[data-slot="report-attribute-row"][data-attribute="Vocabulary"]')).toHaveCount(0);
    await expectNoBlendedLabel(panel);
    await expect(page.locator('[data-observation^="vocabulary"]')).toHaveCount(0);
    await everyday.scrollIntoViewIfNeeded();
    await shot(page, 'teacher-report');
    await panel.screenshot({ path: path.join(PROOF_DIR, `${MODE}-teacher-report-attribute-rows.png`), animations: 'disabled' });

    // The parent/student face of the same result names the strands, never a blend.
    await page.locator('[data-slot="report-view-toggle"]').getByRole('button', { name: cat(en, 'Report.viewModes.parent') }).click();
    const parent = page.locator('[data-slot="report-parent-view"]');
    await expect(parent).toBeVisible();
    // Strengths and the focus line name skills by the same catalogue; a vocabulary strand
    // that makes either list appears under its own register name.
    const named = parent.locator('[data-slot="report-family-strength"], [data-slot="report-family-next-step"]');
    await expect(named.filter({ hasText: new RegExp(`${EVERYDAY}|${CLASSROOM}`) }).first()).toBeVisible();
    await expect(parent).not.toContainText('Vocabulary (');
    await expectNoBlendedLabel(parent);
    await shot(page, 'parent-view');
  });

  test('student page and class progress: two vocabulary cards and two trend rows, never one blended', async ({ page }) => {
    const target = vocabSplitResult(TEACHER);
    const everydayLabel = cat(en, 'TeacherPortal.viewModel.attribute.vocabA2');
    const classroomLabel = cat(en, 'TeacherPortal.viewModel.attribute.vocabB1');

    await page.goto(`/dashboard/results/${target.classId}/students/${target.studentId}`);
    const everyday = page.locator('[data-slot="student-subskill"][data-skill="Vocab_A2"]');
    const classroom = page.locator('[data-slot="student-subskill"][data-skill="Vocab_B1"]');
    await expect(everyday).toBeVisible({ timeout: 90_000 });
    await expect(everyday).toContainText(everydayLabel);
    await expect(classroom).toContainText(classroomLabel);
    await expect(page.locator('[data-slot="student-subskill"][data-skill="Vocabulary"]')).toHaveCount(0);
    await expect(page.locator('[data-slot="student-subskill"]')).toHaveCount(8);
    await everyday.scrollIntoViewIfNeeded();
    await shot(page, 'student-page');
    await page.locator('[data-slot="student-subskills"]').screenshot({ path: path.join(PROOF_DIR, `${MODE}-student-subskill-cards.png`), animations: 'disabled' });

    await page.goto(`/dashboard/results/${target.classId}?tab=progress`);
    const progress = page.locator('[data-tab-panel="progress"]');
    await expect(progress).toBeVisible({ timeout: 90_000 });
    const trends = progress.locator('[data-slot="progress-subskill-trend"]');
    await expect(progress.locator('[data-slot="progress-subskill-trend"][data-skill="Vocabulary"]')).toHaveCount(0);
    if (PRE_INTEGRATION) {
      // The old API recorded no per-strand history, so the shim left those points null:
      // the strand lines appear only once the new API serves them (post-integration run).
      test.info().annotations.push({ type: 'deferred', description: 'two vocabulary trend lines need post-integration history' });
    } else {
      await expect(trends.filter({ hasText: everydayLabel })).toHaveCount(1);
      await expect(trends.filter({ hasText: classroomLabel })).toHaveCount(1);
    }
    await expectNoBlendedLabel(progress);
    await progress.scrollIntoViewIfNeeded();
    await shot(page, 'class-progress-trends');
  });
});
