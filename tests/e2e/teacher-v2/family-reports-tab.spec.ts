import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import type { ResultView } from '@schooltest/scoring-contracts';

import { READY, expectNoNewErrors, frame, setAsideErrors } from '../helpers/teacher-class-detail';
import {
  expectedTiles,
  fr,
  icu,
  recallReasonOf,
  restoreResultRow,
  snapshotResultRow,
  teacherApi,
  vm,
  type ResultRowSnapshot,
  type TeacherApi,
} from '../helpers/teacher-family-reports';
import { signIn } from '../helpers/teacher-rail';
import { watchErrors } from '../helpers/ui';

// S6 — the Family reports tab (Teacher Portal v2.dc.html:1293–1349, 1845–1912; shots
// class-detail-sitting--reports.png, overlay-carer-preview.png at 1440×900). Real sign-in,
// real API, no interception. Tiles, rows and the carer preview are checked against the
// roster the API serves; one held result is released, recalled and released again through
// the UI, each state confirmed on the API, and afterAll writes the row's prior values back.
const PROOFS = path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'teacher-v2');
const REASON = 'E2E family-reports check: recalled and restored by the spec';

// P1 parity row 6 — a HELD result with no `overall.domain_score` never claims "Scored and
// ready"; it says what the result's own `status` reports, neutral when that says no more.
const HELD_UNSCORED_WHY: Record<ResultView['status'], string> = {
  scoring: 'heldScoring',
  partial_pending: 'heldScoring',
  manual_scoring: 'manual',
  scoring_failed: 'heldScoringFailed',
  complete: 'heldNoScore',
};

test.use({ viewport: { width: 1440, height: 900 } });

let api: TeacherApi | null = null;
let snapshot: ResultRowSnapshot | null = null;

test.afterAll(async () => {
  if (snapshot === null || api === null) return;
  const before = snapshot.columns[0] === 'NULL' ? 'held' : undefined;
  const removed = restoreResultRow(snapshot);
  test.info().annotations.push({ type: 'restored', description: `${snapshot.resultId}; notifications removed: ${removed.join(',') || 'none'}` });
  if (before !== undefined) expect((await api.result(snapshot.resultId)).release_state).toBe(before);
});

const panelOf = (page: Page) => page.locator('[data-tab-panel="reports"] [data-slot="family-reports"]');

