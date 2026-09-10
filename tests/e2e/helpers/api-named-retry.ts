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

/**
 * TOTAL time the retry chain may spend, and the hook timeout every adopting
 * spec MUST configure.
 *
 * WHY THIS NUMBER EXISTS (orchestrator's spec error, ops/12's finding):
 * Playwright's default `beforeAll` hook timeout is 30s. This helper's budget
 * is 175s across 4 attempts. A 175s budget inside a 30s hook means the hook
 * dies before any classification runs — so 'WEDGED' / 'API BOOT STOP' /
 * 'RATE-LIMITED (429)' become structurally unreachable and every environment
 * fault reads as an opaque hang. The adopting spec must raise its hook
 * timeout to at least HOOK_TIMEOUT_MS (exported alongside) or the named
 * classes are dead code.
 */
export const TOTAL_BUDGET_MS = 175_000;

/**
 * The hook timeout every spec adopting this helper must configure for its
 * `beforeAll` (via `test.setTimeout(HOOK_TIMEOUT_MS)` inside the hook, or
 * `test.describe.configure({ timeout })`), with headroom above
 * TOTAL_BUDGET_MS. See TOTAL_BUDGET_MS for the failure this prevents.
 */
export const HOOK_TIMEOUT_MS = 240_000;

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
  /** 'wedged' = the watcher parked after a clean shutdown and ignores change events. 'supervisor-churn' = something outside the fleet is relaunching the API. 'boot-stop' = failing to come up, escalate. 'restart-window' = child just replaced, retry after the wait. 'serving' = fine. */
  state: 'serving' | 'restart-window' | 'boot-stop' | 'wedged' | 'supervisor-churn';
  /** The measured evidence: child etimes, log lines, health code. */
  evidence: string;
}

const API_BASE_DEFAULT = 'http://127.0.0.1:5500';

/**
 * ops/20's envstate technique (fleet standing rule): a `pgrep -f` SUBSTRING
 * match matches its own command line and every shell carrying the string —
 * three samples then show phantom churn on a healthy API. Filter by
 * `/proc/<pid>/comm` (the process NAME), require `cwd` = `schooltest-api`,
 * and explicitly exclude our own pid and our parent.
 *
 * ORDER MATTERS, and it is why the checks are stacked in this sequence:
 * `comm` does the EXCLUDING (a `bash -c` shell carrying the search string has
 * comm 'bash', not 'node', so the self-match trap is dead before the cmdline
 * is ever consulted) — and the cmdline contains() only NARROWS what survives.
 * A peer's typecheck / vitest / playwright invocation in schooltest-api is
 * also `comm == 'node'` with this cwd, which is why the positive `strapi`
 * cmdline requirement exists: without it, short-lived tool processes would
 * legitimately change the supervisor set between samples and fabricate
 * 'supervisor-churn' on a healthy API. Do not "simplify" by dropping either
 * gate.
 */
