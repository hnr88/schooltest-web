import { expect, test, type Page } from '@playwright/test';

import type { RosterRow } from '@/modules/results/types/roster.types';
import { acaraPhaseKey } from '@/modules/teacher/lib/teacher-kit';

import { cat } from './helpers/i18n';
import { en, signIn } from './helpers/teacher-rail';
import { fr, icu } from './helpers/teacher-family-reports';
import { READY, firstClassWith, frame, header, sectionTab } from './helpers/teacher-class-detail';

// Spec 06 — the rebuilt Reports tab: the release workflow is gone; an audience picker
// (Parents & carers default) drives the note, the class-summary card (non-parent
// audiences only, download disabled "coming soon") and the per-student PDF list. Real
// sign-in, real API, no interception: every expected string is the en catalog's, every
// expectation is tallied from the roster read the page itself received. The per-student
// and download-all PDFs are the existing print-window exports, proven by their popups.

test.describe.configure({ mode: 'serial' });

const kit = (key: string) => cat(en, `TeacherPortal.kit.${key}`);
const panel = (page: Page) => page.locator('[data-tab-panel="reports"] [data-slot="family-reports"]');
const rowOf = (page: Page, id: string) =>
  panel(page).locator(`[data-slot="reports-student-row"][data-student-id="${id}"]`);

let page: Page;
let roster: RosterRow[];
let className: string;
let scoredCount: number;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await signIn(page, 'teacher');
  await page.waitForURL('**/dashboard/results');
  const picked = await firstClassWith(
    page,
    (rows) => rows.some((row) => row.result !== null && row.result.overall.domain_score !== null),
  );
  roster = picked.roster;
  scoredCount = roster.filter(
    (row) => row.result !== null && row.result.overall.domain_score !== null,
  ).length;
  await expect(frame(page)).toHaveAttribute('data-status', READY, { timeout: 30_000 });
  className = ((await header(page).locator('h1').textContent()) ?? '').trim();
  await sectionTab(page, 'reports').click();
  await expect(panel(page)).toHaveAttribute('data-status', READY, { timeout: 30_000 });
});

test.afterAll(async () => {
  await page.close();
});

