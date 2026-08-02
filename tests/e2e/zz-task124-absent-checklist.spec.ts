import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, icu, loadMessages } from './helpers/i18n';

// Task 124 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Absent workflow end to end (mvp-updates §4.5.6, C-SIT-06 + C-SIT-02): the
// teacher marks Sofia absent on the test-day screen, her monitor row restyles
// (muted + "Absent" badge) and the still-to-sit panel drops her with the count
// decremented; the state survives a reload (proving the API, not local state);
// clearing the flag restores the row and the panel, and the monitor payload
// agrees at both ends. Expected copy comes from the en catalog.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = { email: 'verify21@schooltest.local', password: 'Verify21!pw' };
const CLASS_ID = 'x1hat1dy90boz11n9zyphoan'; // "EAL/D Year 7 - Room 4"
const SOFIA_ID = 'kxd4f1r27muoajv7ww18blvp';
const TEST_DAY_URL = `/en/dashboard/teach/classes/${CLASS_ID}/test-day`;

async function login(
  request: APIRequestContext,
  credentials: { email: string; password: string },
): Promise<string> {
  return loginCached(request, API, credentials);
}

async function signIn(page: Page, credentials: { email: string; password: string }): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(credentials.email);
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(credentials.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  // late role redirect can never hijack the goto that follows. The axios
  // layer rides out any 429 on the auth POST, so allow for that here.
  await page.waitForURL('**/dashboard/teach**', { timeout: 90_000 });
}

interface SittingRow {
  documentId: string;
  status: 'open' | 'closed';
}

interface MonitorStudentRow {
  documentId: string;
  given_name: string;
  family_name: string;
  state: string;
  absent: boolean;
  needs_to_sit: boolean;
}

interface MonitorPayload {
  sitting: { documentId: string; status: 'open' | 'closed' };
  students: MonitorStudentRow[];
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

async function closeSitting(
  request: APIRequestContext,
  jwt: string,
  documentId: string,
): Promise<void> {
  const res = await fetchWithRetry(() =>
    request.post(`${API}/api/sittings/${documentId}/close`, {
      headers: { Authorization: `Bearer ${jwt}` },
    }),
  );
  expect(res.ok()).toBeTruthy();
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

// C-SIT-06: returns the contract body `{ student_documentId, absent }`.
async function setSofiaAbsent(
  request: APIRequestContext,
  jwt: string,
  sittingDocumentId: string,
  absent: boolean,
): Promise<{ student_documentId: string; absent: boolean }> {
  const res = await fetchWithRetry(() =>
    request.post(`${API}/api/sittings/${sittingDocumentId}/absent`, {
      headers: { Authorization: `Bearer ${jwt}` },
      data: { student_documentId: SOFIA_ID, absent },
    }),
  );
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { data: { student_documentId: string; absent: boolean } }).data;
}

async function getMonitor(
  request: APIRequestContext,
  jwt: string,
  sittingDocumentId: string,
): Promise<MonitorPayload> {
  const res = await fetchWithRetry(() =>
    request.get(`${API}/api/sittings/${sittingDocumentId}/monitor`, {
      headers: { Authorization: `Bearer ${jwt}` },
    }),
  );
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { data: MonitorPayload }).data;
}

function sofiaRowOf(monitor: MonitorPayload): MonitorStudentRow {
  const sofia = monitor.students.find((student) => student.documentId === SOFIA_ID);
  if (!sofia) throw new Error('Sofia is not on the monitor roster');
  return sofia;
}

// Renders the en catalog's ICU plural template (TestDay.needsToSit.count) for
// a concrete count: =0 / one / other, with # as the count placeholder.
function formatStillToSitCount(template: string, count: number): string {
  const pick = (selector: string): string | undefined =>
    template.match(new RegExp(`${selector} \\{([^}]*)\\}`))?.[1];
  const body =
    count === 0 ? (pick('=0') ?? pick('other')) : count === 1 ? pick('one') : pick('other');
  if (body === undefined) throw new Error(`Unparseable ICU count template: ${template}`);
  return body.replaceAll('#', String(count));
}