function findStrapiSupervisors(selfPid: number): string[] {
  const parentPid = process.ppid ? String(process.ppid) : '';
  let all: string[] = [];
  try {
    all = execSync('ls /proc 2>/dev/null', { encoding: 'utf8' })
      .split('\n')
      .map((entry) => entry.trim())
      .filter((entry) => /^\d+$/.test(entry));
  } catch {
    return [];
  }
  const supervisors: string[] = [];
  for (const pid of all) {
    if (pid === String(selfPid) || pid === parentPid) continue;
    try {
      const comm = execSync(`cat /proc/${pid}/comm 2>/dev/null`, { encoding: 'utf8' }).trim();
      if (comm !== 'node') continue;
      const cwd = execSync(`readlink /proc/${pid}/cwd 2>/dev/null`, { encoding: 'utf8' }).trim();
      if (!cwd.endsWith('/schooltest-api')) continue;
      const cmdline = execSync(`tr '\\0' ' ' < /proc/${pid}/cmdline 2>/dev/null`, {
        encoding: 'utf8',
      });
      if (!cmdline.includes('strapi')) continue;
      // A `strapi develop` supervisor is long-lived; a candidate only a few
      // seconds old is a transient tool (typecheck, vitest, playwright) and
      // will vanish by the next sample. These are tools, not supervisors.
      const etimes = Number(execSync(`ps -o etimes= -p ${pid} 2>/dev/null`, { encoding: 'utf8' }).trim());
      if (Number.isFinite(etimes) && etimes < 45) continue;
      supervisors.push(pid);
    } catch {
      // The process vanished mid-scan — it was never a candidate.
    }
  }
  return supervisors;
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
function sampleOnce(apiBase: string, supervisors: string[]): ApiState {
  const health = healthOnce(apiBase);
  if (health.startsWith('2')) {
    return { serving: true, state: 'serving', evidence: `health=${health}` };
  }

  const childAges = supervisors.flatMap((supervisor) => childAgesOf(supervisor));
  const ages =
    childAges.length > 0 ? `child etimes [${childAges.join(', ')}s]` : 'no watcher children';
  let evidence = `health=${health || '000'}; supervisors=[${supervisors.join(', ')}]; ${ages}`;

  let logLines = '';
  for (const supervisor of supervisors) {
    try {
      const firstChild = execSync(`pgrep -P ${supervisor} 2>/dev/null | head -1`, {
        encoding: 'utf8',
      }).trim();
      if (firstChild === '') continue;
      // readlink -f resolves the REAL log file on disk — it survives every
      // child respawn, which is exactly when the evidence is needed. Newer
      // processes may report a pipe instead of a path; branch on the result.
      const logFile = execSync(`readlink -f /proc/${firstChild}/fd/1 2>/dev/null`, {
        encoding: 'utf8',
      }).trim();
      if (logFile.startsWith('/')) {
        logLines = execSync(`tail -c 2000 '${logFile}' 2>/dev/null`, { encoding: 'utf8' });
        break;
      }
    } catch {
      // Try the next child / fall back to the newest relaunch log.
    }
  }
  if (logLines === '') logLines = watcherLogTail();

  const crashLine = logLines
    .split('\n')
    .find((line) => /ReferenceError|has been shut down|TypeScript compilation failed|Error:/i.test(line));

  if (crashLine !== undefined) {
    return {
      serving: false,
      state: 'boot-stop',
      evidence: evidence + `; watcher log: ${crashLine.trim()}`,
    };
  }
  return { serving: false, state: 'restart-window', evidence };
}

/**
 * ops/12 (orchestrator-directed): classify the down-state of the shared
 * :5500 watcher — FOUR states with FOUR different cures:
 *  - RESTART WINDOW: a young child was just replaced; recovers in 20-30s —
 *    wait 15s and retry.
 *  - BOOT STOP: an old child (or none) with a crash line in the watcher log —
 *    the process keeps retrying the identical crash. Throw named, escalate.
 *  - WEDGED: the log shows a CLEAN shutdown ("Strapi has been shut down")
 *    with no error line inside a live watcher, and the tree compiles — the
 *    watcher is parked and ignores change events. Remedy: an orchestrator
 *    restart, not a retry. Throw named, escalate.
 *  - SUPERVISOR CHURN: the supervisor pid itself changes between samples —
 *    something OUTSIDE this fleet is relaunching the API. Escalate.
 */
export function classifyDownState(input: {
  supervisors: readonly string[];
  childAges: readonly number[];
  logTail: string;
}): Extract<ApiState['state'], 'restart-window' | 'boot-stop' | 'wedged'> {
  const shutDown = /Strapi has been shut down/i.test(input.logTail);
  const crash = /ReferenceError|TypeScript compilation failed|\bError:/i.test(input.logTail);
  // A clean shutdown with NO error line, inside a live watcher, is the WEDGED
  // signature; a crash line is a BOOT STOP regardless of child age.
  if (shutDown && !crash && input.supervisors.length > 0) return 'wedged';
  if (crash) return 'boot-stop';
  if (input.childAges.length > 0 && Math.min(...input.childAges) >= 40) return 'boot-stop';
  return 'restart-window';
}

/**
 * ops/12 (orchestrator-directed): certify the shared :5500 before a lane run.
 * ONE health request; if it answers, this returns immediately — the churn
 * sampling never runs on a healthy API. If the API is down, the supervisor
 * pid is sampled three times ~20s apart (process-table only, no API load):
 * a CHANGING pid is supervisor churn from an outside relauncher, and a
 * stable one is classified from children and watcher log. Negative control:
 * on a stable single supervisor the classifier can never return
 * 'supervisor-churn' — churn requires a measured pid change.
 */
export async function certifyApiState(
  apiBase = API_BASE_DEFAULT,
  opts?: { samples?: number; gapMs?: number },
): Promise<ApiState> {
  const first = sampleOnce(apiBase, findStrapiSupervisors(process.pid));
  if (first.serving) return first;

  const samples = opts?.samples ?? 3;
  const gapMs = opts?.gapMs ?? 20_000;
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const pidSeries: string[] = [findStrapiSupervisors(process.pid).join(',')];
  for (let i = 1; i < samples; i += 1) {
    await sleep(gapMs);
    pidSeries.push(findStrapiSupervisors(process.pid).join(','));
  }
  if (new Set(pidSeries).size > 1) {
    return {
      serving: false,
      state: 'supervisor-churn',
      evidence: `${first.evidence}; supervisor pid series changed: ${pidSeries.join(' -> ')} — something outside this fleet is relaunching the API; a run started into this fails for reasons no retry can fix`,
    };
  }

  const supervisors = findStrapiSupervisors(process.pid);
  const childAges = supervisors.flatMap((supervisor) => childAgesOf(supervisor));
  const state = classifyDownState({
    supervisors,
    childAges,
    logTail: watcherLogTail(),
  });
  return {
    serving: false,
    state,
    evidence: `${first.evidence}; pid series stable: ${pidSeries.join(' == ')}; watcher log tail: ${
      watcherLogTail || ''
    }${''}`,
  };
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
