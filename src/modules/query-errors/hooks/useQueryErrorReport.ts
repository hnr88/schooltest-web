'use client';

import { useEffect } from 'react';

import type { QueryErrorState } from '@/modules/query-errors/types/query-error.types';

// A `broken` classification is a real defect (server fault, transport failure or
// response-shape drift) and must leave a trace, not just a red card — the silent
// ZodError was the worst case of the old single `isError` branch. `gone` and
// `forbidden` are expected states and stay quiet.
export function useQueryErrorReport(state: QueryErrorState, error: unknown): void {
  const cause = state.kind === 'broken' ? state.cause : null;
  const status = state.kind === 'broken' ? state.status : undefined;

  useEffect(() => {
    if (!cause) {
      return;
    }
    console.error(`[query-error] ${cause}${status === undefined ? '' : ` ${status}`}`, error);
  }, [cause, status, error]);
}
