import type { Page, Route } from '@playwright/test';

import { runSql } from './auth-db';
import { apiBaseUrl, corsHeaders, toSplitContract, type Json } from './vocab-split';

// Spec 4 (Academic Vocabulary, `Vocab_B2`) harness — the BUG-008 pattern, two jobs,
// both scoped to the browser's calls to the API origin:
//
// 1. CORS BRIDGE. The live API allow-lists only the live web ports; a worktree dev
//    server on another port is refused at preflight, so the bridge answers the
//    preflight and re-sends each call from Node with this page's allow-origin. The
//    request and the response body are the API's own; nothing is invented.
//
// 2. PRE-INTEGRATION SHAPE SHIM (only when SPEC4_PRE_INTEGRATION=1). Until the spec-4
//    API is deployed the live API sends no `academic_vocab` and no `Vocab_B2` history
//    or export key, which the nine-skill web contract rejects. The shim adds them in
//    the API's own pre-spec-4 shape — not reached: no score, no band, never a number —
//    after the BUG-008 blend shim. A banded Academic row therefore needs the
//    integrated stack: run WITHOUT the flag and the bridge passes bodies untouched.

export const PRE_INTEGRATION = process.env.SPEC4_PRE_INTEGRATION === '1';

const NOT_REACHED: Json = { domain_score: null, se: null, band: null, items_seen: 0, provisional_cut: true };
const NOT_ASSESSED_SKILL: Json = { status: 'not_assessed', insufficient_evidence: true, items_seen: 0 };

function isObject(value: Json): value is { [key: string]: Json } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Adds the strand in its not-reached shape wherever the pre-spec-4 wire lacks it. */
export function toAcademicContract(value: Json): Json {
  if (Array.isArray(value)) return value.map(toAcademicContract);
  if (!isObject(value)) return value;
  const out: { [key: string]: Json } = {};
  for (const [key, entry] of Object.entries(value)) out[key] = toAcademicContract(entry);
  if ('gate' in out && 'attributes' in out && 'vocab' in out && !('academic_vocab' in out)) {
    out.academic_vocab = NOT_REACHED;
  }
  for (const key of ['attributes', 'skills'] as const) {
    const map = out[key];
    if (!isObject(map) || !('Critical' in map) || 'Vocab_B2' in map) continue;
    const { Critical: critical, ...rest } = map;
    out[key] = { ...rest, Vocab_B2: key === 'attributes' ? null : NOT_ASSESSED_SKILL, Critical: critical };
  }
  return out;
}

/** Installs the bridge (and, pre-integration, both shims) for every browser call to the API. */
export async function bridgeAcademicApi(page: Page, webOrigin: string): Promise<void> {
  const api = apiBaseUrl();
  await page.route(`${api}/**`, async (route: Route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders(webOrigin) });
      return;
    }
    const response = await route.fetch();
    const headers = { ...response.headers(), ...corsHeaders(webOrigin) };
    const isJson = (headers['content-type'] ?? '').includes('application/json');
    if (!PRE_INTEGRATION || !isJson) {
      await route.fulfill({ response, headers });
      return;
    }
    const text = await response.text();
    const body = text.length === 0 ? text : JSON.stringify(toAcademicContract(toSplitContract(JSON.parse(text) as Json)));
    delete headers['content-length'];
    await route.fulfill({ response, headers, body });
  });
}

export interface AcademicTarget {
  resultId: string;
  studentId: string;
  classId: string;
  /** The stored strand band ('' pre-integration: the column is absent). */
  band: string;
  itemsSeen: number;
  gatePassed: boolean;
}

/**
 * The seeded teacher's newest published official reading result that is its
 * student's LATEST such result (so the student page shows the same sitting) and
 * reached Section 3 (so Critical carries a gate). Integrated, it must also carry a
 * banded Academic Vocabulary strand. Read straight from Postgres; nothing is fixtured.
 */
export function academicVocabResult(teacherEmail: string): AcademicTarget {
  const academic = PRE_INTEGRATION
    ? `'' , '0'`
    : `r.academic_vocab ->> 'band', coalesce(r.academic_vocab ->> 'items_seen', '0')`;
  const banded = PRE_INTEGRATION ? '' : `and r.academic_vocab ->> 'band' is not null`;
  const row = runSql(
    `select r.document_id, s.document_id, c.document_id, ${academic}, r.gate ->> 'passed'
       from results r
       join results_student_lnk rs on rs.result_id = r.id
       join students s on s.id = rs.student_id
       join students_class_lnk sc on sc.student_id = s.id
       join classes c on c.id = sc.class_id
       join classes_teacher_lnk ct on ct.class_id = c.id
       join up_users u on u.id = ct.user_id
      where u.email = '${teacherEmail}'
        and r.skill = 'reading' and r.destination = 'official' and r.published_at is not null
        and r.model_version = 'reading-3model/1'
        and r.gate ? 'domain_score' ${banded}
        and not exists (
          select 1 from results r2 join results_student_lnk rs2 on rs2.result_id = r2.id
           where rs2.student_id = s.id and r2.skill = 'reading' and r2.destination = 'official'
             and r2.published_at is not null and r2.created_at > r.created_at)
      order by r.created_at desc
      limit 1`,
  ).split('\n')[0];
  const [resultId, studentId, classId, band, itemsSeen, passed] = (row ?? '').split('|');
  if (!resultId || !studentId || !classId) {
    throw new Error(`[e2e] no ${PRE_INTEGRATION ? 'Section-3' : 'banded Academic Vocabulary'} result for ${teacherEmail}`);
  }
  return { resultId, studentId, classId, band: band ?? '', itemsSeen: Number(itemsSeen), gatePassed: passed === 'true' };
}
