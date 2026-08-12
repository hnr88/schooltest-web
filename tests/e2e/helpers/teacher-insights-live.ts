import type { APIRequestContext, PlaywrightWorkerArgs } from '@playwright/test';

import { classInsightsResponseSchema } from '@/modules/teacher/schemas/teacher-result.schema';
import type { ClassInsightsResponse } from '@/modules/teacher/types/teacher-result.types';

import { TEACHER_TEST_FORM_CODES } from '../../../../schooltest-api/src/contracts/teacher';
import { runSql } from './auth-db';
import { API_BASE, bearer } from './teacher-results-live';

// Task 056 harness (brief flows 19, 20, 22, 23, 24, 26 of .qa/E2E-FLOWS.md): the
// LIVE C-TR-3 read plus the Postgres probes the Progress cohort rule is proven
// against. Nothing here writes a mastery cut, a subskill name or a student name
// down: the cuts come from the ACTIVE `configs` row, the form codes from the
// server's own contract constant, and every count from the real `sessions` /
// `results` rows the API itself reads.
//
// The SQL mirrors `class-students-attempts.ts:attemptOf` deliberately: ONE attempt
// per (student, form) — a `complete` session if the student has one, latest by
// `started_at` — and a profile only from a `complete` + `official` + `skill`-scope
// Result. A looser query would count a walked-away retake and would then "prove"
// a number the API never claimed.

/** Test A / Test B form codes — the server's own constant, never a literal. */
export const FORM_CODES = TEACHER_TEST_FORM_CODES;

/** C-TR-3 for ONE class, parsed by the shipped Zod mirror (drift throws here). */
export async function readClassInsightsLive(
  playwright: PlaywrightWorkerArgs['playwright'],
  classDocumentId: string,
): Promise<ClassInsightsResponse> {
  const request: APIRequestContext = await playwright.request.newContext();
  try {
    const jwt = await bearer(request);
    const response = await request.get(
      `${API_BASE}/api/teacher/classes/${classDocumentId}/insights`,
      { headers: { Authorization: `Bearer ${jwt}` } },
    );
    if (response.status() !== 200) {
      throw new Error(`[e2e] C-TR-3 answered ${response.status()} ${await response.text()}`);
    }
    return classInsightsResponseSchema.parse((await response.json()) as unknown);
  } finally {
    await request.dispose();
  }
}

export interface MasteryCuts {
  mastered_cut: number;
  approaching_cut: number;
}

/** The ACTIVE Config row's `teacher_mastery_bands` (CT-8) — read, never written. */
export function dbMasteryCuts(): MasteryCuts {
  const raw = runSql(
    `select teacher_mastery_bands::text from configs
      where active = true and published_at is not null`,
  );
  return JSON.parse(raw) as MasteryCuts;
}

/** Every class row in Postgres as `document_id|name` — the flow-22 reachability census. */
export function dbClasses(): string[] {
  return runSql(`select c.document_id || '|' || c.name from classes c order by c.id`).split('\n');
}

/**
 * ONE attempt per (student, form) for one class's ACTIVE roster, exactly as
 * `attemptOf` chooses it. Emitted as a CTE the count probes below select from.
 */
const attemptsCte = (classDocumentId: string, formCodes: readonly string[], student = '') => `
  with roster as (
    select s.id, s.document_id,
           s.given_name || ' ' || upper(left(s.family_name, 1)) || '.' as display_name
      from students s
      join students_class_lnk scl on scl.student_id = s.id
      join classes c on c.id = scl.class_id
     where c.document_id = '${classDocumentId}' and s.status = 'active'
       ${student === '' ? '' : `and s.document_id = '${student}'`}
  ),
  attempts as (
    select distinct on (roster.id, f.form_code)
           roster.id, roster.document_id, roster.display_name, f.form_code,
           se.status as session_status, r.attributes as attrs, r.created_at as scored_at
      from roster
      join sessions_student_lnk ssl on ssl.student_id = roster.id
      join sessions se on se.id = ssl.session_id
      join sessions_form_lnk sfl on sfl.session_id = se.id
      join forms f on f.id = sfl.form_id
      left join results_session_lnk rsl on rsl.session_id = se.id
      left join results r on r.id = rsl.result_id
       and r.status = 'complete' and r.destination = 'official' and r.scope = 'skill'
       and r.published_at is not null
     where f.form_code in (${formCodes.map((code) => `'${code}'`).join(', ')})
     order by roster.id, f.form_code, (se.status = 'complete') desc, se.started_at desc,
              se.document_id desc
  )`;

