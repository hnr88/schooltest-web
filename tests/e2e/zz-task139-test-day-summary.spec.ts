import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, escapeRegExp, icu, loadMessages } from './helpers/i18n';

// Task 139 (st-mvp-pivot) — C-SIT-08 test-day summary panel. Permanent spec:
// a full end-of-test-day flow runs against the live stack (start a sitting,
// mint the code, Sofia joins, Import Beta is marked absent, the sitting
// closes — which terminates Sofia's in-flight session so it reads as sat),
// then the SittingSummaryPanel on the test-day page must render the same five
// counts, code and status the live GET /api/sittings/:documentId/summary
// returns (DOM equals API truth; no network mocks). Sofia is the join actor
// because she is the fixture roster's only active student with both an email
// and a valid year_level; Beta still exercises the absent path. The
// no-sitting case opens a throwaway class (created as school_admin, deleted
// in cleanup) and asserts the panel is absent with no error UI. Fixture
// restored in finally blocks: Beta's absent flag cleared, every sitting
// closed, probe class removed.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = { email: process.env.E2E_TEACHER_EMAIL ?? 'teacher@schooltest.local', password: process.env.E2E_TEACHER_PASSWORD ?? 'Teacher1234!' };
const SCHOOL_ADMIN = { email: 'schooladmin-a@schooltest.local', password: process.env.E2E_SCHOOL_ADMIN_PASSWORD ?? 'SchoolAdmin1234!' };
const CLASS_ID = 'x1hat1dy90boz11n9zyphoan'; // "EAL/D Year 7 - Room 4"
const SOFIA_EMAIL = 'sofia.petrov@schooltest.local'; // joins so close leaves one sat
const BETA_ID = 'zkko2okpnsolmt6m1zg7aqh0'; // Import Beta carries the absent flag
const TEST_DAY_URL = `/en/dashboard/teach/classes/${CLASS_ID}/test-day`;

interface SittingRow {
  documentId: string;
  status: 'open' | 'closed';
}

// C-SIT-08 contract payload.
interface SittingSummary {
  sitting: { documentId: string; code: string | null; status: 'open' | 'closed' };
  sat: number;
  absent: number;
  needs_resit: number;
  results_pending: number;
  results_ready: number;
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(TEACHER.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(TEACHER.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  // late role redirect can never hijack the goto that follows.
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 90_000 });
}

async function listClassSittings(request: APIRequestContext, jwt: string): Promise<SittingRow[]> {
  const res = await fetchWithRetry(() =>
    request.get(
      `${API}/api/sittings?filters[class][documentId][$eq]=${CLASS_ID}&sort=createdAt:desc`,
      { headers: { Authorization: `Bearer ${jwt}` } },
    ),
  );
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { data: SittingRow[] }).data;
}

async function closeOpenSittings(request: APIRequestContext, jwt: string): Promise<void> {
  for (const sitting of await listClassSittings(request, jwt)) {
    if (sitting.status !== 'open') continue;
    const res = await fetchWithRetry(() =>
      request.post(`${API}/api/sittings/${sitting.documentId}/close`, {
        headers: { Authorization: `Bearer ${jwt}` },
      }),
    );
    expect(res.ok()).toBeTruthy();
  }
}

// Teacher create (C-SITTING-CREATE): the server forces status open + null code
// and resolves the form itself — the same body the UI's start button posts.
async function createSitting(request: APIRequestContext, jwt: string): Promise<string> {
  const res = await fetchWithRetry(() =>
    request.post(`${API}/api/sittings`, {
      headers: { Authorization: `Bearer ${jwt}` },
      data: { data: { class_document_id: CLASS_ID, mode: 'progress', skill: 'reading' } },
    }),
  );
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { data: { documentId: string } }).data.documentId;
}

// C-SITTING-MINT: idempotent code mint, bare body (never the entity envelope).
async function mintCode(
  request: APIRequestContext,
  jwt: string,
  sittingDocumentId: string,
): Promise<string> {
  const res = await fetchWithRetry(() =>
    request.post(`${API}/api/sittings/${sittingDocumentId}/code`, {
      headers: { Authorization: `Bearer ${jwt}` },
    }),
  );
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { code: string }).code;
}

