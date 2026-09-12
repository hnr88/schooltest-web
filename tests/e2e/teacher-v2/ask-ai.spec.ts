import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page, type Response } from '@playwright/test';

import { teacherAskResponseSchema } from '@/modules/teacher/schemas/teacher-ask.schema';
import { createDemoLinkResponseSchema } from '@/modules/teacher/schemas/teacher-demo-link.schema';

import { cat } from '../helpers/i18n';
import { en, signIn } from '../helpers/teacher-rail';

// S11 — the Ask AI drawers (design S13/S16) and the Teacher demo link (design S29) on the
// REAL API, with NO interception. Every answer here is whatever C-TA-1 really returned:
// either a 200 the drawer prints verbatim, or the contracted 503 this box returns while it
// has no LLM gateway (TB-44). Nothing in this spec accepts an answer the browser invented.
const PROOFS = path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'teacher-v2');
const ask = (key: string) => cat(en, `TeacherPortal.askAi.${key}`);
const detail = (key: string) => cat(en, `TeacherPortal.classDetail.${key}`);
const drawer = (page: Page) => page.locator('[data-slot="ask-ai-drawer"]');
const lastAnswer = (page: Page) => drawer(page).locator('[data-slot="ask-ai-message"][data-role="ai"]').last();
const isAsk = (response: Response) =>
  response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/teacher/ask';

/**
 * Sends one question and asserts the bubble against WHAT THE SERVER ANSWERED.
 * A 200 must be printed verbatim (refusals under their own title, with the cohort
 * line C-TA-1 sent); anything else must be the honest error state carrying the
 * server's own sentence. There is no third branch — a drawer that answered from
 * the browser would match neither.
 */
async function askAndAssert(page: Page, send: () => Promise<void>, scope: 'class' | 'student'): Promise<string> {
  const pending = page.waitForResponse(isAsk, { timeout: 60_000 });
  await send();
  const response = await pending;
  const bubble = lastAnswer(page);
  await expect(bubble).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-slot="ask-ai-pending"]')).toHaveCount(0);

  if (response.status() === 200) {
    const answer = teacherAskResponseSchema.parse(await response.json());
    expect(answer.grounding.scope).toBe(scope);
    await expect(bubble).toHaveAttribute('data-tone', answer.refused ? 'refused' : 'answer');
    await expect(bubble).toContainText(answer.answer.slice(0, 60));
    if (answer.refused) {
      await expect(bubble.locator('[data-slot="ask-ai-answer-title"]')).toHaveText(ask(`${scope}.refusedTitle`));
    }
    await expect(bubble.locator('[data-slot="ask-ai-grounding"]')).toBeVisible();
    return `200 refused=${answer.refused} grounding=${JSON.stringify(answer.grounding)}`;
  }

  // TB-44 — no LLM gateway on this box: the drawer says so in the API's own words.
  expect(response.status()).toBe(503);
  const body = (await response.json()) as { error: { message: string } };
  await expect(bubble).toHaveAttribute('data-tone', 'error');
  await expect(bubble.locator('[data-slot="ask-ai-answer-title"]')).toHaveText(ask('unavailableTitle'));
  await expect(bubble).toContainText(body.error.message);
  await expect(bubble.locator('[data-slot="ask-ai-grounding"]')).toHaveCount(0);
  return `503 ${body.error.message}`;
}

test.use({ viewport: { width: 1440, height: 900 } });

