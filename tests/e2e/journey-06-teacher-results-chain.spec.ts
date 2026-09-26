import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import type { RosterRow } from '@/modules/results/types/roster.types';

import {
  CHAIN_SHOTS,
  chartValues,
  checkText,
  classAverageText,
  drillDownPhaseText,
  parseDashboard,
  parseResult,
  parseRoster,
  scoreText,
  studentsPhaseText,
  wireJson,
  type ChainCheck,
} from './helpers/journey-06-chain';
import { JOURNEY_06_VIEWPORT } from './helpers/journey-06-live';
import { cat } from './helpers/i18n';
import { TEACHER_EMAIL } from './helpers/teacher-results-live';
import { en, navLink, signInTeacher } from './helpers/teacher-rail';
import { watchErrors } from './helpers/ui';

/**
 * JOURNEY 06 (part 2) — app → scoring → student result → TEACHER RESULT.
 *
 * Every real result of one teacher's classes, on every teacher results surface:
 * the Classes list average, the Students tab score and ACARA phase, the Reports
 * tab's has-result mark with its PDF affordance, and the student drill-down
 * headline, phase pill and trend chart. Each expected value is the RAW API body
 * that page load received — no expected number lives in this file.
 *
 * Env: `J06_TEACHER` (default the journey teacher), `J06_SHOTS` (screenshots,
 * outside the tracked tree), `J06_ORDERED=resA,resB,resC` (shown scores must rise
 * in that order), `J06_REPORT_RESULT=<result documentId>` (asserts that result's
 * row on the Reports tab renders has-result with its PDF button — the tab no
 * longer releases anything, so nothing is written).
 */
const TEACHER = process.env.J06_TEACHER ?? TEACHER_EMAIL;
const fr = (key: string) => cat(en, `TeacherPortal.familyReports.${key}`);
const shot = (page: Page, name: string) => page.screenshot({ path: path.join(CHAIN_SHOTS, `${name}.png`), fullPage: true });

async function openClassTab(page: Page, classId: string, tab: 'students' | 'reports'): Promise<RosterRow[]> {
  const body = wireJson(page, `/api/my/students/results?class=${classId}`);
  await page.goto(`/dashboard/results/${classId}${tab === 'students' ? '' : '?tab=reports'}`);
  const roster = parseRoster(await body);
  await expect(page.locator('[data-surface="teacher-class-results"]')).toHaveAttribute('data-status', /^(ready|empty)$/, {
    timeout: 60_000,
  });
  return roster;
}

