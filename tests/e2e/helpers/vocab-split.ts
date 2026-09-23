import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { Page, Route } from '@playwright/test';

import { runSql } from './auth-db';

// BUG-008 harness. Two jobs, both scoped to the browser's calls to the API origin:
//
// 1. CORS BRIDGE. The live API allow-lists only the live web ports (3000/3001/3010).
//    A worktree dev server on another port (E2E_PORT=3108) is refused at preflight,
//    so the bridge answers the preflight and re-sends each call from Node, adding the
//    allow-origin header for this page. The request and the response body are the
//    API's own; nothing is invented.
//
// 2. PRE-INTEGRATION SHAPE SHIM (only when BUG008_PRE_INTEGRATION=1). Until the new
//    API contract is deployed the live API still sends the retired blend
//    (a `blended`/`status`/`single_strand` trio on `vocab`, a `Vocabulary` history key), which the new
//    strict web contract rejects. The shim DROPS those fields and, because the old API
//    never recorded per-strand history, gives each history point `Vocab_A2`/`Vocab_B1`
//    = null rather than a fabricated number. Every value the report rows show comes from
//    the unchanged `attributes.Vocab_A2`/`Vocab_B1` the live API already serves.
//    Post-integration, run WITHOUT the flag: the bridge then passes bodies through
//    untouched.

export const PRE_INTEGRATION = process.env.BUG008_PRE_INTEGRATION === '1';

export const PROOF_DIR = process.env.BUG008_PROOF_DIR ?? path.resolve('test-results', 'BUG-008');

/** NEXT_PUBLIC_API_BASE_URL exactly as the dev server reads it from `.env`. */
export function apiBaseUrl(): string {
  const raw = readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
  const match = raw.match(/^NEXT_PUBLIC_API_BASE_URL=(.*)$/m);
  if (!match) throw new Error('[e2e] NEXT_PUBLIC_API_BASE_URL missing from .env');
  return match[1].trim().replace(/^(['"])(.*)\1$/, '$2');
}

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

function isObject(value: Json): value is { [key: string]: Json } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const NOT_ASSESSED: Json = { status: 'not_assessed', items_seen: 0, insufficient_evidence: true };

/** The retired-blend fields out, the two strands kept — see the header. */
export function toSplitContract(value: Json): Json {
  if (Array.isArray(value)) {
    return value
      .filter((entry) => !(isObject(entry) && entry.attribute === 'Vocabulary'))
      .map(toSplitContract);
  }
  if (!isObject(value)) return value;
  const out: { [key: string]: Json } = {};
  for (const [key, entry] of Object.entries(value)) out[key] = toSplitContract(entry);
  const vocab = out.vocab;
  if (isObject(vocab) && 'blended' in vocab) out.vocab = { a2: vocab.a2, b1: vocab.b1 };
  for (const key of ['attributes', 'skills'] as const) {
    const map = out[key];
    if (!isObject(map) || !('Vocabulary' in map)) continue;
    const history = key === 'attributes';
    const { Vocabulary: _retired, ...rest } = map;
    out[key] = { ...rest, Vocab_A2: history ? null : NOT_ASSESSED, Vocab_B1: history ? null : NOT_ASSESSED };
  }
  return out;
}

export function corsHeaders(origin: string): Record<string, string> {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
    'access-control-allow-headers': '*, authorization, content-type',
    'access-control-expose-headers': 'content-disposition, retry-after',
    vary: 'Origin',
  };
}

/** Installs the bridge (and, pre-integration, the shim) for every browser call to the API. */
export async function bridgeApi(page: Page, webOrigin: string): Promise<void> {
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
    const body = text.length === 0 ? text : JSON.stringify(toSplitContract(JSON.parse(text) as Json));
    delete headers['content-length'];
    await route.fulfill({ response, headers, body });
  });
}

/**
 * The newest published official reading result the seeded teacher owns whose two
 * vocabulary strands were BOTH scored, preferring one where they differ (the gap a
 * blend hides). Read straight from Postgres; nothing is fixtured.
 */
export function vocabSplitResult(teacherEmail: string): {
  resultId: string;
  studentId: string;
  classId: string;
  a2: number;
  b1: number;
} {
  const row = runSql(
    `select r.document_id, s.document_id, c.document_id,
            r.attributes -> 'Vocab_A2' ->> 'domain_score', r.attributes -> 'Vocab_B1' ->> 'domain_score'
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
        and r.attributes -> 'Vocab_A2' ? 'domain_score' and r.attributes -> 'Vocab_B1' ? 'domain_score'
      order by (r.attributes -> 'Vocab_A2' ->> 'domain_score') <> (r.attributes -> 'Vocab_B1' ->> 'domain_score') desc,
               r.created_at desc
      limit 1`,
  ).split('\n')[0];
  const [resultId, studentId, classId, a2, b1] = (row ?? '').split('|');
  if (!resultId || !studentId || !classId) throw new Error(`[e2e] no two-strand result for ${teacherEmail}`);
  return { resultId, studentId, classId, a2: Number(a2), b1: Number(b1) };
}
