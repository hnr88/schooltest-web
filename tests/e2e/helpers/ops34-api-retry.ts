import type { APIRequestContext } from '@playwright/test';

import { apiLogin } from './teacher-auth-rail';

// ops/34 (ops/20's snippet + teacher/07's proven numbers, orchestrator-specified)
// — :5500 is `strapi develop`, a WATCHER whose child restarts every few minutes
// under live api-row writes, and an out-of-mission agent also bursts the auth
// limiter. A restart or a 429 landing inside a beforeAll condemns code it never
// exercised, and that failure is indistinguishable from a surface defect unless
// it is LABELLED.
//
// BUDGET ARITHMETIC (orchestrator-specified, teacher/07-proven): 4 attempts, a
// 90s cap raced against each attempt, a 175s total budget inside the adopting
// spec's explicit `test.setTimeout(180_000)`, and a new attempt starts only
// while `elapsed + cap <= budget` — so a slow step can never overrun the hook.
//
// WAITS ARE SHAPED, NOT FIXED: a 429 means RATE-LIMITED — wait the measured
// window (45s; the server's own Retry-After value was 38s when measured);
// connection refused/reset means an API RESTART WINDOW — wait 15s for the
// watcher child. Two faults, two cures; never conflated, never swallowed.

const ATTEMPTS = 4;
const PER_ATTEMPT_CAP_MS = 90_000;
const TOTAL_BUDGET_MS = 175_000;
const RATE_LIMITED_WAIT_MS = 45_000;
const RESTART_WAIT_MS = 15_000;

/** Races the attempt against an explicit cap so a slow step cannot eat the hook. */
function withCap<T>(promise: Promise<T>, capMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`attempt exceeded its ${capMs}ms cap`)), capMs);
    }),
  ]);
}

function classify(error: unknown): { label: string; waitMs: number } {
  const message = error instanceof Error ? error.message : String(error);
  if (/\b429\b|rate.?limit/i.test(message)) {
    return { label: 'RATE-LIMITED (429)', waitMs: RATE_LIMITED_WAIT_MS };
  }
  if (/ECONNREFUSED|ECONNRESET|ERR_CONNECTION|network/i.test(message)) {
    return { label: 'API RESTART WINDOW (connection refused/reset)', waitMs: RESTART_WAIT_MS };
  }
  return { label: 'transient error', waitMs: RESTART_WAIT_MS };
}

export async function apiLoginRetried(
  request: APIRequestContext,
  who: 'teacher',
): Promise<string> {
  const startedAt = Date.now();
  let lastError: unknown = null;
  let lastLabel = 'no attempt completed';
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    const elapsed = Date.now() - startedAt;
    if (elapsed + PER_ATTEMPT_CAP_MS > TOTAL_BUDGET_MS) break;
    try {
      return await withCap(apiLogin(request, who), PER_ATTEMPT_CAP_MS);
    } catch (error) {
      lastError = error;
      const { label, waitMs } = classify(error);
      lastLabel = label;
      console.log(`[ops/34] auth attempt ${attempt}/${ATTEMPTS} failed — ${label}; waiting ${waitMs}ms`);
      const remaining = TOTAL_BUDGET_MS - (Date.now() - startedAt);
      if (attempt < ATTEMPTS && remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, remaining)));
      }
    }
  }
  throw new Error(
    `[ops/34] could not authenticate after ${ATTEMPTS} attempts — this is an ENVIRONMENT failure ` +
      `(${lastLabel}), NOT a failure of the surface under test. Last error: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
  );
}