test('S6 — Family reports: live tiles, carer preview, release and recall one held report', async ({ page, playwright }) => {
  test.setTimeout(240_000);
  mkdirSync(PROOFS, { recursive: true });
  const errors = watchErrors(page);
  const live = await teacherApi(playwright);
  api = live;
  const dashboard = await live.dashboard();
  const card = dashboard.classes.find((entry) => entry.student_count > 0) ?? dashboard.classes[0];
  const roster = await live.roster(card.class_document_id);

  await signIn(page, 'teacher');
  setAsideErrors(errors, 'sign-in');
  await page.goto(`/dashboard/results/${card.class_document_id}?tab=reports`);
  await expect(frame(page)).toHaveAttribute('data-status', READY, { timeout: 30_000 });
  const panel = panelOf(page);
  await expect(panel).toBeVisible({ timeout: 30_000 });
  await expect(panel.getByRole('heading', { level: 2, name: fr('title'), exact: true })).toBeVisible();
  await expect(panel).toContainText(icu(fr('subtitle'), { className: card.name }));

  const tiles = expectedTiles(roster);
  for (const [key, value] of Object.entries(tiles)) {
    const tile = panel.locator('[data-slot="kpi-card"]', { hasText: fr(`tiles.${key}`) });
    await expect(tile.locator('div').first(), `tile ${key}`).toHaveText(String(value));
  }
  await expect(panel.locator('[data-action="release-held"]')).toHaveText(icu(fr('releaseHeld'), { count: tiles.held }));
  const rows = panel.locator('[data-slot="family-report-row"]');
  await expect(rows).toHaveCount(roster.length);
  for (const entry of roster) {
    const row = panel.locator(`[data-slot="family-report-row"][data-student-id="${entry.student.document_id}"]`);
    const score = entry.result?.overall.domain_score ?? null;
    await expect(row).toHaveAttribute('data-status', entry.release_state);
    await expect(row).toContainText(entry.student.name);
    await expect(row).toContainText(vm(`release.label.${entry.release_state}`));
    await expect(row.locator('[data-slot="family-report-score"]')).toHaveText(
      score !== null ? `${score}%` : entry.result === null ? fr('noResult') : '—',
    );
    if (entry.release_state === 'held' && entry.result !== null) {
      await expect(
        row.getByText(vm('release.why.held'), { exact: true }),
        `"Scored and ready" only with a score: ${entry.student.name}`,
      ).toHaveCount(score === null ? 0 : 1);
      if (score === null) await expect(row).toContainText(vm(`release.why.${HELD_UNSCORED_WHY[entry.result.status]}`));
    }
  }
  await panel.getByRole('button', { name: fr('filters.held'), exact: true }).click();
  await expect(rows).toHaveCount(tiles.held);
  await panel.getByRole('button', { name: fr('filters.all'), exact: true }).click();
  await expect(rows).toHaveCount(roster.length);
  await page.screenshot({ path: path.join(PROOFS, 'family-reports-tab.png'), animations: 'disabled' });

  const target = roster.find((entry) => entry.release_state === 'held' && entry.result?.overall.domain_score != null);
  test.skip(target === undefined || target.result === null, 'the live roster holds no held, scored result');
  if (target === undefined || target.result === null) return;
  const resultId = target.result.document_id;
  const name = target.student.name;
  const row = panel.locator(`[data-slot="family-report-row"][data-result-id="${resultId}"]`);

  await row.getByRole('button', { name: fr('actions.preview'), exact: true }).click();
  const preview = page.locator('[data-slot="carer-report-preview"]');
  await expect(preview.getByRole('heading', { name, exact: true })).toBeVisible();
  await expect(preview.locator('[data-slot="carer-report-score"]')).toHaveText(`${target.result.overall.domain_score} / 100`);
  await expect(preview).toContainText(vm('release.label.held'));
  // P1 parity row 8 — the meta line writes the day before the month ("sat 31 August"). The
  // date is the sitting the API reports, reassembled here day-first from the same ISO day.
  const satAt = target.result.history?.at(-1)?.sat_at;
  if (satAt !== undefined) {
    const day = Number(satAt.split('-')[2]);
    const month = new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(new Date(satAt));
    await expect(preview.locator('p', { hasText: card.name })).toContainText(`${day} ${month}`);
  }
  await expect(preview.getByRole('link', { name: fr('preview.viewAnalysis') })).toHaveAttribute(
    'href',
    new RegExp(`/dashboard/results/${card.class_document_id}/students/${target.student.document_id}$`),
  );
  await page.screenshot({ path: path.join(PROOFS, 'carer-preview.png'), animations: 'disabled' });
  await preview.getByRole('button', { name: fr('preview.close'), exact: true }).click();
  await expect(preview).toBeHidden();

  snapshot = snapshotResultRow(resultId);
  test.skip(snapshot === null, 'the database is out of reach, so a release could not be undone');

  await row.getByRole('button', { name: fr('actions.release'), exact: true }).click();
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toContainText(icu(fr('release.title'), { name }));
  await confirm.getByRole('button', { name: fr('release.cta'), exact: true }).click();
  await expect(row).toHaveAttribute('data-status', 'released', { timeout: 30_000 });
  await expect.poll(async () => (await live.result(resultId)).release_state).toBe('released');
  await expect(panel.locator('[data-slot="kpi-card"]', { hasText: fr('tiles.released') }).locator('div').first()).toHaveText(
    String(tiles.released + 1),
  );

  await row.getByRole('button', { name: fr('actions.recall'), exact: true }).click();
  const recall = page.locator('[data-slot="recall-report-dialog"]');
  await expect(recall).toContainText(icu(fr('recall.title'), { name }));
  await recall.getByRole('button', { name: fr('recall.cta'), exact: true }).click();
  await expect(recall.getByRole('alert')).toHaveText(fr('recall.reasonRequired'));
  await recall.getByLabel(fr('recall.reasonLabel')).fill(REASON);
  await recall.getByRole('button', { name: fr('recall.cta'), exact: true }).click();
  await expect(row).toHaveAttribute('data-status', 'recalled', { timeout: 30_000 });
  await expect.poll(async () => (await live.result(resultId)).release_state).toBe('recalled');
  expect(recallReasonOf(resultId)).toBe(REASON);

  await row.getByRole('button', { name: fr('actions.preview'), exact: true }).click();
  await expect(preview).toContainText(vm('release.label.recalled'));
  await preview.getByRole('button', { name: fr('preview.release'), exact: true }).click();
  await expect(confirm).toContainText(fr('release.bodyRecalled'));
  await confirm.getByRole('button', { name: fr('release.cta'), exact: true }).click();
  await expect(row).toHaveAttribute('data-status', 'released', { timeout: 30_000 });
  await expect.poll(async () => (await live.result(resultId)).release_state).toBe('released');
  expectNoNewErrors(errors, 'family reports: load, preview, release, recall, re-release');
});
