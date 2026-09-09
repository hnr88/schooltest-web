import type { APIRequestContext } from '@playwright/test';
import { execSync } from 'node:child_process';

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

export interface ApiState {
  /** true = the API answered (serviceable). */
  serving: boolean;
  /** 'restart-window' = child just replaced, retry after the wait. 'boot-stop' = failing to come up, escalate. 'serving' = fine. */
  state: 'serving' | 'restart-window' | 'boot-stop';
  /** The measured evidence: child etimes, log lines, health code. */
  evidence: string;
}

/**
 * ops/12 (orchestrator-directed): distinguish an API RESTART WINDOW (child
 * just replaced by the watcher — recovers in 20-30s, retry is correct) from
 * an API BOOT STOP (old child alive + NO service = the process is failing to
 * come up — retrying cannot fix it, the fix is in someone else's file).
 *
 * `ps` proves liveness, NOT serviceability, and the :5500 listener pid never
 * changes across watcher restarts — so the discriminator is the MINIMUM
 * child etimes plus the child's own stdout log (a ReferenceError there means
 * STOP AND ESCALATE, do not spend attempts).
 *
 * ONE health request; no probe loop.
 */
export function detectApiState(apiBase = 'http://127.0.0.1:5500'): ApiState {
  let health = '';
  try {
    health = execSync(
      `curl -s -o /dev/null -w '%{http_code}' -m 8 ${apiBase}/_health 2>/dev/null`,
    ).toString().trim();
  } catch {
    health = '000';
  }
  if (health.startsWith('2')) {
    return { serving: true, state: 'serving', evidence: `health=${health}` };
  }

  // No service. Find the strapi develop supervisor and enumerate ALL children.
  let childAges: number[] = [];
  let logLines = '';
  try {
    const supervisor = execSync("pgrep -f 'strapi develop' | head -1", { encoding: 'utf8' }).trim();
    if (supervisor !== '') {
      const children = execSync(`pgrep -P ${supervisor} 2>/dev/null`, { encoding: 'utf8' })
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      for (const child of children) {
        const etimes = execSync(`ps -o etimes= -p ${child} 2>/dev/null`, { encoding: 'utf8' })
          .trim();
        if (etimes !== '') childAges.push(Number(etimes));
        // The child's stdout is the watcher log — the confirmation is the LOG,
        // not the port. fd/1 may be a pipe; only read regular files.
        try {
          const fd1 = execSync(`readlink /proc/${child}/fd/1 2>/dev/null`, { encoding: 'utf8' })
            .trim();
          if (fd1.startsWith('/')) {
            logLines += execSync(`tail -c 2000 '${fd1}' 2>/dev/null`, { encoding: 'utf8' });
          }
        } catch {
          // fd/1 unreadable — the ages and health code still decide.
        }
      }
    }
  } catch {
    // Process enumeration is best-effort; the health code already decided.
  }

  const ages = childAges.length > 0 ? `child etimes [${childAges.join(', ')}s]` : 'no children';
  const evidence = `health=${health || '000'}; ${ages}`;

  if (childAges.length > 0 && Math.min(...childAges) >= 40) {
    // An OLD child plus no service: failing to come up, not restarting.
    const crashLine = logLines
      .split('\n')
      .find((line) => /ReferenceError|has been shut down|Error:/i.test(line));
    return {
      serving: false,
      state: 'boot-stop',
      evidence:
        evidence +
        (crashLine ? `; watcher log: ${crashLine.trim()}` : '; watcher log unreadable'),
    };
  }
  // A young (or absent) child is the ordinary watcher restart window.
  return { serving: false, state: 'restart-window', evidence };
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
