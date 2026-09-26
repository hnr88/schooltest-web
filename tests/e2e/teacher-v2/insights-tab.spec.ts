import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { readFileSync } from 'node:fs';

import { expect, test, type Download, type Locator } from '@playwright/test';

import { cat, icu } from '../helpers/i18n';
import {
  AGGREGATE_STATUSES,
  AREA_CODES,
  areaLabel,
  expectedAggregate,
  expectedMasteryTable,
  failedResponses,
  openBandedClass,
  openSchoolAnalytics,
  renderedAggregate,
  renderedMasteryTable,
} from '../helpers/school-admin-diagnostic';
import { READY, expectNoNewErrors, frame, setAsideErrors, waitForDashboard } from '../helpers/teacher-class-detail';
import {
  expectedGateSummary,
  expectedLargestGapSkill,
  expectedNextSteps,
  expectedPairs,
  expectedStrandGroups,
  expectedSummaryCounts,
  insights,
  pageJson,
  parseRoster,
  SKILL_LABEL_KEY,
  viewModel,
} from '../helpers/teacher-insights-tab';
import { en, signIn } from '../helpers/teacher-rail';
import { watchErrors } from '../helpers/ui';

// S5 — the TEACHING tab (spec 04: `live_feedback_2/spec-teacher-portal-04-teaching.md`,
// mock `04 Teaching.html`). Real sign-in, real API, no interception: every number is
// compared with a value re-derived in the harness from the live roster the page received,
// and the tab may make no failing request. The tab is ROSTER-ONLY — it reads no sittings
// list and no class diagnostic (§0/§1), and Critical reading appears only as the exit-gate
// chip (§3f), never as a group or a pill. The school-admin tests prove the widened
// class-diagnostic schema on the analytics screen that shares it.
const PROOFS = path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'teacher-v2');
const note = (type: string, value: unknown) => test.info().annotations.push({ type, description: JSON.stringify(value) });
/** The seven skills the Progress panel renders a movement row for — Critical reading is the gate, not a skill. */
const MOVEMENT_SKILLS = ['Decoding', 'Vocab_A2', 'Grammar', 'Vocab_B1', 'Gist', 'Detail', 'Inference'] as const;

test.use({ viewport: { width: 1440, height: 900 } });

