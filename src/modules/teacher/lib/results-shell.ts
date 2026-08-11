import { RESULTS_PATH, RESULTS_TAB_ORDER } from '@/modules/teacher/constants/results.constants';
import type {
  ResultsReadCounts,
  ResultsReadStatus,
  ResultsTabValue,
} from '@/modules/teacher/types/results-shell.types';

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
 * type). This narrows it to the closed four-tab set instead of casting, so an
 * unrecognised value is ignored rather than becoming state.
 */
export function isResultsTabValue(value: unknown): value is ResultsTabValue {
  return typeof value === 'string' && RESULTS_TAB_ORDER.some((tab) => tab === value);
}
