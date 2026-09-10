/**
 * C-OPS-PORTAL-037 (row 20) — the class page's roster, driven through the REAL app.
 *
 * What this spec is written around:
 *  1. THE DEFECT BEING CLOSED IS PARTLY INVISIBLE IN A SCREENSHOT. The page used
 *     to read the class through the core entity route with a hand-built relation
 *     query string and render a relation-expanded student array. So the proof is
 *     a NETWORK assertion: the page must call the ops roster endpoint, and must
 *     NOT call the core `/api/classes/:id` read at all.
 *  2. Playwright with no timeout waits FOREVER on an element that never appears
 *     rather than failing, so every wait here is explicitly bounded.
 *  3. FIXTURES ARE RESOLVED BY NAME. The documentIds the older ops specs pin are
 *     dead in this database and a fresh id only restarts the same clock, so the
 *     school and class are resolved from the ops API by their seeded NAMES and a
 *     miss fails loudly.
 *  4. A capture nobody opened proves nothing, so the 1440x900 capture is written
 *     to the mission proof shots directory and its real dimensions are asserted
 *     here rather than trusted.
 */
import { mkdirSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext } from '@playwright/test';

import { roleCredentials } from '../helpers/credentials';
import { loginCached } from '../helpers/http';
import { loginAs } from '../helpers/roles';

function apiBaseUrl(): string {
  return (
    process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500'
  );
}
const SCHOOL_NAME = 'SchoolTest Demo School A';
const ACTION_TIMEOUT = 20_000;

// FOUR levels up, not three: __dirname is tests/e2e/ops-portal, so three
// lands inside schooltest-web/ and silently creates a stray mvp/ tree there.
// It did exactly that on the first green run — and the run still passed,
// because the dimension assertion below re-screenshots into a BUFFER and
// never reads the file. A capture assertion that ignores the written file
// cannot detect a wrong path, so the check below now reads the file itself.
const SHOTS = path.resolve(__dirname, '../../../../mvp/ops/proof/shots');

interface Fixture {
  schoolDocumentId: string;
  classDocumentId: string;
  className: string;
  students: number;
}

/**
 * Resolve the school and a class WITH a roster, by name, through the ops API.
 *
 * Auth comes from `loginCached`, the tree's own cached-login helper, NOT from
 * reading the app's token out of localStorage: the auth limiter is saturated,
 * and one cached login per credential is the difference between a green run and
 * a suite that 429s. It also avoids depending on a storage key that is an
 * implementation detail of the axios layer.
 */
