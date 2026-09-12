import { expect, type Locator, type Page } from '@playwright/test';

import type { ClassDiagnostic } from '@/modules/teach/types/diagnostic.types';

import { cat, icu } from './i18n';
import { loginAs } from './roles';
import { setAsideErrors } from './teacher-class-detail';
import { parseDiagnostic } from './teacher-insights-tab';
import { en } from './teacher-rail';

// S5 — the school-admin half of teacher-v2/insights-tab.spec.ts. The analytics screen shares
// the class-diagnostic schema S5 widened; its expected rows are re-derived here from the
// diagnostic responses the page itself received.

/** The aggregate panel's status columns, left to right. */
export const AGGREGATE_STATUSES = ['secure', 'developing', 'emerging', 'not_yet', 'mastered', 'not_mastered', 'not_assessed'] as const;

/** The seven teach areas, and where a scored student's attribute cell lands (both vocabulary strands on Vocabulary). */
const AREA_CODES = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'] as const;
const ATTRIBUTE_AREA: Readonly<Record<string, string>> = {
  Decoding: 'R1',
  Vocab_A2: 'R2',
  Vocab_B1: 'R2',
  Grammar: 'R3',
  Gist: 'R4',
  Detail: 'R5',
  Inference: 'R6',
};

export const areaOf = (code: string): string | null =>
  (AREA_CODES as readonly string[]).includes(code) ? code : (ATTRIBUTE_AREA[code] ?? null);

export const areaLabel = (code: string): string => cat(en, `Teach.diagnostic.areas.${areaOf(code) ?? code}`);

/** Every class diagnostic the page receives, parsed; `settled()` dedupes by class. */
function collectDiagnostics(page: Page): { settled: () => Promise<ClassDiagnostic[]> } {
  const pending: Promise<ClassDiagnostic | null>[] = [];
  page.on('response', (response) => {
    if (!/\/api\/schools\/me\/classes\/[^/?]+\/diagnostic/.test(response.url())) return;
    if (response.request().method() !== 'GET' || !response.ok()) return;
    pending.push(response.json().then(parseDiagnostic).catch(() => null));
  });
  return {
    async settled() {
      const bodies = (await Promise.all(pending)).filter((body): body is ClassDiagnostic => body !== null);
      return [...new Map(bodies.map((body) => [body.class.documentId, body])).values()];
    },
  };
}

/** "<status> <method> <path>" of every response the page gets with a 4xx/5xx status. */
export function failedResponses(page: Page): string[] {
  const failed: string[] = [];
  page.on('response', (response) => {
    if (response.status() < 400) return;
    failed.push(`${response.status()} ${response.request().method()} ${new URL(response.url()).pathname}`);
  });
  return failed;
}

/** Signs in as school admin A and opens School analytics; errors from the sign-in landing are set aside. */
export async function openSchoolAnalytics(page: Page, errors: string[]) {
  await loginAs(page, 'schoolAdmin');
  setAsideErrors(errors, 'sign-in landing');
  const failed = failedResponses(page);
  const diagnostics = collectDiagnostics(page);
  await page.goto('/dashboard/school/analytics');
  const table = page.locator('[data-surface="school-admin-analytics"] table');
  await expect(table).toBeVisible({ timeout: 60_000 });
  const bodies = await diagnostics.settled();
  await expect(page.locator('[data-slot="analytics-class-list"] li')).toHaveCount(bodies.length);
  return { bodies, table, failed };
}

const bandedCount = (diagnostic: ClassDiagnostic): number =>
  diagnostic.mastery.flatMap((row) => row.attributes).filter((attribute) => attribute.status !== 'not_assessed').length;

