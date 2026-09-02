import { afterEach, describe, expect, it } from 'vitest';

import { roleCredentials, requireEnv } from '../e2e/helpers/credentials';

/**
 * Lane J (orchestrator assignment, task 067): the shared credentials module must
 * FAIL LOUDLY, naming the variable, when a credential is missing — never fall
 * back to a captured literal that produces an HTTP 400 from the server.
 *
 * The sibling schooltest-api/.env is loaded at import, so to prove the failure
 * we must DELETE the vars AFTER import (otherwise the loader would repopulate
 * them and defeat the probe — the orchestrator's own documented mistake).
 */
const E2E_VARS = [
  'E2E_OPS_EMAIL',
  'E2E_OPS_PASSWORD',
  'E2E_SCHOOL_ADMIN_EMAIL',
  'E2E_SCHOOL_ADMIN_PASSWORD',
  'E2E_SCHOOL_ADMIN_B_EMAIL',
  'E2E_SCHOOL_ADMIN_B_PASSWORD',
  'E2E_TEACHER_EMAIL',
  'E2E_TEACHER_PASSWORD',
  'E2E_TEACHER2_EMAIL',
  'E2E_TEACHER2_PASSWORD',
  'E2E_PARENT_EMAIL',
  'E2E_PARENT_PASSWORD',
  'SEED_ADMIN_PASSWORD',
  'SEED_SCHOOLADMIN_A_PASSWORD',
  'SEED_SCHOOLADMIN_B_PASSWORD',
  'SEED_TEACHER_PASSWORD',
  'SEED_PARENT_PASSWORD',
] as const;

const SAVED = new Map<string, string | undefined>();

function unsetAllCredentials(): void {
  for (const key of E2E_VARS) {
    SAVED.set(key, process.env[key]);
    delete process.env[key];
  }
}

afterEach(() => {
  for (const key of E2E_VARS) {
    const saved = SAVED.get(key);
    if (saved === undefined) delete process.env[key];
    else process.env[key] = saved;
  }
  SAVED.clear();
});

describe('roleCredentials fails loudly when a credential is missing', () => {
  it('throws naming E2E_TEACHER_PASSWORD when both E2E and SEED are absent', () => {
    unsetAllCredentials();
    expect(() => roleCredentials('teacher')).toThrow(/E2E_TEACHER_PASSWORD/);
  });

  it('throws for every role, always naming its exact env var', () => {
    unsetAllCredentials();
    for (const [role, varName] of [
      ['ops', 'E2E_OPS_PASSWORD'],
      ['schoolAdmin', 'E2E_SCHOOL_ADMIN_PASSWORD'],
      ['schoolAdminB', 'E2E_SCHOOL_ADMIN_B_PASSWORD'],
      ['teacher', 'E2E_TEACHER_PASSWORD'],
      ['parent', 'E2E_PARENT_PASSWORD'],
    ] as const) {
      expect(() => roleCredentials(role)).toThrow(new RegExp(varName.replace('.', '\\.')));
    }
  });

  it('treats an EMPTY E2E var as missing (the `??` trap)', () => {
    unsetAllCredentials();
    process.env.E2E_TEACHER_PASSWORD = '';
    expect(() => roleCredentials('teacher')).toThrow(/E2E_TEACHER_PASSWORD/);
  });

  it('prefers the E2E_* shell override over the SEED_* sibling value', () => {
    unsetAllCredentials();
    process.env.E2E_TEACHER_PASSWORD = 'shell-override-pw';
    const cred = roleCredentials('teacher');
    expect(cred.password).toBe('shell-override-pw');
    expect(cred.email).toBe('t2@schooltest.local');
  });

  it('falls back to the seeded SEED_* value from the sibling .env', () => {
    unsetAllCredentials();
    // SEED_* vars are normally loaded from schooltest-api/.env at import; here
    // we restore only the SEED_TEACHER_PASSWORD to simulate that loaded state.
    process.env.SEED_TEACHER_PASSWORD = 'Teacher1234!';
    const cred = roleCredentials('teacher');
    expect(cred.password).toBe('Teacher1234!');
  });

  it('requireEnv rejects empty strings, not just unset ones', () => {
    process.env.PROBE_VAR = '';
    expect(() => requireEnv('PROBE_VAR')).toThrow(/PROBE_VAR/);
    delete process.env.PROBE_VAR;
    expect(() => requireEnv('PROBE_VAR')).toThrow(/PROBE_VAR/);
  });
});