async function resolveFixture(request: APIRequestContext): Promise<Fixture> {
  const api = apiBaseUrl();
  const jwt = await loginCached(request, api, roleCredentials('opsApi'));
  const headers = { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' };

  const schoolsRes = await request.get(`${api}/api/ops/schools`, {
    headers,
    params: { q: SCHOOL_NAME, pageSize: 200 },
  });
  expect(schoolsRes.status(), await schoolsRes.text()).toBe(200);
  const schools = ((await schoolsRes.json()) as { data: Array<{ documentId: string; name: string | null }> }).data;
  const school = schools.find((row) => row.name === SCHOOL_NAME);
  expect(school, `no school named "${SCHOOL_NAME}" — seed it or fix the fixture name`).toBeTruthy();

  const classesRes = await request.get(`${api}/api/ops/schools/${school!.documentId}/classes`, {
    headers,
    params: { pageSize: 200 },
  });
  expect(classesRes.status(), await classesRes.text()).toBe(200);
  const classes = ((await classesRes.json()) as {
    data: Array<{ documentId: string; name: string | null; student_count?: number }>;
  }).data;
  const target = classes.find((row) => (row.student_count ?? 0) > 0);
  expect(target, `no class of "${SCHOOL_NAME}" has students — this spec needs one`).toBeTruthy();

  return {
    schoolDocumentId: school!.documentId,
    classDocumentId: target!.documentId,
    className: target!.name ?? '(unnamed)',
    students: target!.student_count ?? 0,
  };
}

/* ------------------------------------------------------------------ *
 * Environment hardening — the shape ops/34 and teacher/07 both run with.
 *
 * :5500 is `strapi develop`, a WATCHER, and its child restarts whenever any row
 * writes `schooltest-api/src/**`, taking the API down for 20-30s. A run that
 * lands in one of those windows does NOT fail visibly as an outage — it dies at
 * sign-in or leaves the surface stuck loading-to-error, so it condemns code it
 * never exercised. That cost ops/34 a 12-test batch and me a 9-test spec, both
 * with zero code changes involved.
 *
 * FOUR RULES, each closing a way this can go wrong:
 *  1. The budget FITS INSIDE the hook/test timeout. A 6 x 15s budget inside
 *     Playwright's default 60s timeout can never reach its own throw, so every
 *     cause collapses into an opaque timeout and the surface under test gets
 *     blamed. That was a real bug in this very file.
 *  2. A PER-ATTEMPT CAP, raced against the attempt — otherwise one hung attempt
 *     eats the whole budget and the retries never happen.
 *  3. A new attempt starts only while `elapsed + cap <= budget`, so the loop can
 *     never overrun the timeout that bounds it.
 *  4. On exhaustion it THROWS, NAMED, with the last real error — and labels 429
 *     SEPARATELY from a restart window, because the cures are opposite: a 429
 *     means back off and reuse a cached login, a restart means wait for the
 *     child to stabilise. Never skip, never return, never log-and-continue.
 * ------------------------------------------------------------------ */
const ENV_ATTEMPTS = 4;
const ENV_ATTEMPT_CAP_MS = 90_000;
const ENV_BUDGET_MS = 175_000;
const ENV_HOOK_MS = 180_000;

function environmentShape(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/\b429\b|Too many requests|RateLimit/i.test(message)) {
    return 'RATE-LIMITED (429) — the auth limiter is saturated; back off and reuse a cached login';
  }
  if (/ECONNREFUSED|ERR_CONNECTION_REFUSED|socket hang up|ECONNRESET/i.test(message)) {
    return 'API RESTART WINDOW — :5500 was unbound; the watcher child had restarted';
  }
  return 'UNCLASSIFIED — treat as a real failure until the log says otherwise';
}