/** Opens the class with the most banded statuses (the shared DiagnosticDashboard) and waits for its live summary. */
export async function openBandedClass(page: Page, bodies: readonly ClassDiagnostic[]): Promise<ClassDiagnostic> {
  const target = [...bodies].sort((a, b) => bandedCount(b) - bandedCount(a))[0];
  if (target === undefined || bandedCount(target) === 0) throw new Error('[e2e] no class of the school has a banded status');
  await page.locator('[data-slot="analytics-class-list"] button', { hasText: target.class.name ?? '' }).first().click();
  await expect(page.locator('[data-slot="teach-diagnostic"]')).toContainText(
    icu(cat(en, 'Teach.diagnostic.summary'), { sat: String(target.sat_count), roster: String(target.roster_count) }),
    { timeout: 30_000 },
  );
  return target;
}

// TB-12 — the MASTERY TABLE + student drill-down half. The status a cell shows is
// re-derived here from the diagnostic the page itself received, with NO app code:
// the area a wire code lands on (`areaOf`), then, where both vocabulary strands
// land on Vocabulary, the LIMITING one — the lowest-ranked banded status, a band
// always beating the other strand's absence.
const STATUS_RANK: Readonly<Record<string, number | null>> = {
  not_yet: 0,
  not_mastered: 0,
  emerging: 1,
  developing: 2,
  mastered: 2,
  secure: 3,
  not_assessed: null,
};

/** The status the given area's cell must carry for this row, or 'none' for the em dash. */
export function expectedAreaStatus(row: ClassDiagnostic['mastery'][number], area: string): string {
  let best: { status: string; rank: number | null } | null = null;
  for (const attribute of row.attributes) {
    if (areaOf(attribute.code) !== area) continue;
    const rank = STATUS_RANK[attribute.status] ?? null;
    if (best === null || (rank !== null && (best.rank === null || rank < best.rank))) {
      best = { status: attribute.status, rank };
    }
  }
  return best?.status ?? 'none';
}

/** Every mastery row in the table's default order (name asc, documentId tie-break), with its seven cells. */
export function expectedMasteryTable(diagnostic: ClassDiagnostic): { ref: string; areas: string[] }[] {
  return [...diagnostic.mastery]
    .sort(
      (a, b) =>
        a.student_ref.localeCompare(b.student_ref) ||
        a.student_document_id.localeCompare(b.student_document_id),
    )
    .map((row) => ({
      ref: row.student_ref,
      areas: AREA_CODES.map((code) => expectedAreaStatus(row, code)),
    }));
}

/** The rendered mastery table, row by row: the student name and each area cell's status marker. */
export function renderedMasteryTable(table: Locator): Promise<{ ref: string; areas: string[] }[]> {
  return table.locator('[data-directory-row]').evaluateAll((rows) =>
    rows.map((row) => ({
      ref: row.querySelector('[data-row-select] span')?.textContent?.trim() ?? '',
      areas: Array.from(row.querySelectorAll('[data-slot="mastery-area"]')).map(
        (cell) => cell.getAttribute('data-status') ?? '',
      ),
    })),
  );
}

/** The aggregate table's rows in area order: the area code and its status counts in column order. */
export function expectedAggregate(diagnostics: readonly ClassDiagnostic[]): { code: string; counts: number[] }[] {
  const counts = new Map<string, Record<string, number>>();
  for (const attribute of diagnostics.flatMap((diagnostic) => diagnostic.mastery.flatMap((row) => row.attributes))) {
    const area = areaOf(attribute.code);
    if (area === null) continue;
    const entry = counts.get(area) ?? Object.fromEntries(AGGREGATE_STATUSES.map((status) => [status, 0]));
    entry[attribute.status] += 1;
    counts.set(area, entry);
  }
  return AREA_CODES.flatMap((code) => {
    const entry = counts.get(code);
    return entry === undefined ? [] : [{ code, counts: AGGREGATE_STATUSES.map((status) => entry[status]) }];
  });
}

/** The rendered aggregate table, row by row: the row label and its numeric cells. */
export function renderedAggregate(table: Locator): Promise<{ label: string; cells: string[] }[]> {
  return table.locator('tbody tr').evaluateAll((rows) =>
    rows.map((row) => ({
      label: row.querySelector('th')?.textContent?.trim() ?? '',
      cells: Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent?.trim() ?? ''),
    })),
  );
}
