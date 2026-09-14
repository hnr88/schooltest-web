import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { expect, test } from '@playwright/test';

// RE-POINTED for the landing redesign. The redesigned expression-of-interest
// form is CLIENT-SIDE ONLY: it confirms in place and fires no network call
// (inverting the old Lane-J headline — the browser no longer POSTs). The
// public endpoint itself is still live and keeps its contract, so this suite
// now proves BOTH halves honestly:
//   1. the UI form submits with ZERO API traffic and renders the success card;
//   2. the real endpoint still persists a real Postgres row, returns the
//      constant `{received:true}`, and dedups silently (row count stays at 1).

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

test('landing EOI form is client-side; the public endpoint still persists, dedups, no oracle', async ({
  page,
  request,
}) => {
  const runId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const email = `lanej-e2e-${runId}@schooltest.local`;
  const name = `E2E Registrant ${runId}`;
  const school = `E2E Pilot School ${runId}`;

  // --- 1. The real browser flow: fill the real form, submit. The redesigned
  // form confirms client-side and fires ZERO requests to the submit endpoint.
  let posts = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/pilot-registrations/submit')) posts += 1;
  });
  await page.goto('/');
  await page.locator('#register').scrollIntoViewIfNeeded();
  await page.getByLabel('Your name', { exact: true }).fill(name);
  await page.getByLabel('School', { exact: true }).fill(school);
  await page.getByLabel('Your role', { exact: true }).selectOption({ label: 'Head of department' });
  await page.getByLabel('Work email', { exact: true }).fill(email);
  await page.getByLabel('Number of students', { exact: true }).selectOption({ label: '21–50' });
  await page.getByRole('button', { name: 'Submit expression of interest', exact: true }).click();
  await expect(page.getByText('Expression of interest received')).toBeVisible();
  expect(posts, 'the redesigned form is client-side by design').toBe(0);

  // --- 2. The public endpoint is still the persistence path: one direct POST
  // lands exactly one real Postgres row, every field as submitted.
  const first = await request.post(`${API}/api/pilot-registrations/submit`, {
    data: { name, school, role: 'Head of department', email, students: '21–50' },
  });
  expect(first.status()).toBe(200);
  expect(await first.json()).toEqual({ data: { received: true }, meta: {} });

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
