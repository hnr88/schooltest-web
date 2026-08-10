import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { teacherExportPath } from '@/modules/teacher/lib/teacher-export';
import { classProgressResponseSchema } from '@/modules/teacher/schemas/teacher-progress.schema';
import {
  classInsightsResponseSchema,
  classStudentsResponseSchema,
  studentDrillDownResponseSchema,
} from '@/modules/teacher/schemas/teacher-result.schema';
import {
  teacherTestSessionsResponseSchema,
  testSessionMonitorResponseSchema,
} from '@/modules/teacher/schemas/teacher-session.schema';
import {
  teacherDashboardResponseSchema,
  teacherErrorSchema,
  teacherTestsResponseSchema,
} from '@/modules/teacher/schemas/teacher.schema';

import { apiEnv, runSql } from './helpers/auth-db';

// Task 030 — the LIVE half of the proof. `teacher-contract-parity.spec.ts` shows
// the eleven query hooks call exactly this set of paths (exact set equality over
// the source); this spec takes the same paths to the REAL Strapi on the port
// `schooltest-web/.env` points the Axios instance at, with a REAL teacher JWT
// minted by the project's own auth path, and asserts what the server answers.
//
// The /api/teacher/** routes are built by a PARALLEL backend track and had not
// landed when this ran, so the honest live result is route-absence — asserted
// precisely rather than glossed: absence must look like 404/405 and must NOT
// look like 401/403, which is what proves the JWT is good and the paths point at
// a server that simply has no such route yet. The 200 arm is written too, so the
// day the routes land this becomes a live conformance test of the mirror.

