import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, icu, loadMessages } from './helpers/i18n';

// Task 99 (st-mvp-pivot) live check: the W15 "group by limiting attribute"
// surface (C-RPT-01 v2, mvp-updates spec 4.9/4.10). The teacher opens the
// class diagnostic, sees the groups panel with counts straight off the wire,
// drills one click from a group member to the student profile (report link
// only when a result exists, the not-assessed note otherwise), and the panel
// stays jargon-free. The fixture class evolves, so every content expectation
// is computed from the live C-RPT-01 payload, never pinned.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = { email: 'verify21@schooltest.local', password: 'Verify21!pw' };
const SCHOOL_ADMIN = { email: 'schooladmin-a@schooltest.local', password: 'pEbjxVnJ4PPYiv8D!A1' };
const CLASS_ID = 'x1hat1dy90boz11n9zyphoan'; // "EAL/D Year 7 - Room 4"

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
  // late role redirect can never hijack the goto that follows.
  await page.waitForURL('**/dashboard/teach**', { timeout: 90_000 });
}

interface DiagnosticGroupWire {
  limiting_attribute: string;
  student_refs: string[];
  count: number;
}

interface DiagnosticPayload {
  sat_count: number;
  roster_count: number;
  mastery: Array<{
    student_ref: string;
    latest_result_document_id: string | null;
  }>;
  groups: DiagnosticGroupWire[];
}

async function fetchDiagnostic(request: APIRequestContext): Promise<DiagnosticPayload> {
  const teacherJwt = await login(request, TEACHER);
  const res = await fetchWithRetry(() =>
    request.get(`${API}/api/schools/me/classes/${CLASS_ID}/diagnostic`, {
      headers: { Authorization: `Bearer ${teacherJwt}` },
    }),
  );
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { data: DiagnosticPayload }).data;
}

// Renders the catalog's ICU plural template ("{count, plural, one {# student}
// other {# students}}") for a concrete count, the way next-intl would.
function pluralLabel(template: string, count: number): string {
  const one = /one \{([^}]*)\}/.exec(template)?.[1];
  const other = /other \{([^}]*)\}/.exec(template)?.[1];
  const branch = (count === 1 ? one : other) ?? other ?? one ?? template;
  return branch.replaceAll('#', String(count));
}

async function openDiagnosticPage(page: Page): Promise<void> {
  await signIn(page, TEACHER);
  await page.goto(`/en/dashboard/teach/results/${CLASS_ID}`);
  const screen = page.locator('[data-surface="teacher-diagnostic"]');
  await expect(screen).toBeVisible({ timeout: 20_000 });
}