test.describe('task 124: absent toggle + still-to-sit checklist vs live C-SIT-02/06', () => {
  // Serial: one sitting lifecycle driven end to end through the real UI. The
  // timeout carries the 429 ride-out budget (helpers/http.ts) — under rate
  // pressure the absent POST can wait out a window before landing.
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  test('mark absent -> restyle + panel exclusion -> reload persists -> clear restores', async ({
    page,
    request,
  }) => {
    const jwt = await login(request, TEACHER);

    // Arrange: no open sitting left over, a fresh open sitting, and Sofia
    // explicitly not absent so reruns are idempotent.
    for (const sitting of await listClassSittings(request, jwt)) {
      if (sitting.status === 'open') await closeSitting(request, jwt, sitting.documentId);
    }
    const sittingId = await createSitting(request, jwt);
    const reset = await setSofiaAbsent(request, jwt, sittingId, false);
    expect(reset).toEqual({ student_documentId: SOFIA_ID, absent: false });

    const before = await getMonitor(request, jwt, sittingId);
    const sofiaBefore = sofiaRowOf(before);
    expect(sofiaBefore.absent).toBe(false);
    expect(sofiaBefore.needs_to_sit).toBe(true);
    const sofiaName = [sofiaBefore.given_name, sofiaBefore.family_name]
      .filter(Boolean)
      .join(' ');
    const countTemplate = cat(en, 'TestDay.needsToSit.count');
    const initialCount = before.students.filter((student) => student.needs_to_sit).length;
    const markLabel = icu(cat(en, 'TestDay.monitor.markAbsentLabel'), { name: sofiaName });
    const clearLabel = icu(cat(en, 'TestDay.monitor.clearAbsentLabel'), { name: sofiaName });
    const absentLabel = cat(en, 'TestDay.monitor.absentLabel');

    try {
      await signIn(page, TEACHER);
      await page.goto(TEST_DAY_URL);
      const screen = page.locator('[data-surface="teacher-test-day"]');
      await expect(screen).toBeVisible({ timeout: 20_000 });
      const sofiaRow = screen.locator(`[data-student="${SOFIA_ID}"]`);
      await expect(sofiaRow).toBeVisible({ timeout: 20_000 });
      const panel = screen.locator('[data-slot="needs-to-sit-panel"]');
      await expect(panel).toBeVisible();

      // Baseline: the panel lists Sofia inside the full count.
      await expect(
        panel.getByText(formatStillToSitCount(countTemplate, initialCount), { exact: true }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(panel.getByText(sofiaName, { exact: true })).toBeVisible();

      // Act: mark Sofia absent from her monitor row.
      await sofiaRow.getByRole('button', { name: markLabel, exact: true }).click();

      // The row restyles: muted flag on the row, an "Absent" badge joins the
      // toggle's own label, and the toggle flips to the clear action.
      await expect(sofiaRow).toHaveAttribute('data-absent', 'true', { timeout: 30_000 });
      await expect(sofiaRow.getByText(absentLabel, { exact: true })).toHaveCount(2);
      await expect(
        sofiaRow.getByRole('button', { name: clearLabel, exact: true }),
      ).toBeVisible();

      // The still-to-sit panel drops her and the count falls by one.
      await expect(
        panel.getByText(formatStillToSitCount(countTemplate, initialCount - 1), { exact: true }),
      ).toBeVisible({ timeout: 30_000 });
      await expect(panel.getByText(sofiaName, { exact: true })).toHaveCount(0);

      // The API agrees while she is absent (C-SIT-02 derivation).
      const during = await getMonitor(request, jwt, sittingId);
      const sofiaDuring = sofiaRowOf(during);
      expect(sofiaDuring.absent).toBe(true);
      expect(sofiaDuring.needs_to_sit).toBe(false);

      // Persistence is server-side: a full reload keeps the restyle and the
      // panel exclusion.
      await page.reload();
      await expect(sofiaRow).toHaveAttribute('data-absent', 'true', { timeout: 30_000 });
      await expect(
        panel.getByText(formatStillToSitCount(countTemplate, initialCount - 1), { exact: true }),
      ).toBeVisible({ timeout: 30_000 });
      await expect(panel.getByText(sofiaName, { exact: true })).toHaveCount(0);

      // Clear the flag: the row and the panel restore.
      await sofiaRow.getByRole('button', { name: clearLabel, exact: true }).click();
      await expect(
        sofiaRow.getByRole('button', { name: markLabel, exact: true }),
      ).toBeVisible({ timeout: 30_000 });
      await expect(sofiaRow.getByText(absentLabel, { exact: true })).toHaveCount(1);
      await expect(
        panel.getByText(formatStillToSitCount(countTemplate, initialCount), { exact: true }),
      ).toBeVisible({ timeout: 30_000 });
      await expect(panel.getByText(sofiaName, { exact: true })).toBeVisible();

      // The API agrees after the restore too.
      const after = await getMonitor(request, jwt, sittingId);
      const sofiaAfter = sofiaRowOf(after);
      expect(sofiaAfter.absent).toBe(false);
      expect(sofiaAfter.needs_to_sit).toBe(true);
    } finally {
      // Tidy: Sofia not absent, every sitting for the class closed — the same
      // fixture shape the next run (and other specs) rely on.
      await setSofiaAbsent(request, jwt, sittingId, false);
      for (const sitting of await listClassSittings(request, jwt)) {
        if (sitting.status === 'open') await closeSitting(request, jwt, sitting.documentId);
      }
    }
  });
});