/** Read one key from the gitignored schooltest-web/.env — never a guessed default. */
function webEnv(key: string): string {
  for (const line of readFileSync(path.resolve(process.cwd(), '.env'), 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && match[1] === key) return match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  throw new Error(`[e2e] ${key} missing from schooltest-web/.env`);
}

/**
 * The base URL `src/lib/axios/strapi.ts` gives the shared instance, loopback
 * pinned to IPv4 for this NODE-side client only. Measured, not guessed: Strapi
 * binds `IPv4 *:5500` while `dns.lookup('localhost')` here returns `::1` first,
 * so Node gets `ECONNREFUSED ::1:5500`. Browsers do happy-eyeballs and are
 * unaffected, so the shipped `.env` is left alone; only the family is pinned.
 */
const API_BASE = (() => {
  const url = new URL(webEnv('NEXT_PUBLIC_API_BASE_URL'));
  if (url.hostname === 'localhost') url.hostname = '127.0.0.1';
  return url.origin;
})();

// Resolved FROM THE DATASTORE by role, so no credential is hardcoded here and
// the sign-in cannot silently target the wrong account.
const TEACHER_EMAIL = runSql(
  `select u.email from up_users u
     join up_users_role_lnk l on l.user_id = u.id
     join up_roles r on r.id = l.role_id
    where r.type = 'teacher' order by u.id limit 1`,
);

const [CLASS_ID, STUDENT_ID] = runSql(
  `select c.document_id, s.document_id from classes c, students s order by c.id, s.id limit 1`,
).split('|');

// `sittings` has no rows yet, so the :documentId slot of the session route
// carries a real Strapi documentId that is not a sitting. An unmounted route is
// answered by the router before any lookup, which is what this sweep measures.
const SITTING_ID = CLASS_ID;

interface ContractParser {
  safeParse: (value: unknown) => { success: boolean; error?: { message: string } };
}

/** `[contract, path, response schema]`; null schema = a Markdown export body. */
type ReadOperation = [string, string, ContractParser | null];

// Every READ-ONLY operation the portal consumes. C-TS-1 and C-TS-4 are
// deliberately absent: CONTRACTS.md "Persistence effects" makes them writes (one
// `sittings` row / a close cascade), and an unattended sweep must not mutate the
// real datastore to prove a route exists. The three export paths are built by the
// module's OWN helper, so the sweep exercises the shipped expression.
const READ_OPERATIONS: ReadOperation[] = [
  ['C-TD-1', '/api/teacher/dashboard', teacherDashboardResponseSchema],
  ['C-TD-2', '/api/teacher/tests', teacherTestsResponseSchema],
  ['C-TS-2', '/api/teacher/test-sessions', teacherTestSessionsResponseSchema],
  ['C-TS-3', `/api/teacher/test-sessions/${SITTING_ID}/monitor`, testSessionMonitorResponseSchema],
  ['C-TR-1', `/api/teacher/classes/${CLASS_ID}/students`, classStudentsResponseSchema],
  [
    'C-TR-2',
    `/api/teacher/classes/${CLASS_ID}/students/${STUDENT_ID}`,
    studentDrillDownResponseSchema,
  ],
  ['C-TR-3', `/api/teacher/classes/${CLASS_ID}/insights`, classInsightsResponseSchema],
  ['C-TR-4', `/api/teacher/classes/${CLASS_ID}/progress`, classProgressResponseSchema],
  ['C-TR-5', teacherExportPath({ kind: 'insights', classDocumentId: CLASS_ID }), null],
  ['C-TR-6', teacherExportPath({ kind: 'progress', classDocumentId: CLASS_ID }), null],
  [
    'C-TR-7',
    teacherExportPath({
      kind: 'student',
      classDocumentId: CLASS_ID,
      studentDocumentId: STUDENT_ID,
    }),
    null,
  ],
];

let jwt = '';

test.beforeAll(async ({ playwright }) => {
  const context = await playwright.request.newContext();
  // The project's own auth path, ONE attempt — never a UI form, never a loop.
  const signIn = await context.post(`${API_BASE}/api/auth/local`, {
    data: { identifier: TEACHER_EMAIL, password: apiEnv('SEED_TEACHER_PASSWORD') },
  });
  expect(signIn.status(), await signIn.text()).toBe(200);
  jwt = ((await signIn.json()) as { jwt?: string }).jwt ?? '';
  await context.dispose();
});

test.describe('teacher contract — the module paths against the REAL Strapi', () => {
  test('the seeded teacher JWT is real and is what authorises the call', async ({ playwright }) => {
    const context = await playwright.request.newContext();
    expect(jwt.length).toBeGreaterThan(0);

    const me = await context.get(`${API_BASE}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(me.status()).toBe(200);
    const identity = (await me.json()) as { email?: string; role?: { type?: string } };
    expect(identity.email).toBe(TEACHER_EMAIL);
    expect(identity.role?.type).toBe('teacher');

    // Same endpoint, no token: the JWT is load-bearing, not decoration.
    const anonymous = await context.get(`${API_BASE}/api/users/me`);
    expect([401, 403]).toContain(anonymous.status());
    await context.dispose();
  });

  test('every read path answers the real server — never 401/403, never 5xx', async ({
    playwright,
  }) => {
    const context = await playwright.request.newContext();
    const observed: string[] = [];

    for (const [contract, routePath, schema] of READ_OPERATIONS) {
      const response = await context.get(`${API_BASE}${routePath}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const status = response.status();
      observed.push(`${contract} ${routePath} -> ${status}`);

      // A good JWT on a real server: absence is a routing answer, not an auth one.
      expect([401, 403], `${contract} auth`).not.toContain(status);
      expect(status, `${contract} server error`).toBeLessThan(500);

      if (status === 200 && schema) {
        // The routes have landed: the live body MUST satisfy the web mirror.
        const parsed = schema.safeParse(await response.json());
        expect(parsed.success, `${contract}: ${parsed.error?.message}`).toBe(true);
      } else {
        // The routes have not landed: the only honest alternative is absence.
        expect([404, 405], contract).toContain(status);
      }
    }

    expect(observed).toHaveLength(READ_OPERATIONS.length);
    console.log(observed.join('\n'));
    await context.dispose();
  });

  test('an absent route answers the error envelope the module mirrors', async ({ playwright }) => {
    const context = await playwright.request.newContext();
    let envelopesChecked = 0;

    for (const [contract, routePath] of READ_OPERATIONS) {
      const response = await context.get(`${API_BASE}${routePath}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (response.status() !== 404) continue;
      const parsed = teacherErrorSchema.safeParse(await response.json());
      expect(parsed.success, `${contract}: ${parsed.error?.message}`).toBe(true);
      envelopesChecked += 1;
    }

    // Guard the guard: a loop that skipped every row would otherwise pass.
    expect(envelopesChecked).toBeGreaterThan(0);
    await context.dispose();
  });
});
