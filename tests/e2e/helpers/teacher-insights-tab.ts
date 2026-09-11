import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { displaySkillSchema, type DisplaySkill, type ResultView } from '@schooltest/scoring-contracts';

import { classRosterResponseSchema } from '@/modules/results/schemas/roster.schema';
import type { RosterRow } from '@/modules/results/types/roster.types';
import { classDiagnosticSchema } from '@/modules/teach/schemas/diagnostic.schema';
import type { ClassDiagnostic } from '@/modules/teach/types/diagnostic.types';
import { sittingActivityFeedSchema } from '@/modules/teacher/schemas/teacher-session.schema';
import { classSittingSchema } from '@/modules/test-day/schemas/test-day.schema';

import { cat } from './i18n';
import { API_BASE } from './teacher-results-live';
import { en } from './teacher-rail';

// S5 harness (teacher-v2/insights-tab.spec.ts). Every expected value is re-derived here
// from the live responses (the roster and class diagnostic the page itself received,
// the sittings and activity read over the API) — never from the app's own view model.

export const insights = (key: string): string => cat(en, `TeacherPortal.insights.${key}`);
export const viewModel = (key: string): string => cat(en, `TeacherPortal.viewModel.${key}`);

/** The design's pairing rule (`Teacher Portal v2.dc.html` ci.pairs): gap >= 12, <= 4 pairs. */
const PAIR_MIN_GAP = 12;
const PAIR_MAX = 4;

const isNumber = (value: number | null): value is number => value !== null;
const mean = (values: readonly number[]): number => values.reduce((sum, value) => sum + value, 0) / values.length;
const resultsOf = (rows: readonly RosterRow[]): ResultView[] => rows.flatMap((row) => (row.result === null ? [] : [row.result]));

/** Starts listening NOW for the first GET the page makes to a matching URL; resolves its JSON (null if it never comes). */
export function pageJson(page: Page, url: string | RegExp): Promise<unknown> {
  let body: unknown = null;
  return page
    .waitForResponse(
      async (response) => {
        const matches = typeof url === 'string' ? response.url().includes(url) : url.test(response.url());
        if (!matches || response.request().method() !== 'GET' || !response.ok()) return false;
        body = await response.json().catch(() => null);
        return body !== null;
      },
      { timeout: 90_000 },
    )
    .then(() => body)
    .catch(() => null);
}

export const parseRoster = (body: unknown): RosterRow[] => classRosterResponseSchema.parse(body);

export const parseDiagnostic = (body: unknown): ClassDiagnostic =>
  classDiagnosticSchema.parse((body as { data: unknown }).data);

export function expectedKpis(rows: readonly RosterRow[]) {
  const results = resultsOf(rows);
  const scores = results.map((result) => result.overall.domain_score).filter(isNumber);
  const satAts = results.flatMap((result) => (result.history ?? []).map((point) => point.sat_at)).sort();
  return {
    classAverage: scores.length === 0 ? null : Math.round(mean(scores)),
    scored: scores.length,
    total: rows.length,
    participation: rows.length === 0 ? null : Math.round((scores.length / rows.length) * 100),
    lastSatAt: satAts.at(-1) ?? null,
  };
}

/** One subskill of one result, read from the contract blocks (vocab blend, the gate, else the attribute). */
function reading(result: ResultView, skill: DisplaySkill): { score: number | null; status: string | null } {
  if (skill === 'Vocabulary') return { score: result.vocab.blended, status: result.vocab.status };
  if (skill === 'Critical') return { score: result.gate.domain_score, status: null };
  const attribute = result.attributes[skill];
  if (attribute === undefined || attribute.status === 'not_assessed') return { score: null, status: null };
  return { score: attribute.domain_score, status: attribute.status };
}

export function expectedSkill(rows: readonly RosterRow[], skill: DisplaySkill) {
  const readings = resultsOf(rows)
    .map((result) => reading(result, skill))
    .filter((entry) => entry.score !== null);
  const banded = readings.filter((entry) => entry.status !== null);
  return {
    mean: readings.length === 0 ? null : Math.round(mean(readings.map((entry) => entry.score ?? 0))),
    assessed: readings.length,
    secure: skill === 'Critical' || banded.length === 0 ? null : banded.filter((entry) => entry.status === 'secure').length,
  };
}