test.describe('journey 06 — the teacher results chain', () => {
  test('every real result shows its API value on every teacher results surface', async ({ page }) => {
    test.setTimeout(900_000);
    mkdirSync(CHAIN_SHOTS, { recursive: true });
    const errors = watchErrors(page);
    const checks: ChainCheck[] = [];
    await page.setViewportSize(JOURNEY_06_VIEWPORT);

    await signInTeacher(page, TEACHER);
    await expect(navLink(page, cat(en, 'Shell.nav.results'))).toBeVisible({ timeout: 30_000 });

    // ── 1. Classes list: each class's reading average is the dashboard's own ──
    const dashBody = wireJson(page, '/api/teacher/dashboard');
    await page.goto('/dashboard/results');
    const classes = parseDashboard(await dashBody).classes;
    for (const card of classes) {
      const cell = page.locator(`[data-slot="results-class-row"][data-class-id="${card.class_document_id}"] td`).nth(1);
      const shown = cell.locator('span > span').first();
      await checkText(checks, shown, { resultId: `class:${card.class_document_id}`, student: card.name, surface: 'classes list · reading' }, classAverageText(card.reading?.average ?? null));
    }
    await shot(page, '01-classes-list');

    for (const card of classes) {
      const classId = card.class_document_id;
      // ── 2. Students tab: score and ACARA phase per roster row ──
      const roster = await openClassTab(page, classId, 'students');
      const results = roster.filter((row) => row.result !== null);
      if (results.length === 0) continue;
      for (const row of roster) {
        const tr = page.locator(`[data-slot="student-results-row"][data-student-id="${row.student.document_id}"]`);
        const meta = { resultId: row.result?.document_id ?? '(none)', student: row.student.name };
        await checkText(checks, tr.locator('[data-slot="student-score"]'), { ...meta, surface: 'students tab · score' }, scoreText(row.result?.overall.domain_score ?? null));
        await checkText(checks, tr.locator('[data-slot="student-phase"]'), { ...meta, surface: 'students tab · ACARA phase' }, studentsPhaseText(row));
      }
      await shot(page, `02-${classId}-students`);

      // ── 3. Reports tab: has-result and the PDF affordance per roster row ──
      const reportsRoster = await openClassTab(page, classId, 'reports');
      for (const row of reportsRoster) {
        const item = page.locator(`[data-slot="reports-student-row"][data-student-id="${row.student.document_id}"]`);
        const meta = { resultId: row.result?.document_id ?? '(none)', student: row.student.name };
        const hasResult = row.result !== null;
        await expect(item, `reports row ${meta.student}`).toHaveAttribute(
          'data-has-result',
          hasResult ? 'true' : 'false',
          { timeout: 30_000 },
        );
        checks.push({
          ...meta,
          surface: 'reports tab · has result',
          shown: (await item.getAttribute('data-has-result')) ?? '',
          api: hasResult ? 'true' : 'false',
        });
        if (hasResult && row.result?.overall.domain_score !== null) {
          await expect(item.locator('[data-slot="reports-student-pdf"]'), `PDF button for ${meta.student}`).toBeVisible({
            timeout: 30_000,
          });
          checks.push({ ...meta, surface: 'reports tab · pdf button', shown: 'visible', api: 'result present' });
        } else {
          await checkText(
            checks,
            item.locator('[data-slot="reports-no-result"]'),
            { ...meta, surface: 'reports tab · no result yet' },
            fr('students.noResultYet'),
          );
        }
      }
      await shot(page, `03-${classId}-family-reports`);

      // ── 4. Drill-down: headline, phase pill and trend chart from C-4 ──
      for (const row of results) {
        const c4 = wireJson(page, '/api/results/');
        await page.goto(`/dashboard/results/${classId}/students/${row.student.document_id}`);
        const view = parseResult(await c4);
        await expect(page.locator('[data-surface="teacher-student-drill-down"]')).toHaveAttribute('data-status', 'success', { timeout: 60_000 });
        const meta = { resultId: view.document_id, student: row.student.name };
        const score = view.overall.domain_score;
        const headline = page.locator('[data-slot="student-overall-score"]');
        if (score === null) await expect(headline.filter({ hasText: /\d/ }), `no headline score for ${meta.student}`).toHaveCount(0);
        else await checkText(checks, headline, { ...meta, surface: 'drill-down · overall' }, scoreText(score));
        // The v2 header's ACARA phase stat card: a large text value (no chip) printing the
        // phase word; an unplaced result prints the kit dash and carries no data-phase.
        const phaseValue = page.locator('[data-slot="student-stat-phase-value"]');
        const phase = drillDownPhaseText(view);
        if (phase === null) {
          await expect(phaseValue).toHaveText(cat(en, 'TeacherPortal.kit.noValue'));
          await expect(phaseValue).not.toHaveAttribute('data-phase', /.*/);
        } else {
          await checkText(checks, phaseValue, { ...meta, surface: 'drill-down · ACARA phase' }, phase);
        }
        await expect(page.locator('[data-slot="student-stat-phase"] [data-slot="status-pill"]')).toHaveCount(0);
        const points = page.locator('[data-slot="student-chart-point"]');
        await expect(points).toHaveCount(chartValues(view).length, { timeout: 30_000 });
        const plotted = (await points.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-value') ?? ''))).join(',');
        checks.push({ ...meta, surface: 'drill-down · trend points', shown: plotted, api: chartValues(view).join(',') });
        expect(plotted, `trend chart for ${meta.student}`).toBe(chartValues(view).join(','));
        await shot(page, `04-${classId}-${view.document_id}-drill-down`);
      }
    }

    // ── 5. Opt-in: the ordering of named results as SHOWN (below < middle < above) ──
    const ordered = (process.env.J06_ORDERED ?? '').split(',').filter(Boolean);
    if (ordered.length > 1) {
      const shownScore = (id: string) => Number(checks.find((c) => c.resultId === id && c.surface === 'students tab · score')?.shown.replace('%', ''));
      const scores = ordered.map(shownScore);
      expect(scores.every((value) => Number.isFinite(value)), `every ordered result is scored and shown: ${scores}`).toBe(true);
      for (let i = 1; i < scores.length; i += 1) expect(scores[i], `${ordered[i]} above ${ordered[i - 1]}`).toBeGreaterThan(scores[i - 1]);
    }

    // ── 6. Opt-in: a named result's Reports-tab row renders has-result with its PDF button ──
    const reportResultId = process.env.J06_REPORT_RESULT;
    if (reportResultId) {
      const card = classes.find((entry) => checks.some((c) => c.resultId === reportResultId && c.surface === 'reports tab · has result'));
      expect(card, `${reportResultId} is a result of ${TEACHER}'s classes`).toBeDefined();
      const roster = await openClassTab(page, card!.class_document_id, 'reports');
      const holder = roster.find((entry) => entry.result?.document_id === reportResultId);
      expect(holder, `${reportResultId} sits on ${card!.class_document_id}'s roster`).toBeDefined();
      const row = page.locator(`[data-slot="reports-student-row"][data-student-id="${holder?.student.document_id}"]`);
      await expect(row).toHaveAttribute('data-has-result', 'true', { timeout: 30_000 });
      await expect(row.locator('[data-slot="reports-student-pdf"]')).toBeVisible();
      await shot(page, '05-report-result-row');
    }

    writeFileSync(path.join(CHAIN_SHOTS, 'checks.json'), JSON.stringify(checks, null, 2));
    test.info().annotations.push({ type: 'checks', description: String(checks.length) });
    expect(errors.filter((line) => /MISSING_MESSAGE|pageerror/.test(line)), 'no missing message or page error').toEqual([]);
  });
});
