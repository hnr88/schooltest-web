import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { apiEnv, runSql } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';
import { bridgeApi } from './helpers/vocab-split';

// Phase Model & EAL/D Alignment (spec 3, crosswalk reading-v5) — run AFTER
// integration against the REAL portal, the REAL API and the REAL Postgres. The
// teacher report's per-attribute rows are a four-step ACARA phase ladder
// (Beginning / Emerging / Developing / Consolidating) with no score and no
// percentage, and the family strength / focus lines carry no {score}% token.
// Every expectation is read out of `public.results.attributes` first; the copy
// comes from the shipped catalogue.
const en = loadMessages('en');
const TEACHER = process.env.SPEC3_TEACHER_EMAIL ?? 'teacher@schooltest.local';
const PROOF_DIR = process.env.SPEC3_PROOF_DIR ?? '/Users/hunor.nagy/Desktop/live_feedback_1/proof/SPEC-003';
const LADDER = ['not_yet', 'emerging', 'developing', 'secure'] as const;
const PHASES = LADDER.map((band) => cat(en, `Report.attributeStatus.${band}`));

test.use({ viewport: { width: 1440, height: 1000 } });

interface StoredEntry {
  status?: string;
  domain_score?: number;
  items_seen?: number;
}

/**
 * The seeded teacher's newest published official v2 reading result, preferring
 * the one whose attributes span the MOST distinct bands, so the ladder is seen
 * at more than one step. Read straight from Postgres; nothing is fixtured.
 */
function ladderResult(): { resultId: string; attributes: Record<string, StoredEntry> } {
  const row = runSql(
    `select r.document_id, r.attributes::text
       from results r
       join results_student_lnk rs on rs.result_id = r.id
       join students s on s.id = rs.student_id
       join students_class_lnk sc on sc.student_id = s.id
       join classes c on c.id = sc.class_id
       join classes_teacher_lnk ct on ct.class_id = c.id
       join up_users u on u.id = ct.user_id
      where u.email = '${TEACHER}'
        and r.skill = 'reading' and r.destination = 'official' and r.published_at is not null
        and r.model_version = 'reading-3model/1'
      order by (select count(distinct v ->> 'status')
                  from jsonb_each(r.attributes::jsonb) as e(k, v)
                 where jsonb_typeof(v) = 'object' and v ? 'domain_score') desc,
               r.created_at desc
      limit 1`,
  ).split('\n')[0];
  const cut = (row ?? '').indexOf('|');
  if (cut < 0) throw new Error(`[e2e] no published reading result for ${TEACHER}`);
  const attributes = JSON.parse(row.slice(cut + 1)) as Record<string, StoredEntry | string>;
  const scored = Object.fromEntries(
    Object.entries(attributes).filter(
      (entry): entry is [string, StoredEntry] =>
        typeof entry[1] === 'object' && entry[1] !== null && typeof entry[1].domain_score === 'number',
    ),
  );
  return { resultId: row.slice(0, cut), attributes: scored };
}

/**
 * The seeded teacher's student whose LATEST published reading result spans the
 * most distinct bands (the drill-down reads the latest), with its class and the
 * stored per-attribute statuses. Read straight from Postgres.
 */
function drillDownTarget(): { classId: string; studentId: string; gatePassed: string; statuses: Record<string, string> } {
  const row = runSql(
    `with latest as (
       select r.attributes, s.document_id as student, c.document_id as class,
              coalesce(r.gate ->> 'passed', '') as gate_passed,
              row_number() over (partition by s.id order by r.created_at desc) as rn
         from results r
         join results_student_lnk rs on rs.result_id = r.id
         join students s on s.id = rs.student_id
         join students_class_lnk sc on sc.student_id = s.id
         join classes c on c.id = sc.class_id
         join classes_teacher_lnk ct on ct.class_id = c.id
         join up_users u on u.id = ct.user_id
        where u.email = '${TEACHER}' and r.skill = 'reading' and r.destination = 'official'
          and r.published_at is not null and r.model_version = 'reading-3model/1'
          and (r.overall ->> 'domain_score') is not null)
     select class, student, gate_passed, attributes::text from latest where rn = 1
      order by (select count(distinct v ->> 'status') from jsonb_each(attributes::jsonb) as e(k, v)
                 where jsonb_typeof(v) = 'object' and v ? 'domain_score') desc
      limit 1`,
  ).split('\n')[0];
  const [classId, studentId, gatePassed, ...rest] = (row ?? '').split('|');
  if (!classId || !studentId) throw new Error(`[e2e] no latest scored reading result for ${TEACHER}`);
  const attributes = JSON.parse(rest.join('|')) as Record<string, { status?: string } | string>;
  const statuses: Record<string, string> = {};
  for (const [name, entry] of Object.entries(attributes)) {
    if (typeof entry === 'object' && entry !== null && typeof entry.status === 'string') statuses[name] = entry.status;
  }
  return { classId, studentId, gatePassed: gatePassed ?? '', statuses };
}