/** Active roster students who FINISHED any of these forms (a `complete` session). */
export function dbCompletedCount(
  classDocumentId: string,
  formCodes: readonly string[],
): number {
  return Number(
    runSql(
      `${attemptsCte(classDocumentId, formCodes)}
       select count(distinct id) from attempts where session_status = 'complete'`,
    ),
  );
}

/**
 * ONE student's LATEST completed profile, as `{R1: prob, …}` — the attempt with
 * the greatest Result `created_at` among their finished ones, which is the
 * `insights.ts:currentProfile` `scored_at` rule the groups are built from.
 */
export function dbLatestProfileProbs(
  classDocumentId: string,
  studentDocumentId: string,
): Record<string, number> {
  const raw = runSql(
    `${attemptsCte(classDocumentId, [FORM_CODES.A, FORM_CODES.B], studentDocumentId)},
     latest as (
       select attrs from attempts
        where session_status = 'complete' and attrs is not null
        order by scored_at desc limit 1
     )
     select coalesce((select jsonb_object_agg(k, (v->>'prob')::numeric)
                        from latest, jsonb_each(latest.attrs) as e(k, v)
                       where k ~ '^R[1-7]$' and jsonb_typeof(v) = 'object' and v ? 'prob')::text,
                     '{}')`,
  );
  return JSON.parse(raw) as Record<string, number>;
}

/** `document_id|Display N.` of every student who finished Test A but NOT Test B. */
export function dbTestAOnlyStudents(classDocumentId: string): string[] {
  const rows = runSql(
    `${attemptsCte(classDocumentId, [FORM_CODES.A])}
     select a.document_id || '|' || a.display_name
       from attempts a
      where a.session_status = 'complete'
        and not exists (
          select 1
            from sessions_student_lnk ssl
            join sessions se on se.id = ssl.session_id
            join sessions_form_lnk sfl on sfl.session_id = se.id
            join forms f on f.id = sfl.form_id
           where ssl.student_id = a.id and f.form_code = '${FORM_CODES.B}'
             and se.status = 'complete'
        )
      order by a.display_name`,
  );
  return rows === '' ? [] : rows.split('\n');
}

/**
 * How many of the class's finished attempts on this form band `mastered` on one
 * attribute — the same `prob >= mastered_cut` comparison
 * `schooltest-api/src/utils/teacher-mastery.ts` makes server-side, run over the
 * posteriors Postgres actually stores.
 */
export function dbMasteredOnForm(
  classDocumentId: string,
  formCode: string,
  attribute: string,
  cut: number,
): number {
  return Number(
    runSql(
      `${attemptsCte(classDocumentId, [formCode])}
       select count(*) from attempts
        where session_status = 'complete' and attrs is not null
          and (attrs->'${attribute}'->>'prob')::numeric >= ${cut}`,
    ),
  );
}

/** One student's stored posteriors on ONE form's finished attempt, `{R1: prob, …}`. */
export function dbProbsOnForm(
  classDocumentId: string,
  studentDocumentId: string,
  formCode: string,
): Record<string, number> {
  const raw = runSql(
    `${attemptsCte(classDocumentId, [formCode], studentDocumentId)},
     picked as (
       select attrs from attempts where session_status = 'complete' and attrs is not null
     )
     select coalesce((select jsonb_object_agg(k, (v->>'prob')::numeric)
                        from picked, jsonb_each(picked.attrs) as e(k, v)
                       where k ~ '^R[1-7]$' and jsonb_typeof(v) = 'object' and v ? 'prob')::text,
                     '{}')`,
  );
  return JSON.parse(raw) as Record<string, number>;
}