test('Parents & carers is the default audience: picker, note, no class card, wired meta', async ({}, testInfo) => {
  const audiences = ['parents', 'teachers', 'principal', 'admin'];
  await expect(panel(page).getByRole('heading', { level: 2 })).toHaveText(fr('title'));
  const picker = panel(page).locator('[data-slot="reports-audiences"]');
  await expect(picker.getByRole('button')).toHaveText(audiences.map((key) => fr(`audiences.${key}`)));
  for (const key of audiences) {
    await expect(picker.locator(`[data-audience="${key}"]`)).toHaveAttribute(
      'aria-pressed',
      key === 'parents' ? 'true' : 'false',
    );
  }
  await expect(panel(page).locator('[data-slot="reports-note"]')).toHaveText(fr('notes.parents'));
  await expect(panel(page).locator('[data-slot="reports-class-card"]')).toHaveCount(0);
  await expect(panel(page).locator('[data-slot="reports-students-meta"]')).toHaveText(
    icu(fr('students.meta'), { scored: scoredCount, total: roster.length, audience: fr('audiences.parents') }),
  );
  await expect(panel(page).locator('[data-slot="reports-student-row"]')).toHaveCount(roster.length);
  await expect(panel(page).locator('[data-slot="reports-download-all"]')).toBeEnabled();
  await testInfo.attach('reports-parents-picker', {
    body: await panel(page).locator('[data-slot="reports-audiences"]').screenshot(),
    contentType: 'image/png',
  });
  await panel(page).scrollIntoViewIfNeeded();
  await testInfo.attach('reports-parents', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
});

test('the release workflow is gone: no release / recall / preview controls, no banner or tiles', async () => {
  const reports = panel(page);
  for (const name of [/release/i, /recall/i, /preview/i]) {
    await expect(reports.getByRole('button', { name }), `no ${name} button`).toHaveCount(0);
  }
  for (const slot of [
    'family-report-banner',
    'family-report-tiles',
    'family-report-row',
    'family-report-score',
    'carer-report-preview',
    'recall-report-dialog',
  ]) {
    await expect(page.locator(`[data-slot="${slot}"]`), `${slot} is retired`).toHaveCount(0);
  }
  await expect(page.locator('[data-action="release-held"]')).toHaveCount(0);
});

for (const audience of ['teachers', 'principal', 'admin'] as const) {
  test(`switching to ${audience} swaps the note and shows the class card, every download gated`, async ({}, testInfo) => {
    await panel(page).locator(`[data-audience="${audience}"]`).click();
    await expect(panel(page)).toHaveAttribute('data-audience', audience);
    await expect(panel(page).locator(`[data-audience="${audience}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(panel(page).locator('[data-slot="reports-note"]')).toHaveText(fr(`notes.${audience}`));
    const card = panel(page).locator('[data-slot="reports-class-card"]');
    await expect(card).toHaveCount(1);
    await expect(card.locator('[data-slot="reports-class-meta"]')).toHaveText(
      icu(fr('classCard.meta'), {
        className,
        scored: scoredCount,
        total: roster.length,
        audience: fr(`audiences.${audience}`),
      }),
    );
    await expect(card.locator('[data-slot="reports-class-download"]')).toBeDisabled();
    await expect(card).toContainText(fr('comingSoon'));
    await expect(panel(page).locator('[data-slot="reports-students-meta"]')).toHaveText(
      icu(fr('students.meta'), { scored: scoredCount, total: roster.length, audience: fr(`audiences.${audience}`) }),
    );
    await expect(panel(page).locator('[data-slot="reports-download-all"]')).toBeDisabled();
    const pdfs = panel(page).locator('[data-slot="reports-student-pdf"]');
    await expect(pdfs).toHaveCount(scoredCount);
    for (let index = 0; index < scoredCount; index += 1) await expect(pdfs.nth(index)).toBeDisabled();
    await testInfo.attach(`reports-${audience}-class-card`, {
      body: await card.screenshot(),
      contentType: 'image/png',
    });

    await panel(page).locator('[data-audience="parents"]').click();
    await expect(panel(page).locator('[data-slot="reports-note"]')).toHaveText(fr('notes.parents'));
    await expect(panel(page).locator('[data-slot="reports-class-card"]')).toHaveCount(0);
    await expect(panel(page).locator('[data-slot="reports-download-all"]')).toBeEnabled();
  });
}

test('rows: initials, name, phase chip or grey dash, PDF button vs "No result yet"', async ({}, testInfo) => {
  if (!roster.some((entry) => entry.result === null)) {
    testInfo.annotations.push({
      type: 'fixture-gap',
      description: 'the live roster carries no result-less student, so the "No result yet" arm is unexercised here',
    });
  }
  for (const entry of roster) {
    const row = rowOf(page, entry.student.document_id);
    await expect(row).toContainText(entry.student.name);
    await expect(row.locator('[data-slot="avatar-tint"]')).toHaveText(entry.student.initials);
    await expect(row).toHaveAttribute('data-has-result', entry.result === null ? 'false' : 'true');
    if (entry.result === null || entry.result.overall.domain_score === null) {
      await expect(row).toHaveAttribute('data-scored', 'false');
      await expect(row.locator('[data-slot="reports-no-result"]')).toHaveText(fr('students.noResultYet'));
      await expect(row.locator('[data-slot="reports-student-pdf"]')).toHaveCount(0);
    } else {
      await expect(row).toHaveAttribute('data-scored', 'true');
      await expect(row.locator('[data-slot="reports-student-pdf"]')).toBeEnabled();
      await expect(row.locator('[data-slot="reports-student-pdf"]')).toHaveAttribute(
        'aria-label',
        icu(fr('students.pdfFor'), { name: entry.student.name }),
      );
      await expect(row.locator('[data-slot="reports-no-result"]')).toHaveCount(0);
    }
    const phaseKey = entry.result === null ? null : acaraPhaseKey(entry.result.acara_phase);
    await expect(row.locator('[data-slot="reports-phase"]')).toHaveText(
      phaseKey === null ? kit('noValue') : kit(`phase.${phaseKey}`),
    );
  }
});

test('a scored student’s PDF button opens the real per-student report', async () => {
  const target = roster.find((row) => row.result !== null && row.result.overall.domain_score !== null);
  expect(target, 'the picked class holds a scored student').toBeDefined();
  if (target === undefined) return;
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    rowOf(page, target.student.document_id).locator('[data-slot="reports-student-pdf"]').click(),
  ]);
  await expect(popup.locator('h1')).toHaveText(target.student.name, { timeout: 30_000 });
  await expect(popup).toHaveTitle(cat(en, 'TeacherPortal.students.print.title').replace('{name}', target.student.name));
  await popup.close();
});

test('Download all opens one print document with a page per scored student', async () => {
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    panel(page).locator('[data-slot="reports-download-all"]').click(),
  ]);
  await expect(popup.locator('.page')).toHaveCount(scoredCount, { timeout: 30_000 });
  await expect(popup).toHaveTitle(fr('download.studentsTitle').replace('{name}', className));
  await popup.close();
});
