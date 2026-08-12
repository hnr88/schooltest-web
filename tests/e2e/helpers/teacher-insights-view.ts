import { expect, type Locator, type Page } from '@playwright/test';

import type { ClassInsightsResponse } from '@/modules/teacher/types/teacher-result.types';

import { cat, icu } from './i18n';
import { en } from './teacher-rail';
import { openClassResults } from './teacher-results-live';

// Task 056 · the DOM half of the harness: how the Teaching insights / Progress /
// Exit predictions tabs are opened, and the ICU resolution the catalog copy needs.
// Every expected string comes from src/i18n/messages/en.json — no English literal
// is written here, so a copy change fails the spec instead of silently passing.

export const num = (value: number): string => new Intl.NumberFormat('en').format(value);

export const insightsCopy = (key: string): string => cat(en, `Teacher.results.insights.${key}`);
export const progressCopy = (key: string): string => cat(en, `Teacher.results.progress.${key}`);

/**
 * Resolves the `{count, plural, …}` argument of a catalog message exactly as
 * next-intl would — in place, so it works whether the plural IS the whole message
 * (`bothTests`) or only part of one (`masteryCaption`, `acaraDetail`). Remaining
 * `{placeholders}` are filled from `params`.
 */
export function plural(template: string, count: number, params: Record<string, string> = {}): string {
  const start = template.indexOf('{count, plural,');
  if (start === -1) throw new Error(`[e2e] no {count, plural} argument in: ${template}`);
  let depth = 0;
  let end = start;
  for (let index = start; index < template.length; index += 1) {
    if (template[index] === '{') depth += 1;
    if (template[index] === '}') depth -= 1;
    if (depth === 0) {
      end = index;
      break;
    }
  }
  const branches = new Map<string, string>();
  const body = template.slice(start + '{count, plural,'.length, end);
  for (const match of body.matchAll(/(=?\w+)\s*\{([^{}]*)\}/g)) branches.set(match[1], match[2]);
  const branch =
    branches.get(`=${count}`) ??
    branches.get(new Intl.PluralRules('en').select(count)) ??
    branches.get('other') ??
    '';
  const resolved =
    template.slice(0, start) + branch.replace(/#/g, num(count)) + template.slice(end + 1);
  return icu(resolved, params);
}

/** Opens ONE class's Results detail and switches to a tab by its catalog label. */
async function openTab(page: Page, classDocumentId: string, tabKey: string): Promise<void> {
  if (!page.url().includes(`/dashboard/results/${classDocumentId}`)) {
    await openClassResults(page, classDocumentId);
  }
  await page.getByRole('tab', { name: cat(en, `Teacher.results.tabs.${tabKey}`) }).click();
}

/** The Teaching insights panel, once C-TR-3 has answered READY. */
export async function openInsights(page: Page, classDocumentId: string): Promise<Locator> {
  await openTab(page, classDocumentId, 'insights');
  const panel = page.locator('[data-slot="teaching-insights"]');
  await expect(panel).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
  return panel;
}

/** The Progress panel, once C-TR-4 has answered. `status` is asserted by the caller. */
export async function openProgress(page: Page, classDocumentId: string): Promise<Locator> {
  await openTab(page, classDocumentId, 'progress');
  const panel = page.locator('[data-slot="class-progress"]');
  await expect(panel).not.toHaveAttribute('data-status', 'loading', { timeout: 20_000 });
  return panel;
}

/** The Exit predictions panel (brief flow 26 — inert by design). */
export async function openExitPredictions(page: Page, classDocumentId: string): Promise<Locator> {
  await openTab(page, classDocumentId, 'exit');
  const panel = page.locator('[data-slot="exit-predictions-panel"]');
  await expect(panel).toBeVisible();
  return panel;
}

export interface BarGeometry {
  ariaNow: number;
  /** Rendered indicator width as a fraction of its track, 0..1. */
  filled: number;
}

/** Measures one mastery bar: its ARIA value AND its real rendered width. */
export async function barGeometry(row: Locator): Promise<BarGeometry> {
  const bar = row.locator('[role="progressbar"]');
  const ariaNow = Number(await bar.getAttribute('aria-valuenow'));
  const track = await row.locator('[data-slot="progress-track"]').boundingBox();
  const indicator = await row.locator('[data-slot="progress-indicator"]').boundingBox();
  if (!track || !indicator || track.width === 0) {
    throw new Error('[e2e] the mastery bar rendered no measurable track');
  }
  return { ariaNow, filled: indicator.width / track.width };
}

/**
 * Brief flow 19 — every bar of C-TR-3's `mastery`, printed as the server sent it:
 * the crosswalk NAME, the `mastered / assessed` count text, and a bar whose ARIA
 * value is `round(ratio × 100)`. The orientation itself is asserted by the caller
 * on the two extreme subskills.
 */
export async function assertMasteryRows(
  panel: Locator,
  insights: ClassInsightsResponse,
): Promise<void> {
  const section = panel.locator('[data-slot="subskill-mastery"]');
  await expect(section.getByRole('heading', { level: 2 })).toHaveText(
    insightsCopy('masteryTitle'),
  );
  await expect(section).toContainText(
    plural(insightsCopy('masteryCaption'), insights.completed_count),
  );

  const rows = section.locator('[data-slot="subskill-mastery-row"]');
  await expect(rows).toHaveCount(insights.mastery.length);

  for (const [index, entry] of insights.mastery.entries()) {
    const row = rows.nth(index);
    // Server ORDER, not a re-sort: row n is mastery[n].
    await expect(row).toHaveAttribute('data-attribute', entry.attribute);
    await expect(row).toContainText(entry.name);
    await expect(row).toContainText(
      entry.assessed_count === 0
        ? insightsCopy('notAssessed')
        : icu(insightsCopy('masteredCount'), {
            mastered: num(entry.mastered_count),
            assessed: num(entry.assessed_count),
          }),
    );
    if (entry.assessed_count === 0) continue;
    const geometry = await barGeometry(row);
    expect(geometry.ariaNow, `${entry.attribute} bar value`).toBe(
      Math.round(entry.ratio * 100),
    );
    expect(geometry.filled, `${entry.attribute} bar width`).toBeCloseTo(entry.ratio, 2);
  }
}

/**
 * Brief flow 20 — one card per C-TR-3 group, carrying the crosswalk `label`, the
 * descriptor `hint`, the member count and the member NAMES the server assigned.
 */
export async function assertSuggestedGroups(
  panel: Locator,
  insights: ClassInsightsResponse,
): Promise<void> {
  const section = panel.locator('[data-slot="suggested-groups"]');
  await expect(section.getByRole('heading', { level: 2 })).toHaveText(insightsCopy('groupsTitle'));
  await expect(section).toContainText(insightsCopy('groupsCaption'));

  const cards = section.locator('[data-slot="suggested-group"]');
  await expect(cards).toHaveCount(insights.groups.length);
  for (const [index, group] of insights.groups.entries()) {
    const card = cards.nth(index);
    await expect(card).toHaveAttribute('data-group-key', group.key);
    await expect(card.getByRole('heading', { level: 3 })).toHaveText(group.label);
    await expect(card).toContainText(
      plural(insightsCopy('groupStudents'), group.students.length),
    );
    await expect(card).toContainText(group.hint);
    const members = card.locator('ul li');
    await expect(members).toHaveCount(group.students.length);
    for (const [memberIndex, student] of group.students.entries()) {
      await expect(members.nth(memberIndex)).toHaveText(student.display_name);
    }
  }
}
