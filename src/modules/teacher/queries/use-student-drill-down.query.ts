'use client';

import { type ResultView } from '@schooltest/scoring-contracts';

import { useClassResultsQuery } from '@/modules/results/queries/use-class-results.query';
import { useStudentResultQuery } from '@/modules/results/queries/use-student-result.query';

/**
 * The student drill-down, served by the CANONICAL reads (web repoint, pre-24):
 * the class roster (`GET /api/my/students/results?class=`) names the student
 * and carries their latest official result reference, and `GET
 * /api/results/{documentId}` returns that result with `history` — the shared
 * hooks from `modules/results`, so the cache is shared with the other screens
 * on the same reads. The retired C-TR-2 read (`GET
 * /api/teacher/classes/:id/students/:sid`) this hook used to fire is what
 * task 24 turns into a 410.
 *
 * ⚠️ WIRING GAP (until the task-23 API half lands): the v2 strict parse
 * rejects today's stored shape, so a live read lands in the screen's retryable
 * error branch — never a rendering built on the retired shape. Legacy rows
 * keep their v1 shape server-side and are NOT this read's population.
 */

export interface StudentDrillDownData {
  /** Opaque student reference (roster `student.document_id`). */
  studentDocumentId: string;
  /** The roster's display name — already the server's; never a client join. */
  displayName: string;
  /** The student's latest official ResultView, v2 shape, `history` included. */
  view: ResultViewOf;
}

/** The v2 view the shared result read parses. */
type ResultViewOf = ResultView;

export type StudentDrillDownState =
  | { status: 'pending'; refetch: () => void }
  | { status: 'error'; refetch: () => void }
  | { status: 'empty'; refetch: () => void }
  | { status: 'success'; data: StudentDrillDownData; refetch: () => void };

function refetchAll(rosterRefetch: () => void, resultRefetch: () => void): () => void {
  return () => {
    void rosterRefetch();
    void resultRefetch();
  };
}

export function useStudentDrillDownQuery(
  documentId: string,
  studentDocumentId: string,
  enabled = true,
): StudentDrillDownState {
  const roster = useClassResultsQuery(documentId, enabled);
  const row =
    roster.data?.find((candidate) => candidate.student.document_id === studentDocumentId) ?? null;
  const resultDocumentId = row?.result?.document_id ?? null;

  // The ONE canonical result read, enabled only once the roster named the
  // student; a roster row with `result: null` never fires it at all.
  const result = useStudentResultQuery(
    resultDocumentId ?? '',
    Boolean(enabled) && resultDocumentId !== null,
  );
  const resultView = result.data?.kind === 'v2' ? result.data.view : undefined;

  const refetch = refetchAll(roster.refetch, result.refetch);

  const resultPending = resultDocumentId !== null && result.isPending;
  if (roster.isPending || resultPending) return { status: 'pending', refetch };
  if (
    roster.isError ||
    result.isError ||
    roster.data === undefined ||
    result.data?.kind === 'legacy'
  ) {
    return { status: 'error', refetch };
  }
  if (row === null || row.result === null || resultView === undefined) {
    // The student IS on the roster but holds no official Result — the server's
    // own "nothing completed yet", rendered as the empty state.
    return { status: 'empty', refetch };
  }
  return {
    status: 'success',
    data: {
      studentDocumentId,
      displayName: row.student.name,
      view: resultView,
    },
    refetch,
  };
}