// C-SIT-06: set/clear Import Beta's absent flag on the sitting.
async function setBetaAbsent(
  request: APIRequestContext,
  jwt: string,
  sittingDocumentId: string,
  absent: boolean,
): Promise<void> {
  const res = await fetchWithRetry(() =>
    request.post(`${API}/api/sittings/${sittingDocumentId}/absent`, {
      headers: { Authorization: `Bearer ${jwt}` },
      data: { student_documentId: BETA_ID, absent },
    }),
  );
  expect(res.ok()).toBeTruthy();
}

// C-SIT-01 v2 public join: code + school email (creates the in-flight session).
async function joinAsSofia(request: APIRequestContext, code: string): Promise<void> {
  const res = await fetchWithRetry(() =>
    request.post(`${API}/api/sittings/join`, { data: { code, email: SOFIA_EMAIL } }),
  );
  expect(res.ok()).toBeTruthy();
}

async function closeSitting(
  request: APIRequestContext,
  jwt: string,
  sittingDocumentId: string,
): Promise<void> {
  const res = await fetchWithRetry(() =>
    request.post(`${API}/api/sittings/${sittingDocumentId}/close`, {
      headers: { Authorization: `Bearer ${jwt}` },
    }),
  );
  expect(res.ok()).toBeTruthy();
}

// C-SIT-08: the end-of-test-day rollup the panel renders.
async function getSummary(
  request: APIRequestContext,
  jwt: string,
  sittingDocumentId: string,
): Promise<SittingSummary> {
  const res = await fetchWithRetry(() =>
    request.get(`${API}/api/sittings/${sittingDocumentId}/summary`, {
      headers: { Authorization: `Bearer ${jwt}` },
    }),
  );
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { data: SittingSummary }).data;
}

// Renders a catalog ICU plural template (one/other, =0 fallback) for a count.
function formatPlural(template: string, count: number): string {
  const pick = (selector: string): string | undefined =>
    template.match(new RegExp(`${selector} \\{([^}]*)\\}`))?.[1];
  const body =
    count === 0 ? (pick('=0') ?? pick('other')) : count === 1 ? pick('one') : pick('other');
  if (body === undefined) throw new Error(`Unparseable ICU plural template: ${template}`);
  return body.replaceAll('#', String(count));
}

function summaryPanel(page: Page): Locator {
  return page.locator('[data-slot="sitting-summary"]');
}

// One count cell: the <dt> carries the catalog label, its sibling <dd> the
// number. Asserting the number against the API keeps the spec locale-safe.
function countValue(panel: Locator, label: string): Locator {
  return panel
    .locator('dt')
    .filter({ hasText: new RegExp(`^${escapeRegExp(label)}$`) })
    .locator('xpath=following-sibling::dd');
}

