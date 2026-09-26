import { expect, type APIRequestContext, type PlaywrightWorkerArgs } from '@playwright/test';

import { resultViewSchema, type ResultView } from '@schooltest/scoring-contracts';

import { classRosterResponseSchema } from '@/modules/results/schemas/roster.schema';
import type { RosterRow } from '@/modules/results/types/roster.types';
import { teacherDashboardResponseSchema } from '@/modules/teacher/schemas/teacher.schema';
import type { TeacherDashboardResponse } from '@/modules/teacher/types/teacher.types';

import { apiEnv } from './auth-db';
import { cat } from './i18n';
import { fetchWithRetry, loginCached } from './http';
import { ACCOUNTS, en } from './teacher-rail';
import { API_BASE } from './teacher-results-live';

// Harness for the teacher Reports tab specs (Spec 06's rebuilt tab — the release
// workflow is gone, so nothing here writes). Every expected value is read live
// from the API the browser talks to.

export const fr = (key: string) => cat(en, `TeacherPortal.familyReports.${key}`);

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
 * The tallies the Reports tab is built on, computed from what the API actually
 * served for every roster row. The release workflow is gone (Spec 06 §0.1), so
 * `release_state` no longer gates anything: a row is SCORED exactly when its
 * result carries an `overall.domain_score` — that row serves a PDF; every other
 * row (no result, or an unscored one) reads "No result yet".
 */
export function expectedTiles(roster: readonly RosterRow[]): Record<'scored' | 'noResult', number> {
  const scored = roster.filter((row) => row.result !== null && row.result.overall.domain_score !== null).length;
  return { scored, noResult: roster.length - scored };
}

/** A served `acara_phase` → the kit's phase word; anything unmapped (or null) reads the kit dash. */
const SERVER_PHASE_KEY: Readonly<Record<string, string>> = {
  beginning: 'beginning',
  emerging: 'emerging',
  developing: 'developing',
  developing_to_consolidating: 'developing',
  consolidating: 'consolidating',
};

export function expectedPhaseText(row: RosterRow): string {
  const code = row.result?.acara_phase?.trim().toLowerCase().replace(/\s+phase$/, '') ?? null;
  const key = code === null ? undefined : SERVER_PHASE_KEY[code];
  return key === undefined ? cat(en, 'TeacherPortal.kit.noValue') : cat(en, `TeacherPortal.kit.phase.${key}`);
}
