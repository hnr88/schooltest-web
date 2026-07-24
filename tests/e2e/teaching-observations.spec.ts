import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { apiEnv, runSql } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';

// E11-06 / E11-07 — F-WEB-OBSERVATIONS, driven against the REAL portal, the REAL
// Strapi and the REAL Postgres. Every expectation is read out of
// `public.results` with psql (or off the live C-5 export) FIRST and then
// compared to what the page rendered. Nothing is fixtured, and the expected
// sentences are formatted from the shipped catalog rather than retyped.
const en = loadMessages('en');

const LIST = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
const PERCENT = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 0 });

interface WireEntry {
  status?: string;
  prob?: number | null;
  items?: number;
}
type WireAttributes = Record<string, WireEntry | 'not_assessed'>;

/** NEXT_PUBLIC_API_BASE_URL as the running portal itself resolves it. */
function apiBaseUrl(): string {
  const raw = readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
  const match = raw.match(/^NEXT_PUBLIC_API_BASE_URL=(.*)$/m);
  if (!match) throw new Error('[e2e] NEXT_PUBLIC_API_BASE_URL missing from .env.local');
  return match[1].trim();
}

function teacherOwned(extraSql: string): string {
  const id = runSql(
    `select r.document_id
       from results r
       join results_student_lnk rs on rs.result_id = r.id
       join students s on s.id = rs.student_id
       join students_teacher_lnk tl on tl.student_id = s.id
       join up_users u on u.id = tl.user_id
      where u.email = 'teacher@schooltest.local'
        and r.destination = 'official'
        ${extraSql}
      order by r.created_at desc
      limit 1`,
  ).split('\n')[0];
  if (!id) throw new Error(`[e2e] no teacher-owned result for: ${extraSql}`);
  return id;
}

/** The stored evidence map minus the reserved peer keys the C-4 mapper strips. */
function storedAttributes(documentId: string): WireAttributes {
  const parsed = JSON.parse(
    runSql(`select attributes::text from results where document_id = '${documentId}'`),
  ) as WireAttributes;
  return Object.fromEntries(
    Object.entries(parsed).filter(([key]) => key !== '_artefacts' && key !== 'provisional'),
  );
}

function assessed(map: WireAttributes): { code: string; status: string; items: number }[] {
  return Object.entries(map).flatMap(([code, entry]) =>
    entry !== 'not_assessed' &&
    typeof entry.items === 'number' &&
    entry.items > 0 &&
    entry.prob !== null &&
    entry.status !== undefined &&
    entry.status !== 'not_assessed'
      ? [{ code, status: entry.status, items: entry.items }]
      : [],
  );
}

function ladderIndex(code: string): number {
  const match = /^[A-Za-z]+(\d+)$/.exec(code);
  if (!match) throw new Error(`[e2e] unreadable attribute code ${code}`);
  return Number(match[1]);
}

async function signInAsTeacher(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page
    .getByLabel(cat(en, 'Auth.emailLabel'), { exact: true })
    .fill('teacher@schooltest.local');
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(apiEnv('SEED_TEACHER_PASSWORD'));
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL('**/dashboard');
}

