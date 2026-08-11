import { expect, type Locator } from '@playwright/test';

import { acaraMovementCards, progressView } from '@/modules/teacher/lib/class-progress';
import type { ProgressView } from '@/modules/teacher/types/class-progress.types';
import type { ClassProgressResponse } from '@/modules/teacher/types/teacher-progress.types';

import { icu } from './i18n';
import { num, plural, progressCopy } from './teacher-insights-view';

// Task 056 · the Progress-tab assertions for brief flows 23 (mastery shift + ACARA
// phase movement) and 24 (the both-tests-only cohort rule). Values come from the
// live C-TR-4 body through the SHIPPED `progressView`, so the tab and the spec
// cannot disagree about what the server said.

/** A `ProgressView` that is populated, or a loud failure — flows 23/24 need one. */
export function readyView(body: ClassProgressResponse): Extract<ProgressView, { kind: 'ready' }> {
  const view = progressView(body);
  if (view.kind !== 'ready') {
    throw new Error(`[e2e] C-TR-4 is not populated (kind=${view.kind}) — flows 23/24 need Test B`);
  }
  return view;
}

const directionText = (value: number, digits = 0): string => {
  const magnitude = new Intl.NumberFormat('en', { maximumFractionDigits: digits }).format(
    Math.abs(value),
  );
  if (value > 0) return icu(progressCopy('directionUp'), { change: magnitude });
  if (value < 0) return icu(progressCopy('directionDown'), { change: magnitude });
  return progressCopy('directionFlat');
};

const masteredText = (mastered: number, compared: number): string =>
  icu(progressCopy('masteredCount'), { mastered: num(mastered), compared: num(compared) });

/**
 * Brief flow 23a — "Subskill mastery shift": one row per C-TR-4 `subskill_shift`
 * entry with the Test A count, the Test B count and the server's own `change`,
 * each denominated by the COMPARED cohort (never the class roster).
 *
 * The two counts are bound to their COLUMNS, cell by cell (`td` 0 = Test A, 1 =
 * Test B), against a header order asserted from the catalog — the A→B direction is
 * the whole semantic content of flow 23, so a row-level substring check that would
 * survive a transposition of the two cells is not an assertion of this flow.
 */
export async function assertMasteryShift(
  panel: Locator,
  view: Extract<ProgressView, { kind: 'ready' }>,
): Promise<void> {
  const table = panel.locator('[data-slot="progress-shift-table"]');
  await expect(table).toBeVisible();
  await expect(table.locator('thead th'), 'shift table column order').toHaveText([
    progressCopy('subskill'),
    progressCopy('testA'),
    progressCopy('testB'),
    progressCopy('change'),
  ]);
  await expect(panel.locator('[data-slot="progress-shift"]').getByRole('heading', { level: 2 })).toHaveText(
    progressCopy('shiftTitle'),
  );
  await expect(panel.locator('[data-slot="progress-shift"]')).toContainText(
    plural(progressCopy('shiftCaption'), view.compared),
  );

  const rows = panel.locator('[data-slot="progress-shift-row"]');
  await expect(rows).toHaveCount(view.shift.length);
  for (const [index, entry] of view.shift.entries()) {
    const row = rows.nth(index);
    await expect(row).toHaveAttribute('data-attribute', entry.attribute);
    await expect(row.locator('th[scope="row"]')).toHaveText(entry.name);

    const cells = row.locator('td');
    await expect(cells, `${entry.attribute} cell count`).toHaveCount(3);
    await expect(cells.nth(0), `${entry.attribute} Test A column`).toHaveText(
      masteredText(entry.a_mastered, view.compared),
    );
    await expect(cells.nth(1), `${entry.attribute} Test B column`).toHaveText(
      masteredText(entry.b_mastered, view.compared),
    );
    await expect(cells.nth(2), `${entry.attribute} change column`).toHaveText(
      directionText(entry.change),
    );
  }
}

/**
 * Brief flow 23b — "ACARA phase movement": the three cards, their counts, the
 * server's `from → to` breakdown lines and the same-phase "improved within phase"
 * second fact. Phase NAMES are echoed from the wire; no ladder is written here.
 */
export async function assertAcaraMovement(
  panel: Locator,
  view: Extract<ProgressView, { kind: 'ready' }>,
): Promise<void> {
  const section = panel.locator('[data-slot="progress-acara"]');
  await expect(section.getByRole('heading', { level: 2 })).toHaveText(progressCopy('acaraTitle'));

  const cards = acaraMovementCards(view.movement);
  await expect(section.locator('[data-slot="progress-acara-card"]')).toHaveCount(cards.length);
  for (const card of cards) {
    const tile = section.locator(`[data-slot="progress-acara-card"][data-movement="${card.key}"]`);
    // The COUNT element, not a digit anywhere in the tile: `toContainText('3')` also
    // passes on a tile reading 13, and these tiles carry other numbers.
    await expect(tile.locator(':scope > span').first(), `${card.key} count`).toHaveText(
      num(card.count),
    );
    await expect(tile).toContainText(
      progressCopy(card.key === 'up' ? 'acaraUp' : card.key === 'down' ? 'acaraDown' : 'acaraSame'),
    );
    const steps = tile.locator('[data-slot="progress-acara-step"]');
    await expect(steps).toHaveCount(card.detail.length);
    for (const [index, step] of card.detail.entries()) {
      await expect(steps.nth(index)).toHaveText(
        plural(progressCopy('acaraDetail'), step.count, { from: step.from, to: step.to }),
      );
    }
    if (card.improvedWithinPhase !== null) {
      await expect(tile).toContainText(
        icu(progressCopy('acaraSameImproved'), { count: num(card.improvedWithinPhase) }),
      );
    }
  }
}

/** The `most_improved` / `needs_attention` rows, by student documentId and score pair. */
export async function assertWatchLists(
  panel: Locator,
  view: Extract<ProgressView, { kind: 'ready' }>,
): Promise<void> {
  for (const [variant, movers] of [
    ['most_improved', view.mostImproved],
    ['needs_attention', view.needsAttention],
  ] as const) {
    const column = panel.locator(`[data-slot="progress-watch-list"][data-variant="${variant}"]`);
    await expect(column.locator('[data-slot="progress-mover"]')).toHaveCount(movers.length);
    for (const mover of movers) {
      const row = column.locator(`[data-student-id="${mover.student_document_id}"]`);
      await expect(row).toContainText(mover.display_name);
      await expect(row).toContainText(
        icu(progressCopy('moverScores'), { from: num(mover.score_a), to: num(mover.score_b) }),
      );
      await expect(row).toContainText(directionText(mover.delta));
    }
  }
}

/**
 * Brief flow 24 — a student who finished ONLY Test A appears NOWHERE on the tab:
 * not as a watch-list row (by documentId), not as a name anywhere in the panel
 * text, and not inside any aggregate (asserted numerically by the caller).
 */
export async function assertStudentAbsent(
  panel: Locator,
  studentDocumentId: string,
  displayName: string,
): Promise<void> {
  await expect(panel.locator(`[data-student-id="${studentDocumentId}"]`)).toHaveCount(0);
  await expect(panel).not.toContainText(displayName);
}