/** The teacher portal's band word (TeacherPortal.viewModel.band.*) for a stored status. */
const bandWord = (status: string) => cat(en, `TeacherPortal.viewModel.band.${status === 'not_yet' ? 'notYet' : status}`);

async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(TEACHER);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(apiEnv('SEED_TEACHER_PASSWORD'));
  await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
  await page.waitForURL('**/dashboard', { timeout: 60_000 });
}

test.describe('Phase Model (spec 3) — ACARA phase ladder rows and family lines without %', () => {
  test.beforeAll(() => mkdirSync(PROOF_DIR, { recursive: true }));

  test.beforeEach(async ({ page, baseURL }) => {
    test.setTimeout(180_000);
    await bridgeApi(page, new URL(baseURL ?? 'http://localhost:3000').origin);
    await signIn(page);
  });

  // The CORS bridge proxies every API call; a poll still in flight when a test
  // ends must not fail it.
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test('teacher report: every assessed attribute is its band’s step on the four-step ladder, no score', async ({ page }, testInfo) => {
    const target = ladderResult();
    const names = Object.keys(target.attributes);
    expect(names.length).toBeGreaterThan(0);
    testInfo.annotations.push({ type: 'result', description: target.resultId });

    await page.goto(`/dashboard/reports/${target.resultId}`);
    const panel = page.locator('[data-slot="report-attributes"]');
    await expect(panel).toHaveAttribute('data-state', 'rows', { timeout: 60_000 });
    await expect(panel).toContainText(cat(en, 'Report.attributesDescription'));

    for (const name of names) {
      const entry = target.attributes[name];
      const step = LADDER.indexOf(entry.status as (typeof LADDER)[number]) + 1;
      expect(step, `${name} carries one of the four bands`).toBeGreaterThan(0);

      const row = panel.locator(`li[data-slot="report-attribute-row"][data-attribute="${name}"]`);
      await expect(row, name).toHaveAttribute('data-state', 'assessed');
      await expect(row.locator('[data-slot="status-pill"]'), name).toHaveText(PHASES[step - 1]);

      const track = row.locator('[data-slot="report-attribute-track"]');
      await expect(track, name).toHaveAttribute('data-step', String(step));
      await expect(track, name).toHaveAttribute(
        'aria-label',
        cat(en, 'Report.attributeLadderLabel')
          .replace('{skill}', cat(en, `Report.attributes.${name}`))
          .replace('{phase}', PHASES[step - 1])
          .replace('{step}', String(step)),
      );
      const steps = track.locator('[data-slot="report-attribute-ladder-step"]');
      await expect(steps, name).toHaveCount(4);
      await expect(track.locator('[data-slot="report-attribute-ladder-step"][data-reached="true"]'), name).toHaveCount(step);
      await expect(track.locator('[data-slot="report-attribute-ladder-step"][data-current="true"]'), name).toHaveAttribute(
        'data-band',
        LADDER[step - 1],
      );

      // No score, no percentage, no score-length bar.
      await expect(row.locator('[data-slot="report-attribute-score"]'), name).toHaveCount(0);
      expect(await row.innerText(), name).not.toContain('%');
      expect(await track.innerHTML(), name).not.toContain('scaleX');
    }

    await panel.scrollIntoViewIfNeeded();
    const shot = path.join(PROOF_DIR, 'teacher-report-ladder-rows.png');
    await panel.screenshot({ path: shot, animations: 'disabled' });
    await testInfo.attach('teacher-report-ladder-rows', { path: shot, contentType: 'image/png' });
  });

  test('teacher drill-down: every breakdown row states its phase word, no percentage', async ({ page }, testInfo) => {
    const target = drillDownTarget();
    testInfo.annotations.push({ type: 'student', description: `${target.classId}/${target.studentId}` });
    await page.goto(`/dashboard/results/${target.classId}/students/${target.studentId}`);
    // The v2 redesign replaced the subskill-card ladder with the nine-row breakdown
    // table (`StudentBreakdownTable`): each row's phase cell holds the bordered pill
    // printing the band WORD, or the kit dash when the sitting left it unassessed.
    const rows = page.locator('[data-slot="student-breakdown-row"]');
    await expect(rows.first()).toBeVisible({ timeout: 90_000 });
    // 9 since spec 4 (af388f51) added Academic Vocabulary as its own row.
    await expect(rows).toHaveCount(9);

    for (const [name, status] of Object.entries(target.statuses)) {
      const row = page.locator(`[data-slot="student-breakdown-row"][data-skill="${name}"]`);
      await expect(row, name).not.toContainText('%');
      const phase = row.locator('[data-slot="student-breakdown-phase"]');
      if (status === 'not_assessed') {
        await expect(phase, name).toHaveText(cat(en, 'TeacherPortal.kit.noValue'));
        continue;
      }
      await expect(phase.locator('span[data-tone]'), name).toHaveText(bandWord(status));
    }
    const critical = page.locator('[data-slot="student-breakdown-row"][data-skill="Critical"]');
    await expect(critical).not.toContainText('%');
    // The exit gate never takes a band: its cell prints EXACTLY the gate word the stored
    // `gate.passed` names, or the dash when the gate is unscored — never a percentage.
    const expectedGate =
      target.gatePassed === 'true'
        ? cat(en, 'TeacherPortal.viewModel.gate.passed')
        : target.gatePassed === 'false'
          ? cat(en, 'TeacherPortal.viewModel.gate.notYet')
          : cat(en, 'TeacherPortal.kit.noValue');
    await expect(critical.locator('[data-slot="student-breakdown-phase"]')).toHaveText(expectedGate);

    // The analysis card is the locked coming-soon placeholder: no generated sentence and no %.
    const analysisCard = page.locator('[data-slot="student-analysis"]');
    await expect(analysisCard).toBeVisible();
    await expect(analysisCard.locator('[data-slot="student-analysis-placeholder"]')).toHaveText(
      cat(en, 'TeacherPortal.student.analysisComingSoon'),
    );
    expect(await analysisCard.innerText()).not.toMatch(/\d+\s*%/);

    // The proof shots are PAGE shots raced against a NODE timer. On this page the
    // capture has been observed to wedge INSIDE the renderer — the live analysis
    // placeholder never settles — and once wedged, Playwright's own screenshot
    // timeout never fires, burning the whole 180s budget after every assertion
    // had already passed. The Node timer always fires, so a wedged capture costs
    // 20s and a loud warning, never the audit's verdict.
    const captureWithDeadline = async (file: string, fullPage = false): Promise<void> => {
      await Promise.race([
        page
          .screenshot({ path: file, animations: 'disabled', timeout: 20_000, fullPage })
          .catch((error: unknown) => console.warn(`[phase-ladder] capture failed: ${String(error).slice(0, 120)}`)),
        new Promise<void>((resolve) => setTimeout(resolve, 20_000).unref?.()),
      ]);
    };
    const shot = path.join(PROOF_DIR, 'teacher-drill-down-subskills.png');
    await captureWithDeadline(shot);
    if (existsSync(shot)) await testInfo.attach('teacher-drill-down-subskills', { path: shot, contentType: 'image/png' });
    const analysis = path.join(PROOF_DIR, 'teacher-drill-down-analysis.png');
    await captureWithDeadline(analysis, true);
    if (existsSync(analysis)) await testInfo.attach('teacher-drill-down-analysis', { path: analysis, contentType: 'image/png' });

    // The Teaching tab's Reading pairs state phases, never a percentage (Spec 04:
    // the `teaching-pairs` card, one `teaching-pair` row per pairing, named
    // lead/learner via data attributes).
    await page.goto(`/dashboard/results/${target.classId}?tab=insights`);
    await expect(page.locator('[data-tab-panel="insights"] [data-slot="teaching-insights"]')).toBeVisible({ timeout: 90_000 });
    const pairs = page.locator('[data-tab-panel="insights"] [data-slot="teaching-pairs"] [data-slot="teaching-pair"]');
    const pairTexts = await pairs.allInnerTexts();
    for (const pair of pairTexts) expect(pair).not.toMatch(/\d+%/);
    testInfo.annotations.push({ type: 'pairs', description: String(pairTexts.length) });
  });

  test('parent view: strength and focus lines name the skill and the phrase, never a percentage', async ({ page }, testInfo) => {
    const target = ladderResult();
    await page.goto(`/dashboard/reports/${target.resultId}`);
    await expect(page.locator('[data-slot="report-attributes"]')).toBeVisible({ timeout: 60_000 });

    await page
      .locator('[data-slot="report-view-toggle"]')
      .getByRole('button', { name: cat(en, 'Report.viewModes.parent') })
      .click();
    const family = page.locator('[data-slot="report-family-preview"]');
    await expect(family).toBeVisible();

    const lines = family.locator('[data-slot="report-family-strength"], [data-slot="report-family-next-step"]');
    await expect(lines.first()).toBeVisible();
    const texts = await lines.allInnerTexts();
    expect(texts.length).toBeGreaterThan(0);
    for (const text of texts) {
      expect(text).not.toContain('%');
      expect(text).not.toMatch(/\{score\}/);
    }
    // Each strength line is exactly "{skill} — {phrase}" from the catalogue.
    const strengths = family.locator('[data-slot="report-family-strength"]');
    for (let index = 0; index < (await strengths.count()); index += 1) {
      const skill = await strengths.nth(index).getAttribute('data-skill');
      const text = await strengths.nth(index).innerText();
      expect(text.startsWith(`${cat(en, `Report.attributes.${skill}`)} — `), text).toBe(true);
      const score = target.attributes[skill ?? '']?.domain_score;
      if (typeof score === 'number') expect(text).not.toMatch(new RegExp(`\\b${score}\\b`));
    }

    const shot = path.join(PROOF_DIR, 'parent-family-lines.png');
    await family.screenshot({ path: shot, animations: 'disabled' });
    await testInfo.attach('parent-family-lines', { path: shot, contentType: 'image/png' });
  });
});
