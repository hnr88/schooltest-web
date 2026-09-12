import { expect, type APIRequestContext, type PlaywrightWorkerArgs } from '@playwright/test';

import { resultViewSchema, type ResultView } from '@schooltest/scoring-contracts';

import { classRosterResponseSchema } from '@/modules/results/schemas/roster.schema';
import type { RosterRow } from '@/modules/results/types/roster.types';
import { teacherDashboardResponseSchema } from '@/modules/teacher/schemas/teacher.schema';
import type { TeacherDashboardResponse } from '@/modules/teacher/types/teacher.types';

import { apiEnv, runSql } from './auth-db';
import { cat } from './i18n';
import { fetchWithRetry, loginCached } from './http';
import { ACCOUNTS, en } from './teacher-rail';
import { API_BASE } from './teacher-results-live';

// Harness for teacher-v2/family-reports-tab.spec.ts. Every expected value is read live
// from the API the browser talks to; the one write the spec makes is undone from a
// snapshot of the row taken before it.

export const fr = (key: string) => cat(en, `TeacherPortal.familyReports.${key}`);
export const vm = (key: string) => cat(en, `TeacherPortal.viewModel.${key}`);

/** Resolves the catalog's ICU for one value set: `=N` / `one` / `other` plural arms and `{x}` args. */
export function icu(template: string, values: Record<string, string | number>): string {
  const plural = template.match(/^\{(\w+), plural, ([\s\S]*)\}$/);
  if (plural === null) return template.replace(/\{(\w+)\}/g, (_all, key: string) => String(values[key] ?? ''));
  const arms = new Map<string, string>();
  let rest = plural[2];
  while (rest.trim() !== '') {
    const head = rest.match(/^\s*(=\d+|\w+)\s*\{/);
    if (head === null) break;
    let depth = 1;
    let index = head[0].length;
    for (; index < rest.length && depth > 0; index += 1) {
      if (rest[index] === '{') depth += 1;
      else if (rest[index] === '}') depth -= 1;
    }
    arms.set(head[1], rest.slice(head[0].length, index - 1));
    rest = rest.slice(index);
  }
  const count = Number(values[plural[1]]);
  const arm = arms.get(`=${count}`) ?? (count === 1 ? arms.get('one') : undefined) ?? arms.get('other') ?? '';
  return icu(arm.replace(/#/g, String(count)), values);
}

export interface TeacherApi {
  dashboard: () => Promise<TeacherDashboardResponse>;
  roster: (classId: string) => Promise<RosterRow[]>;
  result: (resultId: string) => Promise<ResultView>;
}

export async function teacherApi(playwright: PlaywrightWorkerArgs['playwright']): Promise<TeacherApi> {
  const request: APIRequestContext = await playwright.request.newContext();
  const jwt = await loginCached(request, API_BASE, {
    email: ACCOUNTS.teacher.email,
    password: apiEnv(ACCOUNTS.teacher.secret),
  });
  const get = async (route: string): Promise<unknown> => {
    const response = await fetchWithRetry(() =>
      request.get(`${API_BASE}${route}`, { headers: { Authorization: `Bearer ${jwt}` } }),
    );
    expect(response.status(), route).toBe(200);
    return response.json();
  };
  return {
    dashboard: async () => teacherDashboardResponseSchema.parse(await get('/api/teacher/dashboard')),
    roster: async (classId) =>
      classRosterResponseSchema.parse(await get(`/api/my/students/results?class=${encodeURIComponent(classId)}`)),
    result: async (resultId) => resultViewSchema.parse(await get(`/api/results/${encodeURIComponent(resultId)}`)),
  };
}

/**
 * The four tiles, tallied from what the API actually served for every roster row: the
 * `release_state` AND the score on it. A held result with no `overall.domain_score` is not
 * scored and cannot be released, so it counts under "No result yet" (TB-40).
 */
export function expectedTiles(roster: readonly RosterRow[]): Record<'scored' | 'released' | 'held' | 'noResult', number> {
  const count = (states: readonly string[]) => roster.filter((row) => states.includes(row.release_state)).length;
  const heldRows = roster.filter((row) => row.release_state === 'held');
  const held = heldRows.filter((row) => row.result !== null && row.result.overall.domain_score !== null).length;
  const released = count(['released']);
  return {
    scored: released + held,
    released,
    held,
    noResult: count(['manual', 'absent', 'nosit', 'open']) + (heldRows.length - held),
  };
}

export interface ResultRowSnapshot {
  resultId: string;
  columns: string[];
  notificationBaseline: number;
}

const SNAPSHOT_COLUMNS = `coalesce(published_at_field::text, 'NULL'), coalesce(recalled_at::text, 'NULL'),
  coalesce(recall_reason, 'NULL'), updated_at::text`;
const literal = (value: string) => (value === 'NULL' ? 'null' : `'${value.replace(/'/g, "''")}'`);

/** The row's release columns before any write; null when the database is out of reach (then nothing is written). */
export function snapshotResultRow(resultId: string): ResultRowSnapshot | null {
  const columns = runSql(`select ${SNAPSHOT_COLUMNS} from results where document_id = ${literal(resultId)}`).split('|');
  const baseline = Number(runSql('select coalesce(max(id), 0) from notifications'));
  if (columns.length !== 4 || !Number.isInteger(baseline)) return null;
  return { resultId, columns, notificationBaseline: baseline };
}

export function recallReasonOf(resultId: string): string {
  return runSql(`select coalesce(recall_reason, 'NULL') from results where document_id = ${literal(resultId)}`);
}

/**
 * Writes the snapshot back and deletes the release/recall notifications the run created
 * (they carry no result id, so they are matched by the id window and event type).
 */
export function restoreResultRow(snapshot: ResultRowSnapshot): string[] {
  const [published, recalled, reason, updated] = snapshot.columns;
  runSql(`update results set published_at_field = ${literal(published)}, recalled_at = ${literal(recalled)},
    recall_reason = ${literal(reason)}, updated_at = ${literal(updated)}
    where document_id = ${literal(snapshot.resultId)}`);
  const created = runSql(`select coalesce(string_agg(id::text, ','), '') from notifications
    where id > ${snapshot.notificationBaseline} and event_type in ('test_results_ready', 'report_recalled')`);
  if (created !== '') {
    runSql(`delete from notifications_user_lnk where notification_id in (${created})`);
    runSql(`delete from notifications where id in (${created})`);
  }
  expect(
    runSql(`select ${SNAPSHOT_COLUMNS} from results where document_id = ${literal(snapshot.resultId)}`).split('|'),
    'result row restored to its snapshot',
  ).toEqual(snapshot.columns);
  return created === '' ? [] : created.split(',');
}
