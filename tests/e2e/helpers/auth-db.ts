/**
 * Postgres probe helpers (task 020) — DB-side proof via the real `psql` CLI
 * (execFileSync) against the dev database on 127.0.0.1:5540, mirroring the
 * api-side task-008 helper. Connection values are read at runtime from
 * `schooltest-api/.env.dev` (falling back to `.env`; never hardcoded guesses). Scope discipline: reads
 * everywhere; writes ONLY the sanctioned test-hygiene paths on
 * `auth_email_requests` (expiry backdate + throwaway-email cleanup).
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

// Stacks whose local dev env lives in schooltest-api/.env.dev (st-mvp-pivot
// STACK.json: `.env` there belongs to the Coolify staging deployment, never to
// be touched) are honoured first; the original single-`.env` layout is the
// fallback so older stacks keep working unchanged.
const API_ENV_CANDIDATES = [
  path.resolve(process.cwd(), '..', 'schooltest-api', '.env.dev'),
  path.resolve(process.cwd(), '..', 'schooltest-api', '.env'),
];
const API_ENV_PATH =
  API_ENV_CANDIDATES.find((candidate) => existsSync(candidate)) ?? API_ENV_CANDIDATES[1];

let cachedEnv: Record<string, string> | null = null;

/** Read one value from schooltest-api/.env (DATABASE_*, SEED_*); throws when missing. */
export function apiEnv(key: string): string {
  if (!cachedEnv) {
    cachedEnv = {};
    for (const line of readFileSync(API_ENV_PATH, 'utf8').split('\n')) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match) cachedEnv[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
  const value = cachedEnv[key];
  if (!value) throw new Error(`[e2e] ${key} missing from schooltest-api/.env`);
  return value;
}

/** sha256 hex of a plaintext token — mirrors the api-side hashToken helper. */
export function sha256(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/** Single-quote a SQL literal (test emails/hashes only — never user input). */
function literal(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * What `runSql` yields when the database cannot be reached AT ALL — no `psql`
 * client and no usable container — as distinct from a query that ran and
 * matched nothing.
 *
 * Returning a marker rather than throwing is what keeps `--list` alive. Roughly
 * thirty specs resolve fixtures at IMPORT time, and Playwright evaluates every
 * spec module during collection, so one unreachable database otherwise collects
 * zero tests for the whole suite. The value is deliberately not a valid
 * documentId: nothing can accidentally pass with it, and any failure message
 * carrying it names its own cause. It is the opposite of a pinned id — it
 * matches no row by construction.
 *
 * A query that RUNS and returns nothing still yields '', so every existing
 * "seed row not found" path stays exactly as loud as it was.
 */
export const UNRESOLVED_FIXTURE_ID = '__e2e-db-unavailable__';

/** Raised by callers that need a real value and got the marker instead. */
export class DatabaseUnavailableError extends Error {
  constructor() {
    super(
      '[e2e] dev database unreachable: no `psql` on PATH and no usable postgres container. ' +
        `Expected ${apiEnv('DATABASE_NAME')} on ${apiEnv('DATABASE_HOST')}:${apiEnv('DATABASE_PORT')}. ` +
        'Start the dev database, install a psql client, or set E2E_PG_CONTAINER.',
    );
    this.name = 'DatabaseUnavailableError';
  }
}

/** Marker in, loud failure out — for run-time callers that need a real value. */
function requireDatabase(value: string): string {
  if (value === UNRESOLVED_FIXTURE_ID) throw new DatabaseUnavailableError();
  return value;
}

const containerChecked = new Map<string, boolean>();

/**
 * Whether a named container exists, probed once. Checking BEFORE running the
 * query is what keeps a real SQL error a real SQL error: an absent container is
 * answered here, so anything `docker exec` throws later is the database talking.
 */
function containerAvailable(name: string): boolean {
  const cached = containerChecked.get(name);
  if (cached !== undefined) return cached;
  let present: boolean;
  try {
    execFileSync('docker', ['inspect', '--type=container', name], { stdio: 'ignore' });
    present = true;
  } catch {
    present = false;
  }
  containerChecked.set(name, present);
  return present;
}

/** Raw executor: the marker when unreachable, otherwise psql's own outcome. */
function execSql(sql: string): string {
  const args = [
    '-h',
    apiEnv('DATABASE_HOST'),
    '-p',
    apiEnv('DATABASE_PORT'),
    '-U',
    apiEnv('DATABASE_USERNAME'),
    '-d',
    apiEnv('DATABASE_NAME'),
    '-v',
    'ON_ERROR_STOP=1',
    '-t',
    '-A',
    '-c',
    sql,
  ];
  const env = { ...process.env, PGPASSWORD: apiEnv('DATABASE_PASSWORD') };
  try {
    return execFileSync('psql', args, { env, encoding: 'utf8' }).trim();
  } catch (error) {
    // Hosts without a psql client (st-mvp-pivot sandbox) reach the same dev
    // database through the compose postgres container's own psql instead.
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    // Overridable: the compose project name is not universal, so the historic
    // default does not exist on every host, and an absent container must never
    // read as "the query ran and failed".
    const container =
      process.env.E2E_PG_CONTAINER ??
      (apiEnv('DATABASE_PORT') === '5540' ? 'schooltest-api-st1-postgres' : '');
    if (!container || !containerAvailable(container)) return UNRESOLVED_FIXTURE_ID;
    return execFileSync(
        'docker',
      [
        'exec',
        '-e',
        `PGPASSWORD=${apiEnv('DATABASE_PASSWORD')}`,
        container,
        'psql',
        '-h',
        '127.0.0.1',
        '-p',
        '5432',
        '-U',
        apiEnv('DATABASE_USERNAME'),
        '-d',
        apiEnv('DATABASE_NAME'),
        '-v',
        'ON_ERROR_STOP=1',
        '-t',
        '-A',
        '-c',
        sql,
      ],
      { encoding: 'utf8' },
    ).trim();
  }
}

/** Cached per process — a schema does not appear mid-run. */
let provisioned: boolean | null = null;

/**
 * Whether the schooltest schema exists at all, probed once.
 *
 * A reachable but UNPROVISIONED database — a fresh container Strapi has not
 * booted against yet — fails every fixture query with `relation "classes" does
 * not exist`. That is the same condition as an absent database for anything
 * resolving fixtures, and it must degrade rather than abort collection.
 *
 * Probed with `to_regclass` rather than by matching error text, so a genuine
 * typo against a PROVISIONED database still throws its real psql error.
 */
function databaseProvisioned(): boolean {
  if (provisioned === null) {
    provisioned = execSql("select to_regclass('public.classes') is not null") === 't';
  }
  return provisioned;
}

/**
 * Run one SQL statement through psql; returns trimmed tuples-only output.
 *
 * Yields the marker when the database is unreachable or unprovisioned; a query
 * that actually runs keeps every outcome it has today, empty result included.
 */
export function runSql(sql: string): string {
  if (!databaseProvisioned()) return UNRESOLVED_FIXTURE_ID;
  return execSql(sql);
}

/**
 * Whether fixture resolution is impossible — no database, or no schema in it.
 *
 * Exported for callers that would rather skip than fail; nothing in this file
 * depends on it.
 */
export function databaseUnavailable(): boolean {
  return !databaseProvisioned();
}

/**
 * C-AUTH-RESET expiry branch: age the issuance row past the 30-min TTL by
 * shifting its created_at back 31 minutes. Returns the number of rows moved
 * (callers assert 1 — the sha256(code) row written by the forgot wrap).
 */
export function backdateResetIssuance(tokenHash: string): number {
  const moved = runSql(
    `with moved as (
       update auth_email_requests set created_at = created_at - interval '31 minutes'
       where token_hash = ${literal(tokenHash)} returning 1
     ) select count(*) from moved`,
  );
  return Number.parseInt(requireDatabase(moved), 10);
}

/** Test hygiene: drop the budget rows a throwaway e2e email created (afterAll). */
export function deleteAuthEmailRows(email: string): number {
  const deleted = runSql(
    `with gone as (
       delete from auth_email_requests where email = ${literal(email.toLowerCase())} returning 1
     ) select count(*) from gone`,
  );
  return Number.parseInt(requireDatabase(deleted), 10);
}

/** up_users.reset_password_token for one user ('' → null); user must exist. */
export function userResetToken(email: string): string | null {
  const out = runSql(
    `select coalesce(reset_password_token, '') from up_users
     where email = ${literal(email.toLowerCase())}`,
  );
  return requireDatabase(out) || null;
}

/** Linked role type for one user (D20: the parent grant lands post-response). */
export function userRoleType(email: string): string | null {
  const out = runSql(
    `select coalesce(r.type, '') from up_users u
     left join up_users_role_lnk l on l.user_id = u.id
     left join up_roles r on r.id = l.role_id
     where u.email = ${literal(email.toLowerCase())}`,
  );
  return requireDatabase(out) || null;
}
