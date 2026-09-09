import type { APIRequestContext } from '@playwright/test';

// ops/12 — the fleet-standard named-failure wrapper, generalised from
// ops/34's ops34-api-retry.ts with the orchestrator-specified numbers so
// school-detail / staff-users / school-activity share ONE implementation.
//
// :5500 is `strapi develop`, a WATCHER whose child restarts under live
// api-row writes, and the shared auth limiter bursts. A restart or a 429
// landing inside a beforeAll condemns code it never exercised, and that
// failure is indistinguishable from a surface defect unless it is LABELLED.
//
// BUDGET ARITHMETIC: 4 attempts, a 90s cap raced against each attempt, a
// 175s total budget inside the adopting spec's explicit hook timeout, and a
// new attempt starts only while `elapsed + cap <= budget` — so a slow step
// can never overrun the hook.
//
// WAITS ARE SHAPED, NOT FIXED: a 429 means RATE-LIMITED — wait the measured
// window (~45s; the server's own Retry-After was 38s when measured);
// connection refused/reset means an API RESTART WINDOW — wait 15s for the
// watcher child. Two faults, two cures; never conflated, never swallowed.

const ATTEMPTS = 4;
const PER_ATTEMPT_CAP_MS = 90_000;
const TOTAL_BUDGET_MS = 175_000;
const RATE_LIMITED_WAIT_MS = 45_000;
const RESTART_WAIT_MS = 15_000;

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

/**
 * Run `attempt` under the named-failure budget. On exhaustion: THROW, named,
 * with the last real error attached — never swallowed, never retried into an
 * opaque timeout. `spec` names the adopting suite so the console line is
 * attributable at a glance.
 */
export async function namedRetry<T>(
  spec: string,
  what: string,
  attempt: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();
  let lastError: unknown = null;
  let lastLabel = 'no attempt completed';
  for (let attemptNo = 1; attemptNo <= ATTEMPTS; attemptNo += 1) {
    const elapsed = Date.now() - startedAt;
    if (elapsed + PER_ATTEMPT_CAP_MS > TOTAL_BUDGET_MS) break;
    try {
      return await withCap(attempt(), PER_ATTEMPT_CAP_MS);
    } catch (error) {
      lastError = error;
      const { label, waitMs } = classify(error);
      lastLabel = label;
      console.log(
        `[${spec}] ${what} attempt ${attemptNo}/${ATTEMPTS} failed — ${label}; waiting ${waitMs}ms`,
      );
      const remaining = TOTAL_BUDGET_MS - (Date.now() - startedAt);
      if (attemptNo < ATTEMPTS && remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, remaining)));
      }
    }
  }
  throw new Error(
    `[${spec}] could not ${what} after ${ATTEMPTS} attempts — this is an ENVIRONMENT failure ` +
      `(${lastLabel}), NOT a failure of the surface under test. Last error: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
  );
}

export type { APIRequestContext };
