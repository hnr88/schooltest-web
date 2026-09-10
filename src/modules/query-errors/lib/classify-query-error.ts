import { isAxiosError } from 'axios';
import { ZodError } from 'zod';

import type { QueryErrorState } from '@/modules/query-errors/types/query-error.types';

// Read-by-id failures split on the error object, never on `isError`. The parent
// reads filter by owner inside the query, so a deleted / foreign / unknown target
// is deliberately one indistinguishable 404 (non-disclosure) — 400 joins it because
// a malformed documentId is a broken link the user cannot act on. 403 is the role
// check only ("wrong kind of account"), never ownership. Everything else — 5xx,
// transport failure, response-shape drift, and any unrecognised value — stays
// loud: the default is `broken`, never `gone`.
export function classifyQueryError(error: unknown): QueryErrorState {
  if (error instanceof ZodError) {
    return { kind: 'broken', cause: 'contract' };
  }
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === undefined) {
      return { kind: 'broken', cause: 'network' };
    }
    if (status === 400 || status === 404) {
      return { kind: 'gone' };
    }
    if (status === 403) {
      // teacher/04 — D-04. 403 is the role check only ("wrong kind of
      // account"), so it is the forbidden arm, not a dead link. The arm and
      // its six-locale copy already existed in QueryErrorFallback; this flip
      // is what makes them render.
      return { kind: 'forbidden' };
    }
    return { kind: 'broken', cause: 'http', status };
  }
  return { kind: 'broken', cause: 'unknown' };
}