test('S11 — the class and student Ask AI drawers answer from the real /teacher/ask', async ({ page }) => {
  test.setTimeout(300_000);
  mkdirSync(PROOFS, { recursive: true });
  await signIn(page, 'teacher');
  await page.waitForURL('**/dashboard/results');

  const classRow = page.locator('[data-slot="results-class-row"]').first();
  await expect(classRow).toBeVisible({ timeout: 30_000 });
  const classId = await classRow.getAttribute('data-class-id');
  await page.goto(`/dashboard/results/${classId}`);

  // TB-31: the class header's Ask AI is drawn and opens the class-scope drawer.
  const header = page.locator('[data-slot="class-results-header"]');
  const askButton = header.locator('[data-slot="class-ask-ai-button"]');
  await expect(askButton).toHaveText(detail('askAi'), { timeout: 30_000 });
  const className = (await header.getByRole('heading', { level: 1 }).innerText()).trim();
  await askButton.click();
  await expect(drawer(page)).toBeVisible();
  await expect(drawer(page)).toContainText(className);
  await expect(drawer(page).locator('[data-slot="ask-ai-suggestion"]')).toHaveCount(3);

  const teachNext = drawer(page).getByRole('button', { name: ask('class.suggest.teach') });
  const first = await askAndAssert(page, () => teachNext.click(), 'class');
  test.info().annotations.push({ type: 'teacher/ask · class · teach next', description: first });
  await page.screenshot({ path: path.join(PROOFS, 'ask-ai-class.png'), animations: 'disabled' });

  // A question the reading results cannot answer. A 200 must be the model refusing;
  // a 503 must still be the honest unavailable state.
  // Enter sends, as the design's composer does (the Send button is asserted by the
  // drawer's own markup; clicking it here would race the dev-tools overlay).
  const field = drawer(page).getByRole('textbox', { name: ask('inputLabel') });
  await field.fill('Which students have been absent most this term?');
  const second = await askAndAssert(page, () => field.press('Enter'), 'class');
  test.info().annotations.push({ type: 'teacher/ask · class · attendance', description: second });

  await drawer(page).getByRole('button', { name: ask('close') }).click();
  await expect(drawer(page)).toHaveCount(0);

  // The same drawer, student scope, on a student who really has a scored result.
  const scoredRow = page.locator('[data-slot="student-results-row"][data-scored="true"]').first();
  await expect(scoredRow).toBeVisible({ timeout: 30_000 });
  const studentId = await scoredRow.getAttribute('data-student-id');
  await page.goto(`/dashboard/results/${classId}/students/${studentId}`);
  const studentHeader = page.locator('[data-slot="student-drill-down-header"]');
  await expect(studentHeader.locator('h1')).toBeVisible({ timeout: 30_000 });
  const studentName = (await studentHeader.locator('h1').innerText()).trim();
  await studentHeader.locator('[data-slot="student-ask-ai-button"]').click();
  await expect(drawer(page)).toBeVisible();

  const studentField = drawer(page).getByRole('textbox', { name: ask('inputLabel') });
  await studentField.fill(`What should I focus on next with ${studentName}?`);
  const third = await askAndAssert(page, () => studentField.press('Enter'), 'student');
  test.info().annotations.push({ type: 'teacher/ask · student', description: third });
  await page.screenshot({ path: path.join(PROOFS, 'ask-ai-student.png'), animations: 'disabled' });
});

test('S11 — Teacher demo mints a real /teacher/demo-link and shows the link and its expiry', async ({ page }) => {
  test.setTimeout(180_000);
  mkdirSync(PROOFS, { recursive: true });
  const startSession = (key: string) => cat(en, `TeacherPortal.startSession.${key}`);
  await signIn(page, 'teacher');
  await page.waitForURL('**/dashboard/results');

  await page.locator('[data-slot="start-session-button"]').click();
  const modal = page.locator('[data-surface="start-session-modal"]');
  await expect(modal.getByRole('heading', { name: startSession('title') })).toBeVisible({ timeout: 30_000 });
  await modal.locator('[data-slot="start-choice"][data-value="demo"]').click();
  await expect(modal.getByRole('heading', { name: startSession('titleDemo') })).toBeVisible();

  const cta = modal.locator('[data-slot="start-session-cta"]');
  await expect(cta).toHaveText(startSession('cta.startDemo'));
  await expect(cta).not.toHaveAttribute('aria-disabled', 'true');

  const minted = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === '/api/teacher/demo-link',
    { timeout: 60_000 },
  );
  await cta.click();
  const response = await minted;
  expect(response.status()).toBe(201);
  const link = createDemoLinkResponseSchema.parse(await response.json());

  const dialog = page.locator('[data-surface="demo-link-dialog"]');
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  await expect(modal).toHaveCount(0);
  // The link on screen is the token the server minted, not a rebuilt URL.
  await expect(dialog.locator('[data-slot="demo-link-url"]')).toHaveText(link.web_url);
  await expect(dialog.locator('[data-slot="demo-link-open"]')).toHaveAttribute('href', link.web_url);
  await expect(dialog.getByRole('heading', { name: startSession('demoLink.title') })).toBeVisible();
  // The expiry on screen is the token row's own, printed in the browser's zone.
  const expires = new Date(link.expires_at);
  expect(expires.getTime()).toBeGreaterThan(Date.now());
  const shown = await page.evaluate(
    (iso) => new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    link.expires_at,
  );
  await expect(dialog.getByText(shown, { exact: false })).toBeVisible();

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await dialog.locator('[data-slot="demo-link-copy"]').click();
  await expect(dialog.locator('[data-slot="demo-link-copy"]')).toHaveText(startSession('demoLink.copied'));
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link.web_url);
  await page.screenshot({ path: path.join(PROOFS, 'demo-link.png'), animations: 'disabled' });

  await dialog.getByRole('button', { name: startSession('demoLink.done') }).click();
  await expect(dialog).toHaveCount(0);
});