test.describe('task 99: group by limiting attribute vs live C-RPT-01 v2', () => {
  // The timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test('API baseline: groups are coherent with the mastery rows and the catalog', async ({
    request,
  }) => {
    const diagnostic = await fetchDiagnostic(request);
    expect(diagnostic.groups.length).toBeGreaterThan(0);

    const masteryRefs = diagnostic.mastery.map((row) => row.student_ref);
    for (const group of diagnostic.groups) {
      // The wire count is the member count, every member is a real roster
      // student, and every limiting attribute has a friendly catalog label
      // (cat throws on a missing key, so an unknown code fails loud here).
      expect(group.count).toBe(group.student_refs.length);
      expect(group.count).toBeGreaterThan(0);
      cat(en, `Teach.diagnostic.areas.${group.limiting_attribute}`);
      for (const ref of group.student_refs) {
        expect(masteryRefs).toContain(ref);
      }
    }
    // Every roster student lands in exactly the groups' membership (no one
    // dropped between mastery and groups).
    const grouped = diagnostic.groups.flatMap((group) => group.student_refs);
    expect(grouped.length).toBe(diagnostic.mastery.length);
  });

  test('groups panel: heading, one section per wire group, matching counts and members', async ({
    page,
    request,
  }) => {
    const diagnostic = await fetchDiagnostic(request);
    expect(diagnostic.groups.length).toBeGreaterThan(0);

    await openDiagnosticPage(page);
    const screen = page.locator('[data-surface="teacher-diagnostic"]');
    const panel = screen.locator('[data-slot="group-panel"]');
    await expect(panel).toBeVisible();
    await expect(
      panel.getByRole('heading', {
        name: cat(en, 'Teach.diagnostic.groupsTitle'),
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      panel.getByText(cat(en, 'Teach.diagnostic.groupsDescription'), { exact: true }),
    ).toBeVisible();

    // The panel renders the wire order verbatim (reading-ladder order with
    // not-yet-assessed last): one card per group, in payload order.
    const cards = panel.locator(':scope > ul > li');
    await expect(cards).toHaveCount(diagnostic.groups.length);
    const countTemplate = cat(en, 'Teach.diagnostic.groupCount');
    for (const [index, group] of diagnostic.groups.entries()) {
      const card = cards.nth(index);
      await expect(
        card.getByText(cat(en, `Teach.diagnostic.areas.${group.limiting_attribute}`), {
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        card.getByText(pluralLabel(countTemplate, group.count), { exact: true }),
      ).toBeVisible();
      await expect(card.getByRole('button')).toHaveCount(group.student_refs.length);
    }

    // The not-yet-assessed group renders whenever the API emits one.
    const notYetAssessed = diagnostic.groups.find(
      (group) => group.limiting_attribute === 'not_yet_assessed',
    );
    if (notYetAssessed) {
      await expect(
        panel.getByText(cat(en, 'Teach.diagnostic.areas.not_yet_assessed'), { exact: true }),
      ).toBeVisible();
    }
  });

  test('drill: one click from a group member to the student profile and report', async ({
    page,
    request,
  }) => {
    const diagnostic = await fetchDiagnostic(request);
    // Assessed member: a mastery row with a result behind it. Unassessed
    // member: no result, and a ref unique across the whole panel so the click
    // target is unambiguous (the fixture carries duplicate refs).
    const allRefs = diagnostic.groups.flatMap((group) => group.student_refs);
    const isUniqueRef = (ref: string) => allRefs.filter((other) => other === ref).length === 1;
    const assessed = diagnostic.mastery.find(
      (row) => row.latest_result_document_id !== null && isUniqueRef(row.student_ref),
    );
    const unassessed = diagnostic.mastery.find(
      (row) => row.latest_result_document_id === null && isUniqueRef(row.student_ref),
    );
    expect(assessed).toBeTruthy();
    expect(unassessed).toBeTruthy();

    await openDiagnosticPage(page);
    const screen = page.locator('[data-surface="teacher-diagnostic"]');
    const panel = screen.locator('[data-slot="group-panel"]');
    await expect(panel).toBeVisible();
    const drilldown = screen.locator('[data-slot="student-mastery-drilldown"]');

    // Assessed student: the drilldown links one click further to the report.
    await panel.getByRole('button', { name: assessed!.student_ref, exact: true }).click();
    await expect(drilldown).toBeVisible();
    await expect(
      drilldown.getByRole('heading', {
        name: icu(cat(en, 'Teach.diagnostic.drilldownTitle'), { student: assessed!.student_ref }),
        exact: true,
      }),
    ).toBeVisible();
    const reportLink = drilldown.locator('[data-slot="drilldown-report-link"]');
    await expect(
      reportLink.getByText(cat(en, 'Teach.diagnostic.reportLink'), { exact: true }),
    ).toBeVisible();
    await expect(reportLink).toHaveAttribute(
      'href',
      new RegExp(`/dashboard/reports/${assessed!.latest_result_document_id}$`),
    );
    await drilldown
      .getByRole('button', { name: cat(en, 'Teach.diagnostic.drilldownClose'), exact: true })
      .click();
    await expect(drilldown).toHaveCount(0);

    // Not-yet-assessed student: the note, never a dead link.
    await panel.getByRole('button', { name: unassessed!.student_ref, exact: true }).click();
    await expect(drilldown).toBeVisible();
    await expect(drilldown.locator('[data-slot="drilldown-report-link"]')).toHaveCount(0);
    await expect(
      drilldown.getByText(cat(en, 'Teach.diagnostic.notAssessedNote'), { exact: true }),
    ).toBeVisible();
    await drilldown
      .getByRole('button', { name: cat(en, 'Teach.diagnostic.drilldownClose'), exact: true })
      .click();
    await expect(drilldown).toHaveCount(0);
  });

  test('copy guard: no jargon, no attribute codes, no em dash', async ({ page, request }) => {
    const diagnostic = await fetchDiagnostic(request);
    expect(diagnostic.groups.length).toBeGreaterThan(0);

    await openDiagnosticPage(page);
    const screen = page.locator('[data-surface="teacher-diagnostic"]');
    const panel = screen.locator('[data-slot="group-panel"]');
    await expect(panel).toBeVisible();

    // Page-wide (mvp spec 4.4 / copy rules): no psychometric jargon reaches
    // the teacher DOM.
    const pageText = ((await screen.textContent()) ?? '').toLowerCase();
    expect(pageText).not.toContain('acara');
    expect(pageText).not.toContain('probability');
    expect(pageText).not.toContain('g-dina');
    expect(pageText).not.toContain('q-matrix');

    // Panel-scoped: friendly area labels only, never raw attribute codes
    // (R1-R7), and hyphen-only punctuation (copy rules ban the em dash).
    const panelText = (await panel.textContent()) ?? '';
    expect(panelText).not.toMatch(/\bR[1-7]\b/);
    expect(panelText).not.toContain('—');
  });

  test('unpopulated class renders no groups panel', async ({ page, request }) => {
    // Setup mirrors task 75: a results-free class this spec owns, created via
    // C-CLS-02 with verify21 assigned, deleted again in the finally.
    const adminJwt = await login(request, SCHOOL_ADMIN);
    const teachersRes = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/teachers`, {
        headers: { Authorization: `Bearer ${adminJwt}` },
      }),
    );
    expect(teachersRes.ok()).toBeTruthy();
    const teachers = (
      (await teachersRes.json()) as { data: Array<{ documentId: string; email: string }> }
    ).data;
    const verify21 = teachers.find((row) => row.email === TEACHER.email);
    expect(verify21).toBeTruthy();
    const create = await fetchWithRetry(() =>
      request.post(`${API}/api/schools/me/classes`, {
        headers: { Authorization: `Bearer ${adminJwt}` },
        data: {
          name: `zz99 empty ${Date.now()}`,
          year_band: '7_9',
          teacher_documentIds: [verify21!.documentId],
        },
      }),
    );
    expect(create.status()).toBe(201);
    const emptyClassId = ((await create.json()) as { data: { documentId: string } }).data
      .documentId;

    try {
      await signIn(page, TEACHER);
      await page.goto(`/en/dashboard/teach/results/${emptyClassId}`);
      const screen = page.locator('[data-surface="teacher-diagnostic"]');
      await expect(screen).toBeVisible({ timeout: 20_000 });
      // The WYSIWYG empty state confirms the class is genuinely unpopulated;
      // the groups panel returns null there (never a blank gap).
      await expect(
        screen
          .locator('[data-slot="diagnostic-empty-state"]')
          .getByText(cat(en, 'Teach.diagnostic.emptyMasteryTitle'), { exact: true }),
      ).toBeVisible();
      await expect(screen.locator('[data-slot="group-panel"]')).toHaveCount(0);
    } finally {
      const cleanup = await fetchWithRetry(() =>
        request.delete(`${API}/api/schools/me/classes/${emptyClassId}`, {
          headers: { Authorization: `Bearer ${adminJwt}` },
        }),
      );
      expect(cleanup.ok()).toBeTruthy();
    }
  });
});
