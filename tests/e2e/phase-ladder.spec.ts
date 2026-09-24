import { mkdirSync } from 'node:fs';
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
function drillDownTarget(): { classId: string; studentId: string; statuses: Record<string, string> } {
  const row = runSql(
    `with latest as (
       select r.attributes, s.document_id as student, c.document_id as class,
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
     select class, student, attributes::text from latest where rn = 1
      order by (select count(distinct v ->> 'status') from jsonb_each(attributes::jsonb) as e(k, v)
                 where jsonb_typeof(v) = 'object' and v ? 'domain_score') desc
      limit 1`,
  ).split('\n')[0];
  const [classId, studentId, ...rest] = (row ?? '').split('|');
  if (!classId || !studentId) throw new Error(`[e2e] no latest scored reading result for ${TEACHER}`);
  const attributes = JSON.parse(rest.join('|')) as Record<string, { status?: string } | string>;
  const statuses: Record<string, string> = {};
  for (const [name, entry] of Object.entries(attributes)) {
    if (typeof entry === 'object' && entry !== null && typeof entry.status === 'string') statuses[name] = entry.status;
  }
  return { classId, studentId, statuses };
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

  test('teacher drill-down: every subskill card states its phase on the ladder, no percentage', async ({ page }, testInfo) => {
    const target = drillDownTarget();
    testInfo.annotations.push({ type: 'student', description: `${target.classId}/${target.studentId}` });
    await page.goto(`/dashboard/results/${target.classId}/students/${target.studentId}`);
    const cards = page.locator('[data-slot="student-subskill"]');
    await expect(cards.first()).toBeVisible({ timeout: 90_000 });
    // 9 since spec 4 (af388f51) added Academic Vocabulary as its own card.
    await expect(cards).toHaveCount(9);

    for (const [name, status] of Object.entries(target.statuses)) {
      const card = page.locator(`[data-slot="student-subskill"][data-skill="${name}"]`);
      await expect(card, name).not.toContainText('%');
      if (status === 'not_assessed') {
        await expect(card.locator('[data-slot="student-subskill-phase"]'), name).toHaveText(cat(en, 'TeacherPortal.kit.noValue'));
        continue;
      }
      const step = LADDER.indexOf(status as (typeof LADDER)[number]) + 1;
      await expect(card.locator('[data-slot="student-subskill-phase"]'), name).toHaveText(bandWord(status));
      await expect(card.locator('[data-slot="student-subskill-ladder"]'), name).toHaveAttribute('data-step', String(step));
      await expect(card.locator('[data-slot="student-subskill-ladder"] [data-reached="true"]'), name).toHaveCount(step);
    }
    const critical = page.locator('[data-slot="student-subskill"][data-skill="Critical"]');
    await expect(critical).not.toContainText('%');
    await expect(critical.locator('[data-slot="student-subskill-ladder"]')).toHaveCount(0);

    // The analysis names subskills by phase: only the OVERALL sentence carries a %.
    const paragraphs = page.locator('[data-slot="student-analysis"] p');
    const texts = await paragraphs.allInnerTexts();
    for (const text of texts.slice(1)) expect(text).not.toMatch(/\d+%/);

    const subskills = page.locator('[data-slot="student-subskills"]');
    await subskills.scrollIntoViewIfNeeded();
    const shot = path.join(PROOF_DIR, 'teacher-drill-down-subskills.png');
    await subskills.screenshot({ path: shot, animations: 'disabled' });
    await testInfo.attach('teacher-drill-down-subskills', { path: shot, contentType: 'image/png' });
    const analysis = path.join(PROOF_DIR, 'teacher-drill-down-analysis.png');
    await page.locator('[data-slot="student-analysis"]').screenshot({ path: analysis, animations: 'disabled' });
    await testInfo.attach('teacher-drill-down-analysis', { path: analysis, contentType: 'image/png' });

    // The class Insights pairings state phases, never a percentage.
    await page.goto(`/dashboard/results/${target.classId}?tab=insights`);
    await expect(page.locator('[data-tab-panel="insights"] [data-slot="teaching-insights"]')).toBeVisible({ timeout: 90_000 });
    const pairings = page.locator('[data-tab-panel="insights"] [data-insights-section="pairings"]');
    const pairs = await pairings.locator('[data-slot="insights-pair"]').allInnerTexts();
    for (const pair of pairs) expect(pair).not.toMatch(/\d+%/);
    testInfo.annotations.push({ type: 'pairs', description: String(pairs.length) });
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
