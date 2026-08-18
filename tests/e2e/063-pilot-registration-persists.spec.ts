import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { expect, test } from '@playwright/test';

// Lane J (headline: kill the fake RegisterFormCard): the landing "register
// your interest" form must POST to the real public endpoint and persist a real
// Postgres row. No mocks — the browser submission goes through the running web
// app into the running Strapi, and the row is asserted IN THE DATABASE
// (mission §6: assert database rows, not just UI text) via read-only psql on
// the dev stack. The public response is the constant `{received:true}` — no
// existence oracle — so dedup is proven by ROW COUNT staying at 1, not by any
// response difference.

const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:5500';
const run = promisify(execFile);

// Dev Postgres credentials come from schooltest-api/.env at RUNTIME — never
// committed (rule 18). E2E_PG_PASSWORD overrides for non-standard stacks.
const PG_PASSWORD =
  process.env.E2E_PG_PASSWORD ??
  /DATABASE_PASSWORD=(.+)/.exec(
    readFileSync(join(__dirname, '..', '..', '..', 'schooltest-api', '.env'), 'utf8'),
  )?.[1]?.trim();

interface Row {
  name: string;
  school: string;
  role: string;
  email: string;
  students: string;
  triage_status: string;
}

/** Read-only psql against the dev Postgres (schooltest-api/.env credentials). */
async function rowsFor(email: string): Promise<Row[]> {
  const { stdout } = await run('psql', [
    '--no-psqlrc',
    '-h', '127.0.0.1',
    '-p', '5540',
    '-U', 'schooltest',
    '-d', 'schooltest',
    '-t', '-A', '-F', '\x1f',
    '-c',
    `select name, school, role, email, students, triage_status from pilot_registrations where email = '${email}'`,
  ], { env: { ...process.env, PGPASSWORD: PG_PASSWORD } });
  return stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [name, school, role, mail, students, triage] = line.split('\x1f');
      return { name, school, role, email: mail, students, triage_status: triage };
    });
}

test('landing register form persists a real pilot registration, dedups silently, no oracle', async ({
  page,
  request,
}) => {
  const runId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const email = `lanej-e2e-${runId}@schooltest.local`;
  const name = `E2E Registrant ${runId}`;
  const school = `E2E Pilot School ${runId}`;

  // --- 1. The real browser flow: fill the real form, submit, success card
  // renders only after the HTTP round-trip (the old fake fired on any submit).
  await page.goto('/en/eald');
  await page.locator('#register').scrollIntoViewIfNeeded();
  await page.getByPlaceholder('Jane Smith').fill(name);
  await page.getByPlaceholder('School name').fill(school);
  await page.getByLabel('Your role').selectOption({ label: 'Head of department' });
  await page.getByPlaceholder('name@school.edu.au').fill(email);
  await page.getByLabel('Number of EAL/D students').selectOption({ label: '21–50' });
  await page.getByRole('button', { name: 'Register interest' }).click();
  await expect(page.getByText('Thanks for your interest')).toBeVisible();

  // --- 2. Persistence: exactly one real Postgres row, every field as submitted.
  const rows = await rowsFor(email);
  expect(rows.length).toBe(1);
  expect(rows[0]).toMatchObject({
    email,
    name,
    school,
    role: 'Head of department',
    students: '21–50',
    triage_status: 'new',
  });

  // --- 3. The public response is a CONSTANT — no documentId, no dedup flag —
  // so an unauthenticated probe cannot learn whether an address registered.
  const repeat = await request.post(`${API}/api/pilot-registrations/submit`, {
    data: { name, school, role: 'Head of department', email, students: '21–50' },
  });
  expect(repeat.status()).toBe(200);
  expect(await repeat.json()).toEqual({ data: { received: true }, meta: {} });

  // --- 4. Dedup happened silently: still exactly one row after the repeat.
  const rowsAfterRepeat = await rowsFor(email);
  expect(rowsAfterRepeat.length).toBe(1);

  // NOTE: malformed-body 400s and the 429 limiter are proven in
  // schooltest-api/tests/unit/pilot-registration-submit-schema.spec.ts and by
  // the live curl evidence in the task record — repeating a third POST here
  // would trip this spec's own 5/10min/IP route limiter (it shares 127.0.0.1
  // with every other run) and make the spec flaky for no added proof.
});
