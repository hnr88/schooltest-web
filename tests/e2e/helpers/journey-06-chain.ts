import path from 'node:path';

import { expect, type Locator, type Page } from '@playwright/test';

import { classRosterResponseSchema } from '@/modules/results/schemas/roster.schema';
import type { RosterRow } from '@/modules/results/types/roster.types';
import { teacherDashboardResponseSchema } from '@/modules/teacher/schemas/teacher.schema';
import type { TeacherDashboardResponse } from '@/modules/teacher/types/teacher.types';
import { resultViewSchema, type ResultView } from '@schooltest/scoring-contracts';

import { JOURNEY_06_SHOTS } from './journey-06-live';
import { cat } from './i18n';
import { en } from './teacher-rail';

/**
 * Journey 06, part 2 — the TEACHER RESULTS CHAIN oracle.
 *
 * Every expected string here is built from a RAW API body the page itself
 * received (the response is captured off the wire, never re-derived through the
 * portal's own view-model library) plus the en catalog. So a portal that shows a
 * value the API did not send — a score cut standing in for a missing ACARA phase,
 * a history point the result does not carry — fails here.
 */

/** Screenshots go OUTSIDE the tracked tree: `J06_SHOTS` when set, the journey's shots dir otherwise. */
export const CHAIN_SHOTS = process.env.J06_SHOTS ?? path.join(JOURNEY_06_SHOTS, 'chain');

const NO_VALUE = cat(en, 'TeacherPortal.kit.noValue');
const SERVER_PHASE: Readonly<Record<string, string>> = {
  beginning: 'beginning',
  emerging: 'emerging',
  developing: 'developing',
  developing_to_consolidating: 'developing',
  consolidating: 'consolidating',
};

/** The body of the first successful GET whose URL contains `fragment`, straight off the wire. */
export function wireJson(page: Page, fragment: string): Promise<unknown> {
  let body: unknown = null;
  return page
    .waitForResponse(
      async (response) => {
        if (!response.url().includes(fragment) || response.request().method() !== 'GET' || !response.ok()) return false;
        body = await response.json().catch(() => null);
        return body !== null;
      },
      { timeout: 90_000 },
    )
    .then(() => body);
}

export const parseDashboard = (body: unknown): TeacherDashboardResponse => teacherDashboardResponseSchema.parse(body);
export const parseRoster = (body: unknown): RosterRow[] => classRosterResponseSchema.parse(body);
export const parseResult = (body: unknown): ResultView => resultViewSchema.parse(body);

/** Classes list "Reading" cell: the API class average rounded, or the kit dash. */
export function classAverageText(average: number | null): string {
  return average === null ? NO_VALUE : `${Math.round(average)}%`;
}

/** A percentage the portal prints for a domain score, or the kit dash for none. */
export function scoreText(score: number | null): string {
  return score === null ? NO_VALUE : `${score}%`;
}

/** The ACARA kit key for a served phase code; null when the server placed nobody. */
export function phaseKey(code: string | null): string | null {
  return code === null ? null : (SERVER_PHASE[code.trim().toLowerCase()] ?? null);
}

/** Students tab phase cell: "Not sat" with no result, the dash for an unplaced result, else the server's phase. */
export function studentsPhaseText(row: RosterRow): string {
  if (row.result === null) return cat(en, 'TeacherPortal.kit.phase.notSat');
  const key = phaseKey(row.result.acara_phase);
  return key === null ? NO_VALUE : cat(en, `TeacherPortal.kit.phase.${key}`);
}

/** Drill-down header phase chip word (the v2 ACARA stat card), or null when the
 * server placed nobody — the header draws the kit dash with no chip at all. */
export function drillDownPhaseText(view: ResultView): string | null {
  const key = phaseKey(view.acara_phase);
  if (key === null) return null;
  return cat(en, `TeacherPortal.kit.phase.${key}`);
}

/** The trend chart's points: the scored `history[].overall` values, oldest first. */
export function chartValues(view: ResultView): string[] {
  return (view.history ?? []).flatMap((point) => (point.overall === null ? [] : [String(point.overall)]));
}

/** One verification line: result × surface × shown × API value. */
export interface ChainCheck {
  resultId: string;
  student: string;
  surface: string;
  shown: string;
  api: string;
}

/** Waits for `locator` to show `api` (auto-retrying), then records what it actually shows. */
export async function checkText(
  checks: ChainCheck[],
  locator: Locator,
  meta: Omit<ChainCheck, 'shown' | 'api'>,
  api: string,
): Promise<void> {
  await expect(locator, `${meta.surface} for ${meta.student} (${meta.resultId})`).toHaveText(api, { timeout: 30_000 });
  checks.push({ ...meta, api, shown: ((await locator.textContent()) ?? '').trim() });
}