/** Suggested groups: each student under their lowest-scoring subskill (not Critical, ties in display order); none scored → not_yet_assessed, last. */
export function expectedGroups(rows: readonly RosterRow[]): { attribute: string; members: string[] }[] {
  const bySkill = new Map<string, string[]>();
  const unassessed: string[] = [];
  for (const row of rows) {
    let weakest: { skill: DisplaySkill; score: number } | null = null;
    for (const skill of row.result === null ? [] : displaySkillSchema.options.filter((entry) => entry !== 'Critical')) {
      const { score } = reading(row.result as ResultView, skill);
      if (score !== null && (weakest === null || score < weakest.score)) weakest = { skill, score };
    }
    if (weakest === null) unassessed.push(row.student.name);
    else bySkill.set(weakest.skill, [...(bySkill.get(weakest.skill) ?? []), row.student.name]);
  }
  const groups = displaySkillSchema.options.flatMap((skill) => (bySkill.has(skill) ? [{ attribute: skill, members: bySkill.get(skill) ?? [] }] : []));
  return unassessed.length === 0 ? groups : [...groups, { attribute: 'not_yet_assessed', members: unassessed }];
}

export function expectedPairCount(rows: readonly RosterRow[], skill: DisplaySkill): number {
  const scores = resultsOf(rows)
    .map((result) => reading(result, skill).score)
    .filter(isNumber)
    .sort((a, b) => b - a);
  let pairs = 0;
  let support = scores.length - 1;
  for (let strong = 0; strong < support && pairs < PAIR_MAX; strong += 1) {
    if (scores[strong] - scores[support] >= PAIR_MIN_GAP) pairs += 1;
    support -= 1;
  }
  return pairs;
}

export interface RenderedMasteryRow {
  skill: string;
  mean: number | null;
  secure: number | null;
  assessed: number;
  flag: string | null;
}

export function renderedMastery(panel: Locator): Promise<RenderedMasteryRow[]> {
  return panel.locator('[data-slot="insights-mastery-row"]').evaluateAll((items) =>
    items.map((item) => {
      const numeric = (name: string) => {
        const value = item.getAttribute(name);
        return value === null ? null : Number(value);
      };
      return {
        skill: item.getAttribute('data-skill') ?? '',
        mean: numeric('data-mean'),
        secure: numeric('data-secure'),
        assessed: Number(item.getAttribute('data-assessed')),
        flag: item.getAttribute('data-flag'),
      };
    }),
  );
}

/** Weakest first: ranked skills (not Critical, with a mean) lead, by fewest secure then lowest mean; Critical follows. */
export function expectWeakestFirst(rows: readonly RenderedMasteryRow[]): RenderedMasteryRow[] {
  const ranked = rows.filter((row) => row.skill !== 'Critical' && row.mean !== null);
  expect(rows.slice(0, ranked.length), 'ranked skills lead the list').toEqual(ranked);
  for (const [index, after] of ranked.entries()) {
    const before = ranked[index - 1];
    if (before === undefined) continue;
    const [secureA, secureB] = [before.secure ?? 0, after.secure ?? 0];
    expect(secureA < secureB || (secureA === secureB && (before.mean ?? 0) <= (after.mean ?? 0)), `${before.skill} before ${after.skill}`).toBe(true);
  }
  const critical = rows.find((row) => row.skill === 'Critical');
  if (critical !== undefined && critical.mean !== null) expect(rows[ranked.length].skill).toBe('Critical');
  return ranked;
}

/** The class's latest reading sitting (same read as the app) and how many activity entries it has. */
export async function latestReadingActivity(request: APIRequestContext, jwt: string, classId: string) {
  const headers = { Authorization: `Bearer ${jwt}` };
  const sittings = await request.get(`${API_BASE}/api/sittings`, {
    headers,
    params: {
      'filters[class][documentId][$eq]': classId,
      sort: 'createdAt:desc',
      'populate[form][fields][0]': 'form_code',
      'populate[class][fields][0]': 'name',
      'pagination[pageSize]': 100,
    },
  });
  expect(sittings.status()).toBe(200);
  const rows = ((await sittings.json()) as { data: unknown[] }).data.map((row) => classSittingSchema.parse(row));
  const latest = rows.find((row) => row.skill === 'reading');
  if (latest === undefined) return { sittingId: null, formCode: null, entries: 0 };
  const activity = await request.get(`${API_BASE}/api/sittings/${latest.documentId}/activity`, {
    headers,
    params: { limit: 8 },
  });
  expect(activity.status()).toBe(200);
  const feed = sittingActivityFeedSchema.parse(((await activity.json()) as { data: unknown }).data);
  return { sittingId: latest.documentId, formCode: latest.form?.form_code ?? null, entries: feed.entries.length };
}
