import { expect, type PlaywrightWorkerArgs } from '@playwright/test';

import type { StudentDrillDownResponse } from '@/modules/teacher/types/teacher-result.types';

import { TEACHER_TEST_FORM_CODES } from '../../../../schooltest-api/src/contracts/teacher';
import { runSql } from './auth-db';
import { readDrillDownLive } from './teacher-drill-down-live';
import { readClassStudentsLive } from './teacher-results-live';

// Task 055 harness for brief flows 17, 18 and 28 (.qa/E2E-FLOWS.md). Nothing here
// writes down a mastery cut, a subskill band or a delta: the SUBJECT student is
// discovered from the real roster, the retuned cuts are computed from the DINA
// posteriors Postgres actually stores, and the ONE global row this lane mutates is
// snapshotted before the write so it can be restored byte-for-byte.

/** Test A / Test B form codes — the server's own constant, never a literal. */
export const FORM_CODES = TEACHER_TEST_FORM_CODES;

export interface BothTestsSubject {
  classDocumentId: string;
  studentDocumentId: string;
  drill: StudentDrillDownResponse;
}

/**
 * The first student on the teacher's REAL roster whose C-TR-2 body carries two
 * completed tests AND a non-null `delta` on every subskill of the newest one — the
 * only shape flows 17/18 may be asserted on (a `null` delta is F-EQUATING-GATE
 * suppression, and inventing one would be the exact fake the brief forbids).
 */
export async function findBothTestsSubject(
  playwright: PlaywrightWorkerArgs['playwright'],
  classDocumentIds: readonly string[],
): Promise<BothTestsSubject> {
  for (const classDocumentId of classDocumentIds) {
    const roster = await readClassStudentsLive(playwright, classDocumentId);
    for (const student of roster.students) {
      const drill = await readDrillDownLive(playwright, classDocumentId, student.student_document_id);
      if (drill.tests.length !== 2 || drill.progress === null) continue;
      if (drill.tests[0].subskills.some((subskill) => subskill.delta === null)) continue;
      return { classDocumentId, studentDocumentId: student.student_document_id, drill };
    }
  }
  throw new Error('[e2e] no student on this teacher’s roster has a comparable A→B pair');
}

export interface MasteryBandsRow {
  mastered_cut: number;
  approaching_cut: number;
}

/** The ACTIVE Config row's `teacher_mastery_bands` JSON, verbatim, for evidence. */
export function masteryBandsJson(): string {
  return runSql(
    `select teacher_mastery_bands::text from configs
      where active = true and published_at is not null`,
  );
}

/**
 * Writes ONE new cut pair onto the ACTIVE Config row — the single server-side home
 * of the bands (`schooltest-api/src/utils/teacher-mastery.ts` reads it per request).
 * This is the only write this lane makes, it is GLOBAL, and every caller restores
 * the snapshot in a `finally`. Returns the row as Postgres now holds it.
 */
export function writeMasteryBands(bands: MasteryBandsRow): string {
  const json = JSON.stringify(bands);
  const out = runSql(
    `update configs set teacher_mastery_bands = '${json}'::jsonb, updated_at = now()
      where active = true and published_at is not null
      returning teacher_mastery_bands::text`,
  ).split('\n');
  // psql prints the RETURNING tuple, then the command tag — exactly ONE row must move.
  expect(out[out.length - 1], `retuning the ACTIVE Config row (CT-8): ${out.join(' / ')}`).toBe(
    'UPDATE 1',
  );
  return out[0];
}

/**
 * The `forms.form_code` of every COMPLETE sitting this student holds, newest
 * first — the persisted recency order C-TR-2's `tests` array claims to follow.
 */
export function dbCompletedFormCodes(studentDocumentId: string): string[] {
  const raw = runSql(
    `select coalesce(json_agg(t.form_code order by t.ended_at desc)::text, '[]') from (
       select se.ended_at, f.form_code
         from students s
         join sessions_student_lnk sl on sl.student_id = s.id
         join sessions se on se.id = sl.session_id
         join sessions_form_lnk fl on fl.session_id = se.id
         join forms f on f.id = fl.form_id
         join results_session_lnk rsl on rsl.session_id = se.id
         join results r on r.id = rsl.result_id
        where s.document_id = '${studentDocumentId}'
          and r.status = 'complete' and r.published_at is not null
     ) t`,
  );
  return JSON.parse(raw) as string[];
}

/** Raw `results.attributes[R*].prob` on the student's most recent complete result. */
export function dbLatestProbs(studentDocumentId: string): Record<string, number> {
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
     select coalesce((select jsonb_object_agg(k, (v->>'prob')::numeric)
                        from latest, jsonb_each(latest.attrs) as e(k, v)
                       where k ~ '^R[1-7]$' and jsonb_typeof(v) = 'object' and v ? 'prob')::text,
                     '{}')`,
  );
  return JSON.parse(raw) as Record<string, number>;
}

/**
 * `previous_likelihood` recomputed from PERSISTED numbers only: the gated
 * `results.attributes[R*].delta` subtracted from that entry's own `prob`, rounded
 * the way `likelihood()` rounds. This is the row C-TR-2's "was 62%" is built from,
 * so it proves the line on screen is the stored measurement pair.
 */
export function dbLatestPreviousLikelihoods(studentDocumentId: string): Record<string, number> {
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
     select coalesce((select jsonb_object_agg(k,
                              round(((v->>'prob')::numeric - (v->>'delta')::numeric) * 100)::int)
                        from latest, jsonb_each(latest.attrs) as e(k, v)
                       where k ~ '^R[1-7]$' and jsonb_typeof(v) = 'object' and v ? 'delta'
                         and jsonb_typeof(v->'delta') = 'number')::text,
                     '{}')`,
  );
  return JSON.parse(raw) as Record<string, number>;
}

/**
 * A cut pair, computed from the subject's REAL posteriors, that is guaranteed to
 * move at least one tile DOWN a band and at least one tile UP:
 *   `mastered_cut`   = midpoint of the two highest currently-mastered posteriors,
 *                      so everything but the top one demotes to `approaching`.
 *   `approaching_cut`= midpoint between the highest currently-`not_yet` posterior
 *                      and the next one below it, so that one promotes.
 * Six decimals is enough separation for this data and stays inside the contract's
 * 0..1 range; the pair is rejected if the real distribution cannot supply it.
 */
export function retunedCuts(
  probs: Record<string, number>,
  current: MasteryBandsRow,
): MasteryBandsRow {
  const sorted = [...new Set(Object.values(probs))].sort((a, b) => b - a);
  const mastered = sorted.filter((prob) => prob >= current.mastered_cut);
  const notYet = sorted.filter((prob) => prob < current.approaching_cut);
  if (mastered.length < 2 || notYet.length < 2) {
    throw new Error(`[e2e] posteriors cannot exhibit a band shift: ${JSON.stringify(sorted)}`);
  }
  const round6 = (value: number) => Math.round(value * 1e6) / 1e6;
  const cuts = {
    mastered_cut: round6((mastered[0] + mastered[1]) / 2),
    approaching_cut: round6((notYet[0] + notYet[1]) / 2),
  };
  expect(cuts.mastered_cut, 'retuned cuts must stay orderable').toBeGreaterThan(
    cuts.approaching_cut,
  );
  expect(cuts).not.toEqual(current);
  return cuts;
}
