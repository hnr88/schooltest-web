import { expect, test, type Locator, type Page } from '@playwright/test';

import { academicVocabResult, bridgeAcademicApi, PRE_INTEGRATION } from './helpers/academic-vocab';
import { apiEnv } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';

// Spec 4 — Academic Vocabulary (`Vocab_B2`) is a Rasch strand reported as the THIRD
// vocabulary skill: a four-step banded card/row after Everyday and Classroom
// Vocabulary, directly before Critical Reading, which stays the exit-gate pill. Driven
// against the REAL portal, the REAL API and the REAL Postgres (the result is picked
// from the database, the copy comes from the shipped catalogue). Run it on the
// integrated stack; see helpers/academic-vocab.ts for the CORS bridge and the
// pre-integration shim (SPEC4_PRE_INTEGRATION=1: the strand renders not assessed).
const en = loadMessages('en');
const TEACHER = process.env.SPEC4_TEACHER_EMAIL ?? 'teacher@schooltest.local';
const MODE = PRE_INTEGRATION ? 'pre-integration' : 'integrated';
const VOCAB = ['Vocab_A2', 'Vocab_B1', 'Vocab_B2'];
const GATE_LABELS = [cat(en, 'TeacherPortal.viewModel.gate.passed'), cat(en, 'TeacherPortal.viewModel.gate.notYet')];

test.use({ viewport: { width: 1440, height: 1000 } });

async function attach(page: Page, name: string, target?: Locator): Promise<void> {
  const body = target === undefined
    ? await page.screenshot({ fullPage: true, animations: 'disabled' })
    : await target.screenshot({ animations: 'disabled' });
  await test.info().attach(`${MODE}-${name}`, { body, contentType: 'image/png' });
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(TEACHER);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(apiEnv('SEED_TEACHER_PASSWORD'));
  await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
  await page.waitForURL('**/dashboard', { timeout: 60_000 });
}

/** The `TeacherPortal.viewModel.band.*` key of a stored band. */
function teacherBandLabel(band: string): string {
  return cat(en, `TeacherPortal.viewModel.band.${band === 'not_yet' ? 'notYet' : band}`);
}

test.describe(`Spec 4 — Academic Vocabulary as the third vocabulary row (${MODE})`, () => {
  test.beforeEach(async ({ page, baseURL }) => {
    test.setTimeout(300_000);
    await bridgeAcademicApi(page, new URL(baseURL ?? 'http://localhost:3000').origin);
    await signIn(page);
  });

  test('student drill-down: Everyday → Classroom → Academic cards, Academic banded, Critical still the gate pill', async ({ page }) => {
    const target = academicVocabResult(TEACHER);
    test.info().annotations.push({ type: 'result', description: JSON.stringify(target) });
    await page.goto(`/dashboard/results/${target.classId}/students/${target.studentId}`);

    const cards = page.locator('[data-slot="student-subskill"]');
    await expect(cards.first()).toBeVisible({ timeout: 90_000 });
    await expect(cards).toHaveCount(9);
    const order = await cards.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-skill') ?? ''));
    expect(order.filter((skill) => VOCAB.includes(skill))).toEqual(VOCAB);
    expect(order.indexOf('Vocab_B2')).toBe(order.indexOf('Critical') - 1);

    const academic = page.locator('[data-slot="student-subskill"][data-skill="Vocab_B2"]');
    await expect(academic).toContainText(cat(en, 'TeacherPortal.viewModel.attribute.vocabB2'));
    for (const gate of GATE_LABELS) await expect(academic).not.toContainText(gate);
    if (PRE_INTEGRATION) {
      await expect(academic).toHaveAttribute('data-assessed', 'false');
      test.info().annotations.push({ type: 'deferred', description: 'the banded Academic card needs the spec-4 API' });
    } else {
      await expect(academic).toHaveAttribute('data-assessed', 'true');
      await expect(academic.locator('[data-slot="status-pill"]', { hasText: teacherBandLabel(target.band) })).toHaveCount(1);
    }

    const critical = page.locator('[data-slot="student-subskill"][data-skill="Critical"]');
    await expect(critical.locator('[data-slot="status-pill"]', { hasText: GATE_LABELS[target.gatePassed ? 0 : 1] })).toHaveCount(1);

    await academic.scrollIntoViewIfNeeded();
    await attach(page, 'student-page');
    await attach(page, 'student-subskill-cards', page.locator('[data-slot="student-subskills"]'));
  });

  test('teacher report: the Academic banded row follows Classroom Vocabulary in the attribute panel', async ({ page }) => {
    const target = academicVocabResult(TEACHER);
    test.info().annotations.push({ type: 'result', description: JSON.stringify(target) });
    await page.goto(`/dashboard/reports/${target.resultId}`);

    const panel = page.locator('[data-slot="report-attributes"]');
    await expect(panel).toBeVisible({ timeout: 90_000 });
    const rows = panel.locator('[data-slot="report-attribute-row"]');
    const order = await rows.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-attribute') ?? ''));
    expect(order.filter((name) => VOCAB.includes(name))).toEqual(VOCAB);
    expect(order.at(-1)).toBe('Vocab_B2');

    const academic = panel.locator('[data-slot="report-attribute-row"][data-attribute="Vocab_B2"]');
    await expect(academic).toContainText(cat(en, 'Report.attributes.Vocab_B2'));
    await expect(academic.locator('[data-slot="trend-delta"]')).toHaveCount(0);
    if (PRE_INTEGRATION) {
      await expect(academic).toHaveAttribute('data-state', 'not_assessed');
    } else {
      await expect(academic).toHaveAttribute('data-state', 'assessed');
      await expect(academic.locator('[data-slot="status-pill"]')).toHaveText(cat(en, `Report.attributeStatus.${target.band}`));
      await expect(academic.locator('[data-slot="report-evidence-count"]')).toHaveAttribute('data-items-seen', String(target.itemsSeen));
    }

    await academic.scrollIntoViewIfNeeded();
    await attach(page, 'teacher-report');
    await attach(page, 'teacher-report-attribute-rows', panel);
  });
});
