import {
  expect,
  type APIRequestContext,
  type Locator,
  type Page,
  type PlaywrightWorkerArgs,
} from '@playwright/test';

import { studentDrillDownResponseSchema } from '@/modules/teacher/schemas/teacher-result.schema';
import type { StudentDrillDownResponse } from '@/modules/teacher/types/teacher-result.types';

import { runSql } from './auth-db';
import { cat } from './i18n';
import { en } from './teacher-rail';
import { API_BASE, bearer } from './teacher-results-live';

// Task 054 harness for flows 15 + 16 (the drill-down tiles and their three colour
// bands). Everything a spec compares the DOM against is read LIVE — C-TR-2 through
// the shipped Zod mirror, the subskill display names off the ACTIVE crosswalk row
// in Postgres, the mastery cuts off the ACTIVE Config row in Postgres. No literal
// 80, no literal 50 and no codebook copy of "Word Decoding" lives in this lane.

export const drillLabel = (key: string): string => cat(en, `Teacher.results.drillDown.${key}`);

/** C-TR-2 for ONE student, parsed through the module's own contract mirror. */
export async function readDrillDownLive(
  playwright: PlaywrightWorkerArgs['playwright'],
  classDocumentId: string,
  studentDocumentId: string,
  teacherEmail?: string,
): Promise<StudentDrillDownResponse> {
  const request: APIRequestContext = await playwright.request.newContext();
  try {
    const jwt = await bearer(request, teacherEmail);
    const response = await request.get(
      `${API_BASE}/api/teacher/classes/${classDocumentId}/students/${studentDocumentId}`,
      { headers: { Authorization: `Bearer ${jwt}` } },
    );
    if (response.status() !== 200) {
      throw new Error(`[e2e] C-TR-2 answered ${response.status()} ${await response.text()}`);
    }
    return studentDrillDownResponseSchema.parse((await response.json()) as unknown);
  } finally {
    await request.dispose();
  }
}

/** Waits for the drill-down's READY frame, so nothing is asserted on a skeleton. */
export async function expectDrillDownReady(page: Page, studentDocumentId?: string): Promise<void> {
  const surface = page.locator('[data-surface="teacher-student-drill-down"]');
  await expect(surface).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
  if (studentDocumentId)
    await expect(surface).toHaveAttribute('data-student-id', studentDocumentId);
}

/** Opens one student drill-down by deep link and waits for that READY frame. */
export async function openDrillDown(
  page: Page,
  classDocumentId: string,
  studentDocumentId: string,
): Promise<void> {
  await page.goto(`/dashboard/results/${classDocumentId}/students/${studentDocumentId}`);
  await expectDrillDownReady(page, studentDocumentId);
}

export const tiles = (page: Page): Locator => page.locator('[data-slot="subskill-tile"]');
export const tile = (page: Page, attribute: string): Locator =>
  page.locator(`[data-slot="subskill-tile"][data-attribute="${attribute}"]`);

/** The ACTIVE reading crosswalk's `attribute_descriptors` names (CT-9), from Postgres. */
export function activeCrosswalkNames(): Record<string, string> {
  const raw = runSql(
    `select coalesce(jsonb_object_agg(key, value->>'name')::text, '{}')
       from crosswalks c, jsonb_each(c.attribute_descriptors)
      where c.skill = 'reading' and c.active = true and c.published_at is not null`,
  );
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('[e2e] the active reading crosswalk has no attribute_descriptors');
  }
  return parsed as Record<string, string>;
}

/** `Config.teacher_mastery_bands` on the ACTIVE row — the ONE home of the cuts. */
export function activeConfigBands(): { mastered_cut: number; approaching_cut: number } {
  const raw = runSql(
    `select teacher_mastery_bands::text from configs
      where active = true and published_at is not null order by version desc limit 1`,
  );
  const parsed: unknown = JSON.parse(raw);
  const bands = parsed as { mastered_cut?: unknown; approaching_cut?: unknown };
  if (typeof bands.mastered_cut !== 'number' || typeof bands.approaching_cut !== 'number') {
    throw new Error(`[e2e] active Config.teacher_mastery_bands is not a cut pair: ${raw}`);
  }
  return { mastered_cut: bands.mastered_cut, approaching_cut: bands.approaching_cut };
}

/**
 * `round(prob * 100)` per reading attribute on the MOST RECENT complete result of
 * one student, straight out of `results.attributes` in Postgres — the row C-TR-2's
 * newest test is assembled from. The DINA posterior is the only number this
 * platform persists, so this is the drill-down's persistence proof.
 */
export function dbLatestLikelihoods(studentDocumentId: string): Record<string, number> {
  const raw = runSql(
    `with latest as (
       select r.attributes as attrs
         from students s
         join sessions_student_lnk sl on sl.student_id = s.id
         join sessions se on se.id = sl.session_id
         join results_session_lnk rsl on rsl.session_id = se.id
         join results r on r.id = rsl.result_id
        where s.document_id = '${studentDocumentId}'
          and r.status = 'complete' and r.published_at is not null
        order by se.ended_at desc limit 1
     )
     select coalesce((select jsonb_object_agg(k, round((v->>'prob')::numeric * 100)::int)
                        from latest, jsonb_each(latest.attrs) as e(k, v)
                       where k ~ '^R[1-7]$' and jsonb_typeof(v) = 'object' and v ? 'prob')::text,
                     '{}')`,
  );
  return JSON.parse(raw) as Record<string, number>;
}

/** `results.acara_phase` on that same most-recent complete result — the persisted phase. */
export function dbLatestPhase(studentDocumentId: string): string {
  return runSql(
    `select coalesce(r.acara_phase, '')
       from students s
       join sessions_student_lnk sl on sl.student_id = s.id
       join sessions se on se.id = sl.session_id
       join results_session_lnk rsl on rsl.session_id = se.id
       join results r on r.id = rsl.result_id
      where s.document_id = '${studentDocumentId}'
        and r.status = 'complete' and r.published_at is not null
      order by se.ended_at desc limit 1`,
  );
}

/**
 * Every tile of the newest test against C-TR-2's own `subskills`: the crosswalk
 * display NAME, the server's `likelihood` printed through the real catalog string,
 * the SERVER's ordering — and the same percentage recomputed from the DINA
 * posterior the `results` row persists, so the number on screen is provably the
 * stored measurement rather than anything assembled in the browser.
 */
export async function expectSubskillTiles(
  page: Page,
  drill: StudentDrillDownResponse,
  studentDocumentId: string,
): Promise<void> {
  const latest = drill.tests[0];
  const names = activeCrosswalkNames();
  const stored = dbLatestLikelihoods(studentDocumentId);

  await expect(tiles(page)).toHaveCount(latest.subskills.length);
  for (const subskill of latest.subskills) {
    const node = tile(page, subskill.attribute);
    expect(names[subskill.attribute], `${subskill.attribute} name is not the crosswalk's`).toBe(
      subskill.name,
    );
    await expect(node).toContainText(subskill.name);

    expect(subskill.likelihood, `${subskill.attribute} carries no likelihood`).not.toBeNull();
    await expect(node.locator('[data-slot="subskill-tile-likelihood"]')).toHaveText(
      drillLabel('likelihoodValue').replace('{likelihood}', `${subskill.likelihood}`),
    );
    expect(stored[subskill.attribute], `${subskill.attribute} vs results.attributes`).toBe(
      subskill.likelihood,
    );
  }

  const rendered = await tiles(page).evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-attribute')),
  );
  expect(rendered).toEqual(latest.subskills.map((subskill) => subskill.attribute));
}
