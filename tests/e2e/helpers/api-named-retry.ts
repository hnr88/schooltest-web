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
  /** 'restart-window' = child just replaced, retry after the wait. 'boot-stop' = failing to come up, escalate. 'supervisor-churn' = something outside the fleet is relaunching the API. 'serving' = fine. */
  state: 'serving' | 'restart-window' | 'boot-stop' | 'supervisor-churn';
  /** The measured evidence: child etimes, log lines, health code. */
  evidence: string;
}

const API_BASE_DEFAULT = 'http://127.0.0.1:5500';

function supervisorPid(): string {
  try {
    return execSync("pgrep -f 'strapi develop' | head -1", { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function childAgesOf(supervisor: string): number[] {
  if (supervisor === '') return [];
  try {
    return execSync(`pgrep -P ${supervisor} 2>/dev/null`, { encoding: 'utf8' })
      .split('\n')
      .map((line) => Number(line.trim()))
      .filter((age) => Number.isFinite(age) && age >= 0);
  } catch {
    return [];
  }
}

/**
 * The watcher's stdout is redirected to a REAL FILE on disk (a
 * strapi-relaunch.log) — the file survives every child respawn; the fd does
 * not. Resolve the child's fd/1 to its file with `readlink -f` and read THAT;
 * when no child exists at all, fall back to the newest relaunch log under the
 * CLI temp root. A file proves the crash cause after the process is gone.
 */
function watcherLogTail(): string {
  try {
    const log = execSync(
      "find /tmp/claude-1000 /tmp -maxdepth 6 -name 'strapi-relaunch.log' -mmin -60 2>/dev/null | head -1",
      { encoding: 'utf8' },
    ).trim();
    if (log !== '') {
      return execSync(`tail -c 2000 '${log}' 2>/dev/null`, { encoding: 'utf8' });
    }
  } catch {
    // Fall through to the caller's other evidence.
  }
  return '';
}

/** ONE health request. Never a loop — the limiter is 20/min and probes are load. */
function healthOnce(apiBase: string): string {
  try {
    return execSync(`curl -s -o /dev/null -w '%{http_code}' -m 8 ${apiBase}/_health 2>/dev/null`, {
      encoding: 'utf8',
    }).trim();
  } catch {
    return '000';
  }
}

/** A single sample: health + supervisor children + watcher-log tail. */
function sampleOnce(apiBase: string): ApiState {
  const health = healthOnce(apiBase);
  if (health.startsWith('2')) {
    return { serving: true, state: 'serving', evidence: `health=${health}` };
  }

  const supervisor = supervisorPid();
  const childAges = childAgesOf(supervisor);
  const ages =
    childAges.length > 0 ? `child etimes [${childAges.join(', ')}s]` : 'no watcher children';
  let evidence = `health=${health || '000'}; supervisor=${supervisor || 'none'}; ${ages}`;

  let logLines = '';
  try {
    const firstChild = execSync(`pgrep -P ${supervisor} 2>/dev/null | head -1`, {
      encoding: 'utf8',
    }).trim();
    if (firstChild !== '') {
      // readlink -f resolves the REAL log file on disk — it survives every
      // child respawn, which is exactly when the evidence is needed.
      const logFile = execSync(`readlink -f /proc/${firstChild}/fd/1 2>/dev/null`, {
        encoding: 'utf8',
      }).trim();
      if (logFile.startsWith('/')) {
        logLines = execSync(`tail -c 2000 '${logFile}' 2>/dev/null`, { encoding: 'utf8' });
      }
    }
  } catch {
    // fd/1 unreadable — the child may be gone; the relaunch-log fallback in
    // the caller still applies.
  }
  if (logLines === '') logLines = watcherLogTail();

  const crashLine = logLines
    .split('\n')
    .find((line) => /ReferenceError|has been shut down|TypeScript compilation failed|Error:/i.test(line));

  if (childAges.length > 0 && Math.min(...childAges) >= 40) {
    // An OLD child plus no service: failing to come up, not restarting.
    return {
      serving: false,
      state: 'boot-stop',
      evidence:
        evidence + (crashLine ? `; watcher log: ${crashLine.trim()}` : '; watcher log unreadable'),
    };
  }
  return { serving: false, state: 'restart-window', evidence };
}

/**
 * ops/12 (orchestrator-directed): distinguish THREE down-states of the shared
 * :5500 watcher, because they have three different cures:
 *  - RESTART WINDOW: a young child was just replaced; recovers in 20-30s —
 *    wait 15s and retry.
 *  - BOOT STOP: an old child (or none) with no service — the process is
 *    failing to come up; retrying cannot fix it. Throw named, escalate.
 *  - SUPERVISOR CHURN: the supervisor PID itself changes between samples —
 *    something OUTSIDE this fleet is relaunching the API. No retry can fix
 *    it either; escalate.
 *
 * `ps` proves liveness, NOT serviceability, and the :5500 listener pid never
 * changes across watcher restarts — so the discriminators are the minimum
 * child etimes, the supervisor pid time series, and the child's stdout LOG
 * (a ReferenceError there means STOP AND ESCALATE, do not spend attempts).
 *
 * ONE health request; the supervisor sampling is process-table only. Never
 * more than three samples ~20s apart — a time series, not a probe loop.
 */
export function detectApiState(apiBase = API_BASE_DEFAULT): ApiState {
  return sampleOnce(apiBase);
}

export async function certifyApiState(
  apiBase = API_BASE_DEFAULT,
  samples = 3,
  gapMs = 20_000,
): Promise<ApiState> {
  const first = sampleOnce(apiBase);
  if (first.serving || first.state === 'boot-stop') return first;

  // Down and not yet classified as a boot stop: is the supervisor churning?
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const pids = [supervisorPid()];
  for (let i = 1; i < samples; i += 1) {
    await sleep(gapMs);
    pids.push(supervisorPid());
  }
  if (new Set(pids).size > 1) {
    return {
      serving: false,
      state: 'supervisor-churn',
      evidence: `supervisor pid changed ${pids.join(' -> ')} — something outside this fleet is relaunching the API; a run started into this fails for reasons no retry can fix`,
    };
  }
  // Stable supervisor: one re-classification now that the samples have aged
  // any young child past the restart-window ambiguity.
  return sampleOnce(apiBase);
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
