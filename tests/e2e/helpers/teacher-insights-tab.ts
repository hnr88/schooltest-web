import { expect, type APIRequestContext, type Page } from '@playwright/test';
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

/** One subskill of one result, read from the contract blocks (the gate, the Academic strand, else the attribute). */
function reading(result: ResultView, skill: DisplaySkill): { score: number | null; status: string | null } {
  if (skill === 'Critical') return { score: result.gate.domain_score, status: null };
  if (skill === 'Vocab_B2') {
    const { domain_score: score, band } = result.academic_vocab;
    return score === null || band === null ? { score: null, status: null } : { score, status: band };
  }
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

// The old insights tab's mastery-table helpers (`renderedMastery` over
// `[data-slot="insights-mastery-row"]`, `expectWeakestFirst`) retired with the
// Spec-04 rebuild: the Teaching tab renders strand cards, not a mastery table.

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

// ---------------------------------------------------------------------------
// Spec 04 — the rebuilt Teaching tab (`live_feedback_2/spec-teacher-portal-04-teaching.md`,
// mock `04 Teaching.html`). Everything below re-derives the tab's view model from the live
// roster: THREE strand cards (Vocabulary / Comprehension / Foundations) group every scored
// student under the subskill, within the strand, where they sit FURTHEST BELOW the class
// mean; pairs run on the class's largest-gap skill (lowest mean, Critical excluded — no
// band); next steps are two pills per scored student naming the NEXT phase (ladder
// Beginning→Emerging→Developing→Consolidating→"Extend"); Critical is only the exit gate.
const TEACHING_STRANDS = {
  vocabulary: ['Vocab_A2', 'Vocab_B1', 'Vocab_B2'],
  comprehension: ['Gist', 'Detail', 'Inference'],
  foundations: ['Decoding', 'Grammar'],
} as const;
export type TeachingStrandName = keyof typeof TEACHING_STRANDS;
const STRAND_NAMES = Object.keys(TEACHING_STRANDS) as TeachingStrandName[];
const TEACHING_BAND_RANK = { not_yet: 0, emerging: 1, developing: 2, secure: 3 } as const;
const TEACHING_PHASE_BY_RANK = ['Beginning', 'Emerging', 'Developing', 'Consolidating'] as const;
const TEACHING_NEXT_PHASE = ['Emerging', 'Developing', 'Consolidating', 'Extend'] as const;
/** The app's `SKILL_LABEL_KEY` (`v2-i18n.constants.ts`) mirrored, so pair/next-step labels resolve the same way. */
export const SKILL_LABEL_KEY: Readonly<Record<DisplaySkill, string>> = {
  Decoding: 'skill.decoding',
  Vocab_A2: 'attribute.vocabA2',
  Grammar: 'skill.grammar',
  Vocab_B1: 'attribute.vocabB1',
  Gist: 'skill.gist',
  Detail: 'skill.detail',
  Inference: 'skill.inference',
  Vocab_B2: 'attribute.vocabB2',
  Critical: 'skill.critical',
};

function classMeans(rows: readonly RosterRow[]): Map<DisplaySkill, number> {
  const means = new Map<DisplaySkill, number>();
  for (const skill of displaySkillSchema.options) {
    const scores = resultsOf(rows)
      .map((result) => reading(result, skill).score)
      .filter(isNumber);
    if (scores.length > 0) means.set(skill, mean(scores));
  }
  return means;
}

function limitingSkill(result: ResultView, strand: TeachingStrandName, means: Map<DisplaySkill, number>): DisplaySkill | null {
  let selected: DisplaySkill | null = null;
  let smallestGap = Infinity;
  for (const skill of TEACHING_STRANDS[strand]) {
    const { score } = reading(result, skill);
    const classMean = means.get(skill);
    if (score === null || classMean === undefined) continue;
    if (score - classMean < smallestGap) {
      selected = skill;
      smallestGap = score - classMean;
    }
  }
  return selected;
}

export interface ExpectedStrandGroup {
  skill: string;
  members: string[];
  /** The members' MODAL current band on the skill as a phase name (ties → the lower band); null when none is banded. */
  phase: string | null;
}

function modalPhase(results: readonly ResultView[], skill: DisplaySkill): string | null {
  const counts = new Map<string, number>();
  for (const result of results) {
    const { status } = reading(result, skill);
    if (status !== null && status in TEACHING_BAND_RANK) counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  const rank = (band: string) => TEACHING_BAND_RANK[band as keyof typeof TEACHING_BAND_RANK];
  const [top] = [...counts].sort(([a, countA], [b, countB]) => countB - countA || rank(a) - rank(b));
  return top === undefined ? null : TEACHING_PHASE_BY_RANK[rank(top[0])];
}

/** Per strand, one group row per limiting subskill in strand order, members in roster order. */
export function expectedStrandGroups(rows: readonly RosterRow[]): Record<TeachingStrandName, ExpectedStrandGroup[]> {
  const means = classMeans(rows);
  const membersBySkill = Object.fromEntries(STRAND_NAMES.map((strand) => [strand, new Map<string, RosterRow[]>()])) as Record<
    TeachingStrandName,
    Map<string, RosterRow[]>
  >;
  for (const row of rows) {
    if (row.result === null) continue;
    for (const strand of STRAND_NAMES) {
      const skill = limitingSkill(row.result, strand, means);
      if (skill === null) continue;
      const map = membersBySkill[strand];
      map.set(skill, [...(map.get(skill) ?? []), row]);
    }
  }
  return Object.fromEntries(
    STRAND_NAMES.map((strand) => [
      strand,
      TEACHING_STRANDS[strand].flatMap((skill) => {
        const members = membersBySkill[strand].get(skill);
        if (members === undefined) return [];
        return [{
          skill,
          members: members.map((row) => row.student.name),
          phase: modalPhase(resultsOf(members), skill),
        }];
      }),
    ]),
  ) as Record<TeachingStrandName, ExpectedStrandGroup[]>;
}

/** The class's largest-gap subskill: the lowest class mean outside Critical (which carries no band). */
export function expectedLargestGapSkill(rows: readonly RosterRow[]): DisplaySkill | null {
  let selected: DisplaySkill | null = null;
  let lowest = Infinity;
  for (const [skill, classMean] of classMeans(rows)) {
    if (skill === 'Critical' || classMean >= lowest) continue;
    selected = skill;
    lowest = classMean;
  }
  return selected;
}

/** The Critical reading exit-gate chip: count true vs false gates, ignoring not-assessed rows. */
export function expectedGateSummary(rows: readonly RosterRow[]): { passed: number; notYet: number } {
  const summary = { passed: 0, notYet: 0 };
  for (const row of rows) {
    if (row.result?.gate.passed === true) summary.passed += 1;
    else if (row.result?.gate.passed === false) summary.notYet += 1;
  }
  return summary;
}

export interface ExpectedTarget {
  skill: DisplaySkill;
  band: string;
  phase: string;
  nextPhase: string;
}

export interface ExpectedNextStep {
  studentId: string;
  firstName: string;
  vocabulary: ExpectedTarget | null;
  comprehension: ExpectedTarget | null;
}

/** One row per scored student; each pill is the student's limiting subskill in that strand with their CURRENT band and the NEXT phase. */
export function expectedNextSteps(rows: readonly RosterRow[]): ExpectedNextStep[] {
  const means = classMeans(rows);
  const target = (result: ResultView, strand: TeachingStrandName): ExpectedTarget | null => {
    const skill = limitingSkill(result, strand, means);
    const band = skill === null ? null : reading(result, skill).status;
    if (skill === null || band === null || !(band in TEACHING_BAND_RANK)) return null;
    return {
      skill,
      band,
      phase: TEACHING_PHASE_BY_RANK[TEACHING_BAND_RANK[band as keyof typeof TEACHING_BAND_RANK]],
      nextPhase: TEACHING_NEXT_PHASE[TEACHING_BAND_RANK[band as keyof typeof TEACHING_BAND_RANK]],
    };
  };
  return rows.flatMap((row) => {
    if (row.result === null) return [];
    const scored =
      row.result.overall.domain_score !== null ||
      displaySkillSchema.options.some((skill) => reading(row.result as ResultView, skill).score !== null);
    if (!scored) return [];
    const vocabulary = target(row.result, 'vocabulary');
    const comprehension = target(row.result, 'comprehension');
    // No banded vocabulary or comprehension subskill → no next-step row (nothing to prompt).
    if (vocabulary === null && comprehension === null) return [];
    return [{
      studentId: row.student.document_id,
      firstName: row.student.name.trim().split(/\s+/)[0] ?? '',
      vocabulary,
      comprehension,
    }];
  });
}

/** The header summary's five counts: three strand group counts, pair count and scored-student count. */
export function expectedSummaryCounts(rows: readonly RosterRow[]): { v: number; c: number; f: number; p: number; n: number } {
  const groups = expectedStrandGroups(rows);
  const skill = expectedLargestGapSkill(rows);
  return {
    v: groups.vocabulary.length,
    c: groups.comprehension.length,
    f: groups.foundations.length,
    p: skill === null ? 0 : expectedPairCount(rows, skill),
    n: expectedNextSteps(rows).length,
  };
}

/** The pair rows the tab renders on one skill: strongest leads weakest, gap >= 12, at most 4 pairs. */
export function expectedPairs(rows: readonly RosterRow[], skill: DisplaySkill): { lead: string; learner: string }[] {
  const ranked = rows
    .filter((row) => row.result !== null)
    .flatMap((row) => {
      const { score } = reading(row.result as ResultView, skill);
      const first = row.student.name.trim().split(/\s+/)[0] ?? '';
      return score === null ? [] : [{ first, score }];
    })
    .sort((a, b) => b.score - a.score);
  const pairs: { lead: string; learner: string }[] = [];
  let support = ranked.length - 1;
  for (let strong = 0; strong < support && pairs.length < PAIR_MAX; strong += 1) {
    if (ranked[strong].score - ranked[support].score >= PAIR_MIN_GAP) {
      pairs.push({ lead: ranked[strong].first, learner: ranked[support].first });
    }
    support -= 1;
  }
  return pairs;
}