test.describe('C-SIT-08: test-day summary panel vs live API', () => {
  // Serial + generous timeout: rate-limit ride-out budget (helpers/http.ts).
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  test('end-of-day flow: closed sitting rollup renders counts equal to the API', async ({
    page,
    request,
  }) => {
    const jwt = await loginCached(request, API, TEACHER);

    // Arrange: no open sitting left over, a fresh open sitting with a minted
    // code, Sofia joined and Import Beta absent — so close terminates Sofia's
    // session and the rollup reads sat 1 / absent 1.
    await closeOpenSittings(request, jwt);
    const sittingId = await createSitting(request, jwt);
    const code = await mintCode(request, jwt, sittingId);
    await setBetaAbsent(request, jwt, sittingId, false); // reruns stay idempotent
    await joinAsSofia(request, code);
    await setBetaAbsent(request, jwt, sittingId, true);

    try {
      // Act: end the test day, then read the API truth for the final rollup.
      await closeSitting(request, jwt, sittingId);
      const summary = await getSummary(request, jwt, sittingId);
      expect(summary.sitting.status).toBe('closed');
      expect(summary.sitting.code).toBe(code);
      expect(summary.sat).toBe(1); // Sofia's session terminated at close
      expect(summary.absent).toBe(1); // Import Beta

      await signIn(page);
      await page.goto(TEST_DAY_URL);
      const panel = summaryPanel(page);
      await expect(panel).toBeVisible({ timeout: 30_000 });

      // The sitting code line equals the API's sitting.code.
      await expect(
        panel.getByText(icu(cat(en, 'Teach.testDay.summary.codeLine'), { code }), { exact: true }),
      ).toBeVisible();
      // The status pill reads the API's sitting status.
      await expect(
        panel.getByText(cat(en, `TestDay.status.${summary.sitting.status}`), { exact: true }),
      ).toBeVisible();

      // All five counts equal the API numbers, label by label.
      const counts: Array<[string, number]> = [
        [cat(en, 'Teach.testDay.summary.counts.sat'), summary.sat],
        [cat(en, 'Teach.testDay.summary.counts.absent'), summary.absent],
        [cat(en, 'Teach.testDay.summary.counts.needsResit'), summary.needs_resit],
        [cat(en, 'Teach.testDay.summary.counts.resultsPending'), summary.results_pending],
        [cat(en, 'Teach.testDay.summary.counts.resultsReady'), summary.results_ready],
      ];
      for (const [label, value] of counts) {
        await expect(countValue(panel, label)).toHaveText(String(value));
      }

      // The pending note tracks results_pending: shown (plural-rendered) when
      // results are still on their way, absent when none are outstanding.
      const note = panel.getByText(
        formatPlural(cat(en, 'Teach.testDay.summary.pendingNote'), summary.results_pending),
        { exact: true },
      );
      if (summary.results_pending > 0) {
        await expect(note).toBeVisible();
      } else {
        await expect(note).toHaveCount(0);
      }

      // No error surface leaks on the happy path.
      await expect(panel.locator('[role="alert"]')).toHaveCount(0);
    } finally {
      // Tidy: Beta not absent, every sitting for the class closed — the same
      // fixture shape the next run (and other specs) rely on.
      await setBetaAbsent(request, jwt, sittingId, false);
      await closeOpenSittings(request, jwt);
    }
  });

  test('no sitting: panel absent, empty state shows, no error UI', async ({ page, request }) => {
    const jwt = await loginCached(request, API, TEACHER);
    const adminJwt = await loginCached(request, API, SCHOOL_ADMIN);

    // The fixture teacher owns a single class (which always has history), so
    // the no-sitting branch needs a throwaway class: created as school_admin
    // with verify21 assigned (C-CLS-02), deleted again in finally (C-CLS-04).
    const classesRes = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/classes`, {
        headers: { Authorization: `Bearer ${adminJwt}` },
      }),
    );
    expect(classesRes.ok()).toBeTruthy();
    const classes = (
      (await classesRes.json()) as {
        data: Array<{ documentId: string; teachers: Array<{ documentId: string }> }>;
      }
    ).data;
    const fixtureClass = classes.find((entry) => entry.documentId === CLASS_ID);
    const teacherId = fixtureClass?.teachers[0]?.documentId;
    expect(teacherId, 'fixture class should name its teacher').toBeTruthy();

    const createRes = await fetchWithRetry(() =>
      request.post(`${API}/api/schools/me/classes`, {
        headers: { Authorization: `Bearer ${adminJwt}` },
        data: {
          name: `PW139 Probe ${Date.now()}`,
          year_band: '7_9',
          teacher_documentIds: [teacherId],
        },
      }),
    );
    expect(createRes.ok()).toBeTruthy();
    const probeClassId = ((await createRes.json()) as { data: { documentId: string } }).data
      .documentId;

    try {
      await signIn(page);
      await page.goto(`/en/dashboard/teach/classes/${probeClassId}/test-day`);

      // The screen settles into its no-sitting empty state...
      const screen = page.locator('[data-surface="teacher-test-day"]');
      await expect(screen).toBeVisible({ timeout: 30_000 });
      await expect(
        screen.getByText(cat(en, 'TestDay.emptyTitle'), { exact: true }),
      ).toBeVisible({ timeout: 30_000 });

      // ...the summary panel never mounts, and no error UI surfaces (neither
      // an inline alert nor an error toast).
      await expect(summaryPanel(page)).toHaveCount(0);
      await expect(screen.locator('[role="alert"]')).toHaveCount(0);
      await expect(page.locator('[data-sonner-toast][data-type="error"]')).toHaveCount(0);
    } finally {
      const deleteRes = await fetchWithRetry(() =>
        request.delete(`${API}/api/schools/me/classes/${probeClassId}`, {
          headers: { Authorization: `Bearer ${adminJwt}` },
        }),
      );
      expect(deleteRes.ok()).toBeTruthy();
    }
  });
});
