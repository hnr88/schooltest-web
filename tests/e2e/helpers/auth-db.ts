/**
 * Postgres probe helpers (task 020) — DB-side proof via the real `psql` CLI
 * (execFileSync) against the dev database on 127.0.0.1:5540, mirroring the
 * api-side task-008 helper. Connection values are read at runtime from
 * `schooltest-api/.env` (never hardcoded guesses). Scope discipline: reads
 * everywhere; writes ONLY the sanctioned test-hygiene paths on
 * `auth_email_requests` (expiry backdate + throwaway-email cleanup).
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const API_ENV_PATH = path.resolve(process.cwd(), '..', 'schooltest-api', '.env');

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

/** Run one SQL statement through psql; returns trimmed tuples-only output. */
export function runSql(sql: string): string {
  const out = execFileSync(
    'psql',
    [
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
    ],
    { env: { ...process.env, PGPASSWORD: apiEnv('DATABASE_PASSWORD') }, encoding: 'utf8' },
  );
  return out.trim();
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
  return Number.parseInt(moved, 10);
}

/** Test hygiene: drop the budget rows a throwaway e2e email created (afterAll). */
export function deleteAuthEmailRows(email: string): number {
  const deleted = runSql(
    `with gone as (
       delete from auth_email_requests where email = ${literal(email.toLowerCase())} returning 1
     ) select count(*) from gone`,
  );
  return Number.parseInt(deleted, 10);
}

/** up_users.reset_password_token for one user ('' → null); user must exist. */
export function userResetToken(email: string): string | null {
  const out = runSql(
    `select coalesce(reset_password_token, '') from up_users
     where email = ${literal(email.toLowerCase())}`,
  );
  return out || null;
}

/** Linked role type for one user (D20: the parent grant lands post-response). */
export function userRoleType(email: string): string | null {
  const out = runSql(
    `select coalesce(r.type, '') from up_users u
     left join up_users_role_lnk l on l.user_id = u.id
     left join up_roles r on r.id = l.role_id
     where u.email = ${literal(email.toLowerCase())}`,
  );
  return out || null;
}
