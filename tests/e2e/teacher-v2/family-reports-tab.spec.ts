import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { READY, expectNoNewErrors, frame, setAsideErrors } from '../helpers/teacher-class-detail';
import { expectedPhaseText, expectedTiles, fr, icu, teacherApi } from '../helpers/teacher-family-reports';
import { signIn } from '../helpers/teacher-rail';
import { watchErrors } from '../helpers/ui';

// S6 — the Reports tab, REBUILT (Spec 06). Real sign-in, real API, no interception. The
// release workflow is gone: an audience picker (Parents & carers the default) drives the
// per-audience note and the class-summary card (non-parent audiences only, its own
// download a disabled "coming soon"), and the student list carries one row per roster
// student — phase chip or the kit dash, a PDF button for a result, "No result yet" for
// none. The PDFs are the existing print-window exports, proven by their popups; every
// expectation is tallied from the roster the API serves, and nothing is written, so
// nothing needs restoring.
const PROOFS = path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'teacher-v2');

test.use({ viewport: { width: 1440, height: 900 } });

const panelOf = (page: Page) => page.locator('[data-tab-panel="reports"] [data-slot="family-reports"]');

test('S6 — Reports tab: audience picker, gated class card, student rows and the real PDF downloads', async ({ page, playwright }) => {
  test.setTimeout(240_000);
  mkdirSync(PROOFS, { recursive: true });
  const errors = watchErrors(page);
  const live = await teacherApi(playwright);
  const dashboard = await live.dashboard();
  const card = dashboard.classes.find((entry) => entry.student_count > 0) ?? dashboard.classes[0];
  const roster = await live.roster(card.class_document_id);
  const tiles = expectedTiles(roster);

  await signIn(page, 'teacher');
  setAsideErrors(errors, 'sign-in');
  await page.goto(`/dashboard/results/${card.class_document_id}?tab=reports`);
  await expect(frame(page)).toHaveAttribute('data-status', READY, { timeout: 30_000 });
  const panel = panelOf(page);
  await expect(panel).toBeVisible({ timeout: 30_000 });
  await expect(panel.getByRole('heading', { level: 2, name: fr('title'), exact: true })).toBeVisible();

  // The picker: four audiences, Parents & carers pressed by default, its note under it.
  const audiences = ['parents', 'teachers', 'principal', 'admin'];
  const picker = panel.locator('[data-slot="reports-audiences"]');
  await expect(picker.getByRole('button')).toHaveText(audiences.map((key) => fr(`audiences.${key}`)));
  for (const key of audiences) {
    await expect(picker.locator(`[data-audience="${key}"]`)).toHaveAttribute(
      'aria-pressed',
      key === 'parents' ? 'true' : 'false',
    );
  }
  await expect(panel.locator('[data-slot="reports-note"]')).toHaveText(fr('notes.parents'));

  // Parents see no class-summary card, and one row per served roster student: a PDF
  // button for a result, "No result yet" for none.
  await expect(panel).toHaveAttribute('data-audience', 'parents');
  await expect(panel.locator('[data-slot="reports-class-card"]')).toHaveCount(0);
  await expect(panel.locator('[data-slot="reports-students-meta"]')).toHaveText(
    icu(fr('students.meta'), { scored: tiles.scored, total: roster.length, audience: fr('audiences.parents') }),
  );
  const rows = panel.locator('[data-slot="reports-student-row"]');
  await expect(rows).toHaveCount(roster.length);
  for (const entry of roster) {
    const row = panel.locator(`[data-slot="reports-student-row"][data-student-id="${entry.student.document_id}"]`);
    await expect(row).toContainText(entry.student.name);
    await expect(row).toHaveAttribute('data-has-result', entry.result === null ? 'false' : 'true');
    // The phase cell: the server's own ACARA phase word, or the kit dash.
    await expect(row.locator('[data-slot="reports-phase"]')).toHaveText(expectedPhaseText(entry));
    await expect(row.locator('[data-slot="status-pill"]')).toHaveCount(0);
    if (entry.result === null || entry.result.overall.domain_score === null) {
      await expect(row.locator('[data-slot="reports-no-result"]')).toHaveText(fr('students.noResultYet'));
      await expect(row.locator('[data-slot="reports-student-pdf"]')).toHaveCount(0);
    } else {
      await expect(row.locator('[data-slot="reports-student-pdf"]')).toBeEnabled();
      await expect(row.locator('[data-slot="reports-student-pdf"]')).toHaveAttribute(
        'aria-label',
        icu(fr('students.pdfFor'), { name: entry.student.name }),
      );
      await expect(row.locator('[data-slot="reports-no-result"]')).toHaveCount(0);
    }
  }
  const downloadAll = panel.locator('[data-slot="reports-download-all"]');
  if (tiles.scored === 0) await expect(downloadAll, 'nothing scored, nothing to batch-download').toBeDisabled();
  else await expect(downloadAll).toBeEnabled();
  await page.screenshot({ path: path.join(PROOFS, 'family-reports-tab.png'), animations: 'disabled' });

  // A non-parent audience swaps the note and adds the class-summary card: it names the
  // class, the served scored/total tally and the audience — and every download on it is
  // a disabled "coming soon" for now.
  await panel.locator('[data-audience="principal"]').click();
  await expect(panel).toHaveAttribute('data-audience', 'principal');
  await expect(panel.locator('[data-slot="reports-note"]')).toHaveText(fr('notes.principal'));
  const classCard = panel.locator('[data-slot="reports-class-card"]');
  await expect(classCard).toHaveCount(1);
  await expect(classCard.locator('[data-slot="reports-class-meta"]')).toHaveText(
    icu(fr('classCard.meta'), {
      className: card.name,
      scored: tiles.scored,
      total: roster.length,
      audience: fr('audiences.principal'),
    }),
  );
  await expect(classCard.locator('[data-slot="reports-class-download"]')).toBeDisabled();
  await expect(classCard).toContainText(fr('comingSoon'));
  await expect(downloadAll).toBeDisabled();
  if (tiles.scored > 0) await expect(rows.locator('[data-slot="reports-student-pdf"]').first()).toBeDisabled();
  await page.screenshot({ path: path.join(PROOFS, 'family-reports-principal.png'), animations: 'disabled' });
  await panel.locator('[data-audience="parents"]').click();
  await expect(panel.locator('[data-slot="reports-class-card"]')).toHaveCount(0);
  await expect(panel.locator('[data-slot="reports-note"]')).toHaveText(fr('notes.parents'));

  // The downloads are the existing print-window exports: one popup per student PDF, and
  // Download all printing one page per scored student. Nothing here writes a result.
  const target = roster.find((entry) => entry.result !== null && entry.result.overall.domain_score !== null);
  test.skip(target === undefined || target.result === null, 'the live roster holds no scored result');
  if (target === undefined || target.result === null) return;

  const [studentPopup] = await Promise.all([
    page.waitForEvent('popup'),
    panel
      .locator(`[data-slot="reports-student-row"][data-student-id="${target.student.document_id}"]`)
      .locator('[data-slot="reports-student-pdf"]')
      .click(),
  ]);
  await expect(studentPopup.locator('h1')).toHaveText(target.student.name, { timeout: 30_000 });
  await studentPopup.close();

  const [allPopup] = await Promise.all([page.waitForEvent('popup'), downloadAll.click()]);
  await expect(allPopup.locator('.page')).toHaveCount(tiles.scored, { timeout: 30_000 });
  await expect(allPopup).toHaveTitle(fr('download.studentsTitle').replace('{name}', card.name));
  await allPopup.close();
  await page.screenshot({ path: path.join(PROOFS, 'family-reports-downloads.png'), animations: 'disabled' });
  expectNoNewErrors(errors, 'family reports: picker, class card, student rows, PDF downloads');
});
