/**
 * Shared E2E credential resolution for schooltest-web.
 *
 * WHY IT EXISTS: every spec used to pin seed passwords as literal fallbacks
 * (`?? 'Teacher1234!'`, `?? 'Admin1234!'`...). Those specs passed ONLY because
 * the literals happened to match this machine's untracked schooltest-api/.env.
 * On CI, after a rotation, or on a fresh checkout they fail as an HTTP 400 from
 * the server — which reads as a stack problem and sends the reader to the wrong
 * place. `??` also does not catch an EMPTY string, and .env.example ships these
 * vars empty, so a fresh checkout got the 400 rather than an instruction.
 *
 * THE FIX: credentials resolve from the environment and fail LOUDLY, naming the
 * variable. This mirrors schooltest-api/tests/e2e/helpers/env.ts (`requireEnv`),
 * with one deliberate addition: the seeded passwords live in the SIBLING
 * schooltest-api/.env (this repo has no copy of them), so the loader reads that
 * file for the dev-seed fallback and lets a shell E2E_* override win. Missing
 * entirely -> a clear error naming the variable, never a 400 from the server.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

let dotenvLoaded = false;

/**
 * Locate the SIBLING schooltest-api/.env (the source of truth for seed
 * passwords). This repo has no copy of them. Walk up from this file to the web
 * repo root (package.json), then across to ../schooltest-api/.env. On a clean
 * checkout where the sibling does not exist, the walk returns null and the
 * credential resolver FAILS LOUDLY naming the variable — which is the point.
 */
function findSiblingApiEnv(): string | null {
  const here = dirname(__filename);
  let dir = here;
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(resolve(dir, 'package.json'))) {
      const candidate = resolve(dir, '../schooltest-api/.env');
      if (existsSync(candidate)) return candidate;
      return null;
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

/** Load sibling schooltest-api/.env once, merging only keys not already set. */
function loadSiblingDotenv(): void {
  if (dotenvLoaded) return;
  dotenvLoaded = true;
  const envPath = findSiblingApiEnv();
  if (!envPath) return;
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!key || key in process.env) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadSiblingDotenv();

/** Read a required env var or throw with a clear, non-secret message. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[e2e] missing required env var ${name} — set it in the shell or schooltest-api/.env. ` +
        'A missing credential must fail HERE, naming the variable, not as a 400 from the server.',
    );
  }
  return value;
}

export type AppRole =
  | 'ops'
  | 'opsApi'
  | 'schoolAdmin'
  | 'schoolAdminB'
  | 'teacher'
  | 'teacher2'
  | 'student'
  | 'parent';

export interface Credential {
  readonly email: string;
  readonly password: string;
}

/**
 * The role's env var names. E2E_* wins if the shell provides it; otherwise the
 * seeded SEED_* value from the sibling .env is required. No literal fallbacks.
 */
const ROLE_ENV: Record<AppRole, { email: string; password: string; defaultEmail: string }> = {
  ops: {
    email: 'E2E_OPS_EMAIL',
    password: 'E2E_OPS_PASSWORD',
    defaultEmail: 'admin@schooltest.local',
  },
  // The seed's SECOND ops persona (seed-users-data.ts `apiadmin`) — a distinct
  // account on the same role, so ops flows can be proven with either identity.
  opsApi: {
    email: 'E2E_OPS_API_EMAIL',
    password: 'E2E_OPS_API_PASSWORD',
    defaultEmail: 'apiadmin@schooltest.local',
  },
  schoolAdmin: {
    email: 'E2E_SCHOOL_ADMIN_EMAIL',
    password: 'E2E_SCHOOL_ADMIN_PASSWORD',
    defaultEmail: 'schooladmin-a@schooltest.local',
  },
  schoolAdminB: {
    email: 'E2E_SCHOOL_ADMIN_B_EMAIL',
    password: 'E2E_SCHOOL_ADMIN_B_PASSWORD',
    defaultEmail: 'schooladmin-b@schooltest.local',
  },
  teacher: {
    email: 'E2E_TEACHER_EMAIL',
    password: 'E2E_TEACHER_PASSWORD',
    // T2 is the deterministic journey teacher: their class carries the mixed
    // A-only/A+B result shapes required by the documented dashboard, results,
    // progress and drill-down journeys. `teacher@` is the smaller CRUD fixture.
    defaultEmail: 't2@schooltest.local',
  },
  /**
   * A SECOND teacher, in the SAME school as `teacher`. It exists so an
   * ownership refusal can be tested at all: until it was seeded, every class in
   * the database belonged to `teacher`, so no teacher could be refused another
   * teacher's class and specs aliased FOREIGN_TEACHER to `teacher` itself.
   * Same school ON PURPOSE — a teacher in a different school would be refused
   * for TENANCY reasons and the test would prove nothing about OWNERSHIP.
   */
  teacher2: {
    email: 'E2E_TEACHER2_EMAIL',
    password: 'E2E_TEACHER2_PASSWORD',
    defaultEmail: 'teacher2@schooltest.local',
  },
  // student1..student4 share one seed password; student1 is the persona the
  // web-portal smoke covers (the student renderer is a separate surface).
  student: {
    email: 'E2E_STUDENT_EMAIL',
    password: 'E2E_STUDENT_PASSWORD',
    defaultEmail: 'student1@schooltest.local',
  },
  parent: {
    email: 'E2E_PARENT_EMAIL',
    password: 'E2E_PARENT_PASSWORD',
    defaultEmail: 'parent@schooltest.local',
  },
};

/** Seed env name that backs each role's password when E2E_* is absent. */
const ROLE_SEED_PASSWORD: Record<AppRole, string> = {
  ops: 'SEED_ADMIN_PASSWORD',
  opsApi: 'SEED_APIADMIN_PASSWORD',
  schoolAdmin: 'SEED_SCHOOLADMIN_A_PASSWORD',
  schoolAdminB: 'SEED_SCHOOLADMIN_B_PASSWORD',
  teacher: 'SEED_TEACHER_PASSWORD',
  teacher2: 'SEED_TEACHER2_PASSWORD',
  student: 'SEED_STUDENT_PASSWORD',
  parent: 'SEED_PARENT_PASSWORD',
};

/**
 * Resolve a role's email + password. Emails may default to the documented seed
 * identity (public knowledge: seed emails are not secrets); PASSWORDS never
 * default to a literal — they require E2E_* or the seeded SEED_* value, or the
 * helper throws naming the exact variable.
 */
export function roleCredentials(role: AppRole): Credential {
  const env = ROLE_ENV[role];
  const email = process.env[env.email] || env.defaultEmail;
  const seedPasswordVar = ROLE_SEED_PASSWORD[role];
  // Truthy check (not ??): an EMPTY E2E_* or SEED_* var is treated as missing,
  // so it fails with the named variable rather than silently supplying ''.
  const password =
    process.env[env.password] || process.env[seedPasswordVar] || requireEnv(env.password);
  return { email, password };
}

/**
 * The teacher attached to the legacy named class fixture
 * "EAL/D Year 7 - Room 4". Current mission journeys use T2 by default, while
 * the older C-RPT/C-CLS fixtures deliberately remain owned by the seed's base
 * teacher. Tests for that named class must request its owner explicitly.
 */
export function fixtureTeacherCredentials(): Credential {
  return {
    email: process.env.E2E_FIXTURE_TEACHER_EMAIL || 'teacher@schooltest.local',
    password: process.env.E2E_FIXTURE_TEACHER_PASSWORD || requireEnv('SEED_TEACHER_PASSWORD'),
  };
}