/** The live C-5 bundle for one result, read as the seeded teacher (E11-07). */
async function diagnosticBundle(
  request: APIRequestContext,
  documentId: string,
): Promise<{ skills: Record<string, { error_patterns: string[] }> }> {
  const base = apiBaseUrl();
  const auth = await request.post(`${base}/api/auth/local`, {
    data: { identifier: 'teacher@schooltest.local', password: apiEnv('SEED_TEACHER_PASSWORD') },
  });
  expect(auth.ok(), 'teacher sign-in for the C-5 read').toBeTruthy();
  const { jwt } = (await auth.json()) as { jwt: string };
  const response = await request.get(
    `${base}/api/results/${documentId}/export?format=diagnostic_json`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  expect(response.status(), 'C-5 diagnostic export').toBe(200);
  return (await response.json()) as { skills: Record<string, { error_patterns: string[] }> };
}

test.describe('teacher report — teaching observations from the attribute contrast', () => {
  test('the foundation bottleneck, the B1 band and the evidence caveat are the real row', async ({
    page,
  }) => {
    // Comprehension assessed and unmastered while a foundation attribute is not
    // secure — the E11-06 bottleneck case, with a measured B1 band to fold in.
    const documentId = teacherOwned(
      `and r.skill = 'reading'
         and r.attributes -> 'R1' ->> 'status' = 'not_mastered'
         and r.attributes -> 'R7' ->> 'status' = 'not_mastered'
         and r.supplementary ->> 'vocab_band_b1_accuracy' is not null`,
    );
    const map = storedAttributes(documentId);
    const rows = assessed(map);
    const foundationGap = rows
      .filter((row) => ladderIndex(row.code) <= 3 && row.status !== 'mastered')
      .map((row) => row.code);
    const comprehensionGap = rows
      .filter((row) => ladderIndex(row.code) > 3 && row.status !== 'mastered')
      .map((row) => row.code);
    expect(foundationGap.length, 'a real foundation gap').toBeGreaterThan(0);
    expect(comprehensionGap.length, 'a real comprehension gap').toBeGreaterThan(0);

    const b1 = Number(
      runSql(
        `select supplementary ->> 'vocab_band_b1_accuracy' from results where document_id = '${documentId}'`,
      ),
    );
    const vocabulary = rows.find((row) => ladderIndex(row.code) === 2);
    if (!vocabulary) throw new Error('[e2e] expected an assessed vocabulary attribute');

    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${documentId}`);

    const section = page.locator('[data-slot="report-observations"]');
    await expect(section).toHaveAttribute('data-state', 'observations');
    await expect(section.locator('[data-slot="report-observation"]')).toHaveCount(3);

    const bottleneck = section.locator('[data-observation="foundationBottleneck"]');
    await expect(bottleneck).toHaveCount(1);
    const bottleneckText = (await bottleneck.innerText()).trim();
    expect(bottleneckText).toContain(LIST.format(comprehensionGap));
    expect(bottleneckText).toContain(LIST.format(foundationGap));

    const vocab = section.locator('[data-observation="vocabularyBandMeasured"]');
    await expect(vocab).toHaveCount(1);
    const vocabText = (await vocab.innerText()).trim();
    expect(vocabText).toContain(`(${vocabulary.code})`);
    expect(vocabText).toContain(cat(en, `Report.attributeStatus.${vocabulary.status}`));
    expect(vocabText).toContain(PERCENT.format(b1));

    const caveat = section.locator('[data-observation="evidenceCaveat"]');
    const items = rows.map((row) => row.items);
    const caveatText = (await caveat.innerText()).trim();
    expect(caveatText).toContain(`${rows.length} of ${Object.keys(map).length} attributes`);
    expect(caveatText).toContain(`${Math.min(...items)}`);
    expect(caveatText).toContain(`${Math.max(...items)}`);

    // Survives a reload byte for byte — the observations are a projection of the
    // persisted row, never of client state.
    const before = await section.innerText();
    await page.reload();
    await expect(page.locator('[data-slot="report-observations"]')).toHaveAttribute(
      'data-state',
      'observations',
    );
    expect((await page.locator('[data-slot="report-observations"]').innerText()).trim()).toBe(
      before.trim(),
    );
  });

  test('a sitting with no comprehension items says so, and an unserved B1 band is never a percentage', async ({
    page,
  }) => {
    const documentId = teacherOwned(
      `and r.skill = 'reading'
         and r.attributes ->> 'R7' = 'not_assessed'
         and r.attributes -> 'R1' ->> 'status' is not null
         and r.supplementary ->> 'vocab_band_b1_accuracy' is null`,
    );
    const rows = assessed(storedAttributes(documentId));
    expect(
      rows.filter((row) => ladderIndex(row.code) > 3),
      'no comprehension attribute is assessed on this row',
    ).toHaveLength(0);

    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${documentId}`);

    const section = page.locator('[data-slot="report-observations"]');
    await expect(section).toHaveAttribute('data-state', 'observations');
    await expect(
      section.locator('[data-observation="comprehensionNotAssessedWithGap"]'),
    ).toHaveCount(1);

    const vocab = section.locator('[data-observation="vocabularyBandNotAdministered"]');
    await expect(vocab).toHaveCount(1);
    // The absence is stated, never rendered as 0% (CT-7).
    await expect(vocab).not.toContainText('%');
    await expect(section.locator('[data-observation="vocabularyBandMeasured"]')).toHaveCount(0);
  });

  test('the error pattern notes are the C-5 strings, verbatim and unre-ordered', async ({
    page,
    request,
  }) => {
    // A result whose sitting actually recorded chosen distractors, so the C-5
    // aggregator has something real to name.
    const documentId = teacherOwned(
      `and r.skill = 'reading'
         and r.attributes is not null
         and exists (
           select 1
             from results_session_lnk rsl
             join responses_session_lnk rl on rl.session_id = rsl.session_id
             join responses resp on resp.id = rl.response_id
            where rsl.result_id = r.id and resp.selected_distractor_type is not null
         )`,
    );
    const bundle = await diagnosticBundle(request, documentId);
    const expected = Object.values(bundle.skills).flatMap((entry) => entry.error_patterns);

    await signInAsTeacher(page);
    await page.goto(`/dashboard/reports/${documentId}`);

    const section = page.locator('[data-slot="report-error-patterns"]');
    await expect(section).toHaveAttribute(
      'data-state',
      expected.length > 0 ? 'patterns' : 'none_observed',
    );

    if (expected.length === 0) {
      await expect(section).toContainText(cat(en, 'Report.errorPatternsNoneObserved'));
      return;
    }
    const rendered = await section.locator('[data-slot="report-error-pattern"]').allInnerTexts();
    expect(rendered.map((line) => line.trim())).toEqual(expected);
  });
});
