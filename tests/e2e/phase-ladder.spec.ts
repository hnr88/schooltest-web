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
