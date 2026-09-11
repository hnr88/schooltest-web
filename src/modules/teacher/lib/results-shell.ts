import {
  DEFAULT_RESULTS_TAB,
  RESULTS_PATH,
  RESULTS_TAB_ORDER,
} from '@/modules/teacher/constants/results.constants';
import { DEFAULT_SKILL_SCOPE, isSkillScopeValue } from '@/modules/teacher/lib/skill-scope';
import type {
  ClassDetailParams,
  ClassDetailPatch,
  ResultsReadCounts,
  ResultsReadStatus,
  ResultsTabValue,
  SkillScopeValue,
} from '@/modules/teacher/types/results-shell.types';

type SearchParamsLike = Pick<URLSearchParams, 'get' | 'toString'>;

/** The design's own key for the Students tab (`v:'results'`, `:3154`) still opens it. */
const RESULTS_TAB_ALIASES = new Map<string, ResultsTabValue>([['results', 'students']]);

/**
 * The class-detail route for a class the teacher owns. `documentId` is the
 * server's `class_document_id` (C-TD-1 / C-TR-1) — never a numeric id, and never
 * assembled anywhere else.
 */
export function classResultsHref(documentId: string): string {
  return `${RESULTS_PATH}/${documentId}`;
}

/**
 * The drill-down route for one student of that class (C-TR-2's own path shape,
 * `classes/:documentId/students/:studentDocumentId`, mirrored in the URL). Both
 * ids are the server's `document_id`s; the Students-tab row link is the only
 * caller and assembles nothing itself.
 */
export function studentResultsHref(classDocumentId: string, studentDocumentId: string): string {
  return `${classResultsHref(classDocumentId)}/students/${studentDocumentId}`;
}

/**
 * Error beats pending beats emptiness — the same precedence the teacher
 * dashboard already uses. `empty` is reported ONLY after the read really
 * succeeded, so "no classes" can never be a loading frame or a swallowed
 * failure wearing an empty state.
 */
export function deriveResultsStatus(counts: ResultsReadCounts): ResultsReadStatus {
  if (counts.isError) return 'error';
  if (counts.isLoading || !counts.isSuccess) return 'loading';
  if (counts.itemCount === 0) return 'empty';
  return 'ready';
}

/**
 * The tab primitive hands its callback an unknown value (a tab value may be any
 * type). This narrows it to the closed six-tab set instead of casting, so an
 * unrecognised value is ignored rather than becoming state.
 */
export function isResultsTabValue(value: unknown): value is ResultsTabValue {
  return typeof value === 'string' && RESULTS_TAB_ORDER.some((tab) => tab === value);
}

/** `?tab=` → a tab of the closed set; an alias maps, anything else is the default tab. */
export function resolveResultsTab(raw: string | null): ResultsTabValue {
  if (raw === null) return DEFAULT_RESULTS_TAB;
  if (isResultsTabValue(raw)) return raw;
  return RESULTS_TAB_ALIASES.get(raw) ?? DEFAULT_RESULTS_TAB;
}

/** `?skill=` → one of the four skills; anything else is Reading. */
export function resolveSkillScope(raw: string | null): SkillScopeValue {
  return isSkillScopeValue(raw) ? raw : DEFAULT_SKILL_SCOPE;
}

/** The class detail's URL state: tab, skill, and the sitting a Monitor link opened. */
export function readClassDetailParams(params: SearchParamsLike): ClassDetailParams {
  const session = params.get('session');
  return {
    tab: resolveResultsTab(params.get('tab')),
    skill: resolveSkillScope(params.get('skill')),
    session: session === null || session === '' ? null : session,
  };
}

function setOrDrop(params: URLSearchParams, key: string, value: string, fallback: string): void {
  if (value === fallback) params.delete(key);
  else params.set(key, value);
}

/**
 * The query string after one tab or skill change. Every other param rides along
 * (`session`, the Students table's own state); a default value drops out.
 */
export function withClassDetailParam(params: SearchParamsLike, patch: ClassDetailPatch): string {
  const next = new URLSearchParams(params.toString());
  if (patch.tab !== undefined) setOrDrop(next, 'tab', patch.tab, DEFAULT_RESULTS_TAB);
  if (patch.skill !== undefined) setOrDrop(next, 'skill', patch.skill, DEFAULT_SKILL_SCOPE);
  return next.toString();
}

/**
 * Another class on the same tab and skill. The sitting and the table state
 * belong to the class being left, so they do not travel.
 */
export function switchClassHref(classDocumentId: string, current: ClassDetailParams): string {
  const next = new URLSearchParams();
  if (current.tab !== DEFAULT_RESULTS_TAB) next.set('tab', current.tab);
  if (current.skill !== DEFAULT_SKILL_SCOPE) next.set('skill', current.skill);
  const query = next.toString();
  return query ? `${classResultsHref(classDocumentId)}?${query}` : classResultsHref(classDocumentId);
}