test.describe('S5 — Teaching tab', () => {
  test('strand cards, exit-gate chip, reading pairs and next steps equal the live roster', async ({ page }) => {
    test.setTimeout(240_000);
    mkdirSync(PROOFS, { recursive: true });
    const errors = watchErrors(page);
    const dashboardPromise = waitForDashboard(page);
    await signIn(page, 'teacher');
    await page.waitForURL('**/dashboard/results');
    const classId = (await dashboardPromise).classes[0].class_document_id;
    setAsideErrors(errors, 'classes-list');

    const failed = failedResponses(page);
    // Roster-only (§0/§1): the tab never reads the class diagnostic.
    const diagnosticReads: string[] = [];
    page.on('request', (request) => {
      if (/\/diagnostic\b/.test(new URL(request.url()).pathname)) diagnosticReads.push(request.url());
    });
    const rosterBody = pageJson(page, `/api/my/students/results?class=${classId}`);
    await page.goto(`/dashboard/results/${classId}?tab=insights`);
    await expect(frame(page)).toHaveAttribute('data-status', READY, { timeout: 30_000 });
    const panel = page.locator('[data-tab-panel="insights"] [data-slot="teaching-insights"]');
    await expect(panel).toHaveAttribute('data-status', 'ready', { timeout: 30_000 });
    const roster = parseRoster(await rosterBody);
    const counts = expectedSummaryCounts(roster);
    if (counts.n === 0) throw new Error('[e2e] the class has no scored result');

    // Header: "Teaching" and the one-line wired summary. No week chip, no week phrasing (§0.1).
    await expect(panel.getByRole('heading', { level: 2, name: insights('title'), exact: true })).toBeVisible();
    const plural = (count: number, one: string, other: string) => `${count} ${count === 1 ? one : other}`;
    const summaryText = icu(
      insights('teaching.summary')
        .replace('{f, plural, one {# foundations group} other {# foundations groups}}', plural(counts.f, 'foundations group', 'foundations groups'))
        .replace('{p, plural, one {# reading pair} other {# reading pairs}}', plural(counts.p, 'reading pair', 'reading pairs'))
        .replace('{n, plural, one {# student} other {# students}}', plural(counts.n, 'student', 'students')),
      { v: String(counts.v), c: String(counts.c) },
    );
    await expect(panel.locator('[data-slot="teaching-summary"]')).toHaveText(summaryText);
    await expect(panel).not.toContainText(/Week of/i);

    // "Whole class": THREE cards — Vocabulary, Comprehension (Gist/Detail/Inference only)
    // and the new Foundations (Decoding/Grammar) — one group row per limiting subskill,
    // in strand order, every scored student placed by furthest-below-mean (§3b).
    const groupsByStrand = expectedStrandGroups(roster);
    for (const strand of ['vocabulary', 'comprehension', 'foundations'] as const) {
      const card = panel.locator(`[data-slot="teaching-strand-card"][data-strand="${strand}"]`);
      await expect(card).toBeVisible();
      await expect(card).toContainText(insights(`teaching.strands.${strand}`));
      await expect(card).toContainText(insights(`teaching.strands.${strand}Sub`));
      const groupRows = card.locator('[data-slot="teaching-group"]');
      const expected = groupsByStrand[strand];
      await expect(groupRows).toHaveCount(expected.length);
      for (const [index, group] of expected.entries()) {
        expect(group.skill, 'Critical reading is never a phase group (§0.1)').not.toBe('Critical');
        await expect(groupRows.nth(index)).toHaveAttribute('data-skill', group.skill);
        await expect(groupRows.nth(index)).toHaveAttribute('data-count', String(group.members.length));
        await expect(groupRows.nth(index)).toHaveAttribute('title', group.members.join(', '));
        await expect(groupRows.nth(index)).toContainText(insights(`teaching.skills.${group.skill}`));
        if (group.phase === null) await expect(groupRows.nth(index)).not.toHaveAttribute('data-phase', /.*/);
        else await expect(groupRows.nth(index)).toHaveAttribute('data-phase', group.phase);
      }
    }

    // The Critical reading exit-gate chip (§3f): true vs false gate counts on the
    // Comprehension card — a chip, never a group row or a next-step pill.
    const gate = expectedGateSummary(roster);
    const gateChip = panel.locator('[data-slot="teaching-gate"]');
    await expect(gateChip).toHaveAttribute('data-passed', String(gate.passed));
    await expect(gateChip).toHaveAttribute('data-not-yet', String(gate.notYet));
    await expect(gateChip).toContainText(icu(insights('teaching.gate.passed'), { count: String(gate.passed) }));
    await expect(gateChip).toContainText(icu(insights('teaching.gate.notYet'), { count: String(gate.notYet) }));

    // Reading pairs on the class's largest-gap subskill, named in the intro (§3c).
    const gapSkill = expectedLargestGapSkill(roster);
    const expectedPairsList = gapSkill === null ? [] : expectedPairs(roster, gapSkill);
    const pairRows = panel.locator('[data-slot="teaching-pair"]');
    await expect(pairRows).toHaveCount(expectedPairsList.length);
    const pairsCard = panel.locator('[data-slot="teaching-pairs"]');
    if (gapSkill === null || expectedPairsList.length === 0) {
      await expect(pairsCard).toContainText(insights('teaching.pairs.empty'));
    } else {
      await expect(pairsCard).toContainText(
        icu(insights('teaching.pairs.intro'), { skill: viewModel(SKILL_LABEL_KEY[gapSkill]) }),
      );
      for (const [index, pair] of expectedPairsList.entries()) {
        await expect(pairRows.nth(index)).toHaveAttribute('data-lead', pair.lead);
        await expect(pairRows.nth(index)).toHaveAttribute('data-learner', pair.learner);
      }
    }

    // Next steps: one row per scored student, TWO pills (vocabulary + comprehension —
    // never Foundations, never Critical), coloured by the CURRENT band and naming the
    // NEXT phase, ending in "Extend" past Consolidating (§3d).
    const expectedSteps = expectedNextSteps(roster);
    const stepRows = panel.locator('[data-slot="teaching-next-step"]');
    await expect(stepRows).toHaveCount(expectedSteps.length);
    const phaseLabel = (phase: string) =>
      phase === 'Extend' ? insights('teaching.nextSteps.extend') : viewModel(`phase.${phase.toLowerCase()}`);
    for (const [index, step] of expectedSteps.entries()) {
      await expect(stepRows.nth(index)).toHaveAttribute('data-student', step.studentId);
      await expect(stepRows.nth(index)).toContainText(step.firstName);
      const expectedPills = [step.vocabulary, step.comprehension].filter((target) => target !== null);
      const pills = stepRows.nth(index).locator('[data-slot="teaching-pill"]');
      await expect(pills).toHaveCount(expectedPills.length);
      for (const [pillIndex, target] of expectedPills.entries()) {
        await expect(pills.nth(pillIndex)).toHaveAttribute('data-skill', target!.skill);
        await expect(pills.nth(pillIndex)).toHaveAttribute('data-phase', target!.phase);
        await expect(pills.nth(pillIndex)).toContainText(
          icu(insights(target!.skill.startsWith('Vocab_') ? 'teaching.nextSteps.vocabularyTarget' : 'teaching.nextSteps.target'), {
            skill: insights(`teaching.skills.${target!.skill}`),
            phase: phaseLabel(target!.nextPhase),
          }),
        );
      }
      // The per-student prompt button names the student — the DOWNLOADED prompt must not (§3e).
      await expect(stepRows.nth(index).locator('[data-slot="teaching-prompt"]')).toHaveAttribute(
        'title',
        icu(insights('teaching.prompt.student'), { name: step.firstName }),
      );
    }

    // Every prompt button ships: three strand prompts, "Prompt for all", one per student.
    await expect(panel.locator('[data-slot="teaching-prompt"]')).toHaveCount(4 + expectedSteps.length);
    for (const strand of ['vocabulary', 'comprehension', 'foundations']) {
      await expect(panel.locator(`[data-slot="teaching-prompt"][data-scope="strand:${strand}"]`)).toBeVisible();
    }
    await expect(panel.locator('[data-slot="teaching-prompt"][data-scope="all"]')).toContainText(insights('teaching.prompt.all'));

    // Prompt downloads (§3e): a strand prompt and a per-student prompt download as .md files that
    // carry no roster first or last name (per-student files are named by index + initials).
    const rosterNames = [
      ...new Set(
        roster.flatMap((row) => {
          const parts = row.student.name.trim().split(/\s+/);
          return [parts[0], parts[parts.length - 1]];
        }),
      ),
    ].filter((part) => part !== undefined && part.length > 1);
    const readDownload = async (download: Download): Promise<string> => {
      const file = await download.path();
      return readFileSync(file, 'utf8');
    };
    const expectNameFree = (body: string, what: string) => {
      for (const part of rosterNames) {
        expect(body, `${what} must not carry the roster name "${part}"`).not.toMatch(new RegExp(`\\b${part}\\b`));
      }
    };
    const strandButton = panel
      .locator('[data-slot="teaching-prompt"][data-scope^="strand:"]:not([disabled])')
      .first();
    await expect(strandButton, 'at least one strand has groups to prompt for').toHaveCount(1);
    const strand = ((await strandButton.getAttribute('data-scope')) ?? '').replace('strand:', '');
    await expect(strandButton).toHaveAttribute(
      'aria-label',
      icu(insights('teaching.prompt.strandFor'), { strand: insights(`teaching.strands.${strand}`) }),
    );
    const [strandDownload] = await Promise.all([page.waitForEvent('download'), strandButton.click()]);
    expect(strandDownload.suggestedFilename()).toBe(`teaching-prompt-${strand}.md`);
    const strandBody = await readDownload(strandDownload);
    expect(strandBody.length).toBeGreaterThan(0);
    expectNameFree(strandBody, `the ${strand} strand prompt`);
    for (const empty of ['vocabulary', 'comprehension', 'foundations'].filter((name) => groupsByStrand[name as 'vocabulary'].length === 0)) {
      await expect(panel.locator(`[data-slot="teaching-prompt"][data-scope="strand:${empty}"]`), `${empty} has no groups`).toBeDisabled();
    }

    const firstStep = expectedSteps[0];
    const firstRow = roster.find((row) => row.student.document_id === firstStep.studentId);
    const initials = (firstRow?.student.initials ?? '').toLowerCase();
    const [studentDownload] = await Promise.all([
      page.waitForEvent('download'),
      stepRows.first().locator('[data-slot="teaching-prompt"]').click(),
    ]);
    expect(studentDownload.suggestedFilename()).toBe(`teaching-prompt-student-1-${initials}.md`);
    const studentBody = await readDownload(studentDownload);
    expect(studentBody).toContain(`## Student ${firstRow?.student.initials ?? ''}`);
    expectNameFree(studentBody, 'the per-student prompt');
    expect(diagnosticReads, 'the Teaching tab never reads the class diagnostic').toEqual([]);

    note('live-expected', { counts, gate, gapSkill, pairs: expectedPairsList, steps: expectedSteps.length });
    expectNoNewErrors(errors, 'Teaching tab');
    expect(failed, 'no failing request on the Teaching tab').toEqual([]);
    const underHeader = async (target: Locator) => {
      const [sticky, box] = [await page.locator('[data-slot="class-detail-sticky"]').boundingBox(), await target.boundingBox()];
      if (sticky === null || box === null) return;
      const top = box.y - (sticky.y + sticky.height) - 16;
      await page.locator('[data-slot="dashboard-content"]').evaluate((element, by) => element.scrollBy({ top: by, behavior: 'instant' }), top);
    };
    await page.screenshot({ path: path.join(PROOFS, 'insights-tab.png'), animations: 'disabled' });
    await underHeader(panel.locator('[data-slot="teaching-next-steps"]'));
    await page.screenshot({ path: path.join(PROOFS, 'insights-tab-scroll.png'), animations: 'disabled' });
    expectNoNewErrors(errors, 'Teaching tab (scrolled)');
  });

  test('school-admin overview: eight labelled reading areas with the live counts, zero console errors', async ({ page }) => {
    test.setTimeout(180_000);
    const errors = watchErrors(page);
    const { bodies, table, failed } = await openSchoolAnalytics(page, errors);
    await expect(table.locator('thead th')).toHaveText([
      cat(en, 'SchoolAdmin.analytics.columns.area'),
      ...AGGREGATE_STATUSES.map((status) => cat(en, `Teach.diagnostic.status.${status}`)),
    ]);
    const rendered = await renderedAggregate(table);
    expect(rendered).toHaveLength(AREA_CODES.length);
    expect(rendered).toEqual(expectedAggregate(bodies).map((row) => ({ label: areaLabel(row.code), cells: row.counts.map(String) })));
    note('aggregate', rendered);
    await page.screenshot({ path: path.join(PROOFS, 'insights-school-admin-analytics.png'), animations: 'disabled' });
    expectNoNewErrors(errors, 'school-admin analytics overview');
    expect(failed, 'no failing request on the analytics overview').toEqual([]);
  });

  test('school-admin drill-down: GroupPanel labels every live group through its reading area', async ({ page }) => {
    test.setTimeout(180_000);
    const { bodies } = await openSchoolAnalytics(page, watchErrors(page));
    const messages: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (message) => messages.push(message.text()));
    page.on('pageerror', (error) => pageErrors.push(error.message));
    const target = await openBandedClass(page, bodies);
    const groupPanel = page.locator('[data-slot="group-panel"]');
    for (const group of target.groups) await expect(groupPanel).toContainText(areaLabel(group.limiting_attribute));
    await expect(groupPanel).not.toContainText('Teach.diagnostic.areas.');
    await page.screenshot({ path: path.join(PROOFS, 'insights-school-admin-class.png'), animations: 'disabled' });
    expect(messages.filter((message) => message.includes('MISSING_MESSAGE')), 'no missing catalog message').toEqual([]);
    expect(pageErrors, 'no page error').toEqual([]);
  });

  // FX-TB12 — the other half of TB-12. The mastery grid and the student drill-down
  // looked their cells up by area code R1..R7 while the live diagnostic names a scored
  // student's cells by model attribute, so every cell of a scored class was an em dash
  // on this screen; the drill-down printed raw catalog keys and listed Vocabulary twice.
  // Progress renders on the same screen, where ProgressMovementRow called two
  // `Teach.progress` keys that existed in no catalogue.
  test('TB-12: the school-admin mastery table and student drill-down carry the live statuses', async ({ page }) => {
    test.setTimeout(180_000);
    mkdirSync(PROOFS, { recursive: true });
    const errors = watchErrors(page);
    const missing: string[] = [];
    page.on('console', (message) => {
      if (message.text().includes('MISSING_MESSAGE')) missing.push(message.text());
    });
    const { bodies, failed } = await openSchoolAnalytics(page, errors);
    const rosterBody = pageJson(page, '/api/my/students/results?class=');
    const target = await openBandedClass(page, bodies);

    // Every column is a labelled reading area, never a raw code.
    const mastery = page.locator('[data-slot="mastery-table"]');
    await expect(mastery).toBeVisible();
    for (const code of AREA_CODES) {
      await expect(mastery).toContainText(areaLabel(code));
    }
    await expect(mastery).not.toContainText('Teach.diagnostic.areas.');
    await expect(mastery).not.toContainText('Teach.diagnostic.status.');

    // Every cell equals the status re-derived in the harness from the diagnostic the page got.
    const expectedRows = expectedMasteryTable(target);
    await expect(mastery.locator('[data-directory-row]')).toHaveCount(expectedRows.length);
    const renderedRows = await renderedMasteryTable(mastery);
    expect(renderedRows).toEqual(expectedRows);
    note('mastery-rows', renderedRows);

    // The bug this closes: a scored class showed nothing but em dashes.
    const banded = renderedRows.flatMap((row) => row.areas).filter((status) => status !== 'none' && status !== 'not_assessed');
    expect(banded.length, 'the banded class renders real statuses, not a wall of em dashes').toBeGreaterThan(0);

    // Drill one click down on a student the live payload bands, and the eight area
    // rows carry exactly the statuses their table row carried.
    const drillIndex = expectedRows.findIndex((row) => row.areas.some((status) => status !== 'none' && status !== 'not_assessed'));
    const drillRef = expectedRows[drillIndex]!;
    const drillRow = mastery.locator('[data-directory-row]').nth(drillIndex);
    await expect(drillRow.locator('[data-row-select]')).toHaveText(drillRef.ref);
    await drillRow.locator('[data-row-select]').scrollIntoViewIfNeeded();
    await drillRow.locator('[data-row-select]').click();
    const drilldown = page.locator('[data-slot="student-mastery-drilldown"]');
    await expect(drilldown).toBeVisible();
    await expect(drilldown).toContainText(drillRef.ref);
    const areaRows = drilldown.locator('[data-slot="drilldown-area"]');
    await expect(areaRows).toHaveCount(AREA_CODES.length);
    expect(
      await areaRows.evaluateAll((rows) => rows.map((row) => row.getAttribute('data-status') ?? '')),
    ).toEqual(drillRef.areas);
    await expect(areaRows).toHaveText(AREA_CODES.map((code) => new RegExp(`^${areaLabel(code)}`)));
    note('drilldown', drillRef);

    // Progress is on the same screen. ProgressMovementRow called `Teach.progress.notYetAssessed`
    // and `Teach.progress.transitionSteadyShort`, which no catalogue carried — a MISSING_MESSAGE
    // for every gap row and every "steady" row. Both branches are asserted against the movement
    // the SERVER rendered on the roster this page received; nothing here recomputes a delta.
    const progress = page.locator('[data-surface="teacher-progress"]');
    await expect(progress).toBeVisible();
    const movements = progress.locator('[data-slot="progress-movement"]');
    const deltas = parseRoster(await rosterBody)
      .flatMap((row) => (row.result === null ? [] : [row.result]))
      .flatMap((result) =>
        MOVEMENT_SKILLS.map((skill) => {
          const entry = result.attributes[skill];
          return entry === undefined || entry.status === 'not_assessed' ? null : entry.delta_display;
        }),
      );
    expect(deltas.length, 'the scored class carries server-rendered movement').toBeGreaterThan(0);
    await expect(movements).toHaveCount(deltas.length);
    const withText = (key: string) => movements.filter({ hasText: cat(en, `Teach.progress.${key}`) });
    if (deltas.some((delta) => delta === null)) await expect(withText('notYetAssessed').first()).toBeVisible();
    if (deltas.some((delta) => delta === 'steady')) await expect(withText('transitionSteadyShort').first()).toBeVisible();
    note('progress-deltas', { rows: deltas.length, steady: deltas.filter((d) => d === 'steady').length, gaps: deltas.filter((d) => d === null).length });
    await expect(progress).not.toContainText('Teach.progress.');

    await page.screenshot({ path: path.join(PROOFS, 'sa-analytics-mastery.png'), animations: 'disabled' });
    await drilldown.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(PROOFS, 'sa-analytics-drilldown.png'), animations: 'disabled' });
    await movements.first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(PROOFS, 'sa-analytics-progress.png'), animations: 'disabled' });
    expect(missing, 'no MISSING_MESSAGE on the school-admin analytics drill-down').toEqual([]);
    expectNoNewErrors(errors, 'school-admin analytics drill-down (TB-12)');
    expect(failed, 'no failing request on the analytics drill-down').toEqual([]);
  });

  test('TB-21: the school-admin drill-down loads Progress — B6 admits a school_admin to the canonical roster read', async ({ page }) => {
    const errors = watchErrors(page);
    const { bodies, failed } = await openSchoolAnalytics(page, errors);
    await openBandedClass(page, bodies);
    await expect(page.locator('[data-surface="teacher-progress"]')).toBeVisible();
    expectNoNewErrors(errors, 'school-admin class drill-down');
    expect(failed, 'no failing request on the class drill-down').toEqual([]);
  });
});