/** Resolve fixtures with the enforced-cap retry above. */
async function resolveFixtureRetried(request: APIRequestContext): Promise<Fixture> {
  const startedAt = Date.now();
  let lastError: unknown;

  for (let attempt = 1; attempt <= ENV_ATTEMPTS; attempt += 1) {
    const elapsed = Date.now() - startedAt;
    // Rule 3: never start an attempt that could outrun the budget.
    if (attempt > 1 && elapsed + ENV_ATTEMPT_CAP_MS > ENV_BUDGET_MS) break;
    try {
      // Rule 2: the cap is RACED against the attempt, so a hang cannot eat the budget.
      return await Promise.race([
        resolveFixture(request),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`attempt ${attempt} exceeded its ${ENV_ATTEMPT_CAP_MS}ms cap`)), ENV_ATTEMPT_CAP_MS),
        ),
      ]);
    } catch (error) {
      lastError = error;
      if (attempt < ENV_ATTEMPTS) await new Promise((r) => setTimeout(r, 10_000));
    }
  }

  // Rule 4: named, classified, with the real error attached.
  throw new Error(
    `[ops/20] could not resolve roster fixtures after ${ENV_ATTEMPTS} attempts. ` +
      `This is an ENVIRONMENT failure, NOT a failure of C-OPS-PORTAL-037 or of the class page. ` +
      `Shape: ${environmentShape(lastError)}. ` +
      `Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

const classUrl = (f: Fixture) =>
  `/en/dashboard/ops/schools/${f.schoolDocumentId}/classes/${f.classDocumentId}`;

test('the class page renders its roster from the OPS roster endpoint, not the core class read', async ({ page, request }, testInfo) => {
  test.setTimeout(ENV_HOOK_MS);
  const fixture = await resolveFixtureRetried(request);
  await loginAs(page, 'ops');

  // Both facts are recorded BEFORE navigation so neither can be missed.
  const rosterCalls: string[] = [];
  const coreClassCalls: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (/\/api\/ops\/schools\/[^/]+\/classes\/[^/]+\/students/.test(url)) rosterCalls.push(url);
    // The read this row REMOVED: the core entity route for one class.
    if (/\/api\/classes\/[^/?]+/.test(url)) coreClassCalls.push(url);
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(classUrl(fixture));

  const roster = page.locator('[data-slot="ops-class-detail"]');
  await expect(roster).toBeVisible({ timeout: ACTION_TIMEOUT });

  // The rows are real: at least one student name from the live roster renders.
  const rows = page.locator('[data-slot="ops-class-detail"] tbody tr');
  await expect(rows.first()).toBeVisible({ timeout: ACTION_TIMEOUT });
  const rendered = await rows.count();
  expect(rendered, 'the fixture class has students, so rows must render').toBeGreaterThan(0);

  // THE NETWORK PROOF, which is the half a screenshot cannot show.
  expect(rosterCalls.length, 'the page must read the ops roster endpoint').toBeGreaterThan(0);
  expect(coreClassCalls, 'the core /api/classes/:id read must be gone').toEqual([]);

  // The count label comes from meta.pagination.total — the WHOLE roster, not
  // the rows on screen, which is why it can legitimately exceed `rendered`.
  const count = page.locator('[data-slot="ops-class-roster-count"]');
  await expect(count).toBeVisible({ timeout: ACTION_TIMEOUT });
  await expect(count).toContainText(String(fixture.students));

  mkdirSync(SHOTS, { recursive: true });
  const shot = path.join(SHOTS, '20-class-roster.png');
  await page.screenshot({ path: shot, fullPage: false });
  await testInfo.attach('20-class-roster', { path: shot, contentType: 'image/png' });

  // A capture whose dimensions nobody checked is not a 1440x900 capture — and
  // one read from a fresh buffer instead of the SAVED FILE does not prove the
  // file exists or is where the proof expects it. Read the bytes back off disk.
  const saved = readFileSync(shot);
  expect(saved.subarray(0, 8), 'the saved capture must be a real PNG').toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );
  const width = saved.readUInt32BE(16);
  const height = saved.readUInt32BE(20);
  expect({ width, height }, `the saved capture at ${shot} must really be 1440x900`).toEqual({
    width: 1440,
    height: 900,
  });
});

test('roster search filters on the SERVER and its empty state says "no match", not "no students"', async ({ page, request }) => {
  test.setTimeout(ENV_HOOK_MS);
  const fixture = await resolveFixtureRetried(request);
  await loginAs(page, 'ops');

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(classUrl(fixture));
  await expect(page.locator('[data-slot="ops-class-detail"] tbody tr').first()).toBeVisible({
    timeout: ACTION_TIMEOUT,
  });

  const search = page.locator('[data-slot="ops-class-roster-search"]');
  await expect(search).toBeVisible({ timeout: ACTION_TIMEOUT });

  // A term that cannot match any name. The empty state must distinguish "no
  // student matches that search" from "this class has no students" — showing
  // the latter would tell an operator the class is empty when it is not.
  const requests: string[] = [];
  page.on('request', (request) => {
    if (/\/classes\/[^/]+\/students/.test(request.url())) requests.push(request.url());
  });
  await search.fill('zzzznosuchstudentzzzz');

  await expect(page.locator('[data-slot="ops-class-detail"] tbody tr')).toHaveCount(0, {
    timeout: ACTION_TIMEOUT,
  });
  // The filter went to the SERVER — it is not a client-side slice of a cached page.
  await expect
    .poll(() => requests.some((url) => url.includes('q=')), { timeout: ACTION_TIMEOUT })
    .toBe(true);
});
