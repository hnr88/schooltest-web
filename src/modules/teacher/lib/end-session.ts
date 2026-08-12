import { isAxiosError } from 'axios';

import type { EndSessionFailure } from '@/modules/teacher/types/end-session.types';

/**
 * C-TS-4 rejection -> what the teacher is told.
 *
 * The contract enumerates ONE 400 on this route: "sitting is already closed
 * (E2-11)", raised by the close cascade's own idempotency guard
 * (`api::sitting.lifecycle.close`). It means the sitting IS closed — the outcome
 * the teacher asked for — so it is classified as `already_closed` and reported as
 * information, never as an error.
 *
 * Everything else stays loud and is `failed`: 403 (foreign sitting), 404
 * (unknown sitting), any 5xx, a transport failure, and a response whose shape
 * fails `closeTestSessionResponseSchema`. Nothing here invents a closed state the
 * server never confirmed.
 */
export function classifyEndSessionError(error: unknown): EndSessionFailure {
  if (isAxiosError(error) && error.response?.status === 400) {
    return 'already_closed';
  }
  return 'failed';
}
