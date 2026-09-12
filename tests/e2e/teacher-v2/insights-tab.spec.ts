import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Locator } from '@playwright/test';
import { displaySkillSchema, type DisplaySkill } from '@schooltest/scoring-contracts';

import { apiEnv } from '../helpers/auth-db';
import { loginCached } from '../helpers/http';
import { cat, icu } from '../helpers/i18n';
import {
  AGGREGATE_STATUSES,
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
  expectWeakestFirst,
  expectedGroups,
  expectedKpis,
  expectedPairCount,
  expectedSkill,
  insights,
  latestReadingActivity,
  pageJson,
  parseRoster,
  renderedMastery,
  viewModel,
} from '../helpers/teacher-insights-tab';
import { API_BASE } from '../helpers/teacher-results-live';
import { ACCOUNTS, en, signIn } from '../helpers/teacher-rail';
import { watchErrors } from '../helpers/ui';

// S5 — Teaching insights (Teacher Portal v2.dc.html:723–871; design shots
// class-detail-complete--insights*.png at 1440×900). Real sign-in, real API, no
// interception: every number is compared with a value re-derived in the harness from the
// live responses, and the tab may make no failing request. The school-admin tests prove
// the widened class-diagnostic schema on the analytics screen that shares it.
const PROOFS = path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'teacher-v2');
const pct = (value: number) => icu(insights('percent'), { value: String(value) });
const note = (type: string, value: unknown) => test.info().annotations.push({ type, description: JSON.stringify(value) });
/** The seven teach reading areas, in the order the mastery table columns and the drill-down list them. */
const AREA_CODES = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'] as const;
/** The six skills the Progress panel renders a movement row for — Critical reading is the gate, not a skill. */
const MOVEMENT_SKILLS = ['Decoding', 'Vocabulary', 'Grammar', 'Gist', 'Detail', 'Inference'] as const;

test.use({ viewport: { width: 1440, height: 900 } });

test.describe('S5 — Teaching insights tab', () => {
  test('KPIs, reading mastery, cohort, pairings, groups and activity equal the live API', async ({ page, playwright }) => {
    test.setTimeout(240_000);
    mkdirSync(PROOFS, { recursive: true });
    const errors = watchErrors(page);
    const dashboardPromise = waitForDashboard(page);
    await signIn(page, 'teacher');
    await page.waitForURL('**/dashboard/results');
    const classId = (await dashboardPromise).classes[0].class_document_id;
    setAsideErrors(errors, 'classes-list');

    const failed = failedResponses(page);
    const rosterBody = pageJson(page, `/api/my/students/results?class=${classId}`);
    const activityBody = pageJson(page, /\/api\/sittings\/[^/]+\/activity/);
    await page.goto(`/dashboard/results/${classId}?tab=insights`);
    await expect(frame(page)).toHaveAttribute('data-status', READY, { timeout: 30_000 });
    const panel = page.locator('[data-tab-panel="insights"] [data-slot="teaching-insights"]');
    await expect(panel).toHaveAttribute('data-status', 'ready', { timeout: 30_000 });
    const roster = parseRoster(await rosterBody);
    const kpis = expectedKpis(roster);
    const kpi = (key: string) => panel.locator(`[data-kpi="${key}"]`);
    await expect(panel.getByRole('heading', { level: 2, name: insights('title'), exact: true })).toBeVisible();
    const request = await playwright.request.newContext();
    const jwt = await loginCached(request, API_BASE, { email: ACCOUNTS.teacher.email, password: apiEnv(ACCOUNTS.teacher.secret) });
    const activity = await latestReadingActivity(request, jwt, classId).finally(() => request.dispose());

    // Class average and participation, recomputed from the roster the page received.
    if (kpis.classAverage === null || kpis.participation === null) throw new Error('[e2e] the class has no scored result');
    await expect(kpi('class-average')).toHaveAttribute('data-value', String(kpis.classAverage));
    await expect(kpi('class-average')).toContainText(pct(kpis.classAverage));
    await expect(kpi('participation')).toHaveAttribute('data-value', String(kpis.participation));
    await expect(kpi('participation')).toContainText(pct(kpis.participation));
    await expect(kpi('participation')).toContainText(
      icu(insights('kpi.participationSub'), { scored: String(kpis.scored), total: String(kpis.total) }),
    );
    if (kpis.lastSatAt !== null) {
      await expect(kpi('last-sitting')).toHaveAttribute('data-value', kpis.lastSatAt);
      const month = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(new Date(kpis.lastSatAt));
      await expect(kpi('last-sitting')).toContainText(month);
      if (activity.formCode !== null) await expect(kpi('last-sitting')).toContainText(activity.formCode);
    }

    // Reading mastery: each row's mean, assessed and secure counts from the roster; weakest first.
    const rows = await renderedMastery(panel);
    expect(rows.map((row) => row.skill).sort()).toEqual([...displaySkillSchema.options].sort());
    for (const row of rows) {
      const expected = expectedSkill(roster, row.skill as DisplaySkill);
      expect({ mean: row.mean, assessed: row.assessed, secure: row.secure }, row.skill).toEqual(expected);
    }
    const focus = expectWeakestFirst(rows)[0];
    await expect(kpi('top-gap')).toHaveAttribute('data-value', focus.skill);
    expect(focus.flag).toBe('focus');
    await expect(panel.locator('[data-slot="insights-mastery-row"]').first()).toContainText(viewModel('flag.classFocus'));

    // Cohort: the phase spread counts sum to the scored students.
    const phaseCounts = await panel
      .locator('[data-slot="insights-phase-bar"]')
      .evaluateAll((bars) => bars.map((bar) => Number(bar.getAttribute('data-count'))));
    expect(phaseCounts).toHaveLength(4);
    expect(phaseCounts.reduce((sum, count) => sum + count, 0)).toBe(kpis.scored);

    // Pairings on the class focus, by the design's rule over the live scores.
    const pairings = panel.locator('[data-insights-section="pairings"]');
    const pairCount = expectedPairCount(roster, focus.skill as DisplaySkill);
    const skillLabel = viewModel(`skill.${focus.skill.toLowerCase()}`).toLowerCase();
    await expect(pairings).toHaveAttribute('data-skill', focus.skill);
    await expect(pairings.locator('[data-slot="insights-pair"]')).toHaveCount(pairCount);
    await expect(pairings).toContainText(icu(insights(pairCount > 0 ? 'pairings.intro' : 'pairings.none'), { skill: skillLabel }));

    // Groups: every roster student under their weakest subskill, in display order.
    const groups = panel.locator('[data-slot="insights-group"]');
    const expectedGroupList = expectedGroups(roster);
    await expect(groups).toHaveCount(expectedGroupList.length);
    for (const [index, group] of expectedGroupList.entries()) {
      await expect(groups.nth(index)).toHaveAttribute('data-attribute', group.attribute);
      await expect(groups.nth(index)).toHaveAttribute('data-count', String(group.members.length));
      await expect(groups.nth(index).locator('[data-slot="insights-group-member"]')).toHaveText(group.members);
    }

    // Recent activity: shown only when the latest reading sitting has a trail.
    note('live-expected', { ...kpis, focus: focus.skill, pairCount, groups: expectedGroupList.map((group) => group.attribute), activity });
    const activityCard = panel.locator('[data-insights-section="activity"]');
    if (activity.sittingId !== null) await activityBody;
    if (activity.entries === 0) {
      await expect(activityCard).toHaveCount(0);
    } else {
      await expect(activityCard).toHaveAttribute('data-sitting-id', activity.sittingId ?? '');
      await expect(activityCard.locator('[data-slot="insights-activity-row"]')).toHaveCount(Math.min(3, activity.entries));
    }

    expectNoNewErrors(errors, 'Teaching insights');
    expect(failed, 'no failing request on the Teaching insights tab').toEqual([]);
    const underHeader = async (target: Locator) => {
      const [sticky, box] = [await page.locator('[data-slot="class-detail-sticky"]').boundingBox(), await target.boundingBox()];
      if (sticky === null || box === null) return;
      const top = box.y - (sticky.y + sticky.height) - 16;
      await page.locator('[data-slot="dashboard-content"]').evaluate((element, by) => element.scrollBy({ top: by, behavior: 'instant' }), top);
    };
    await page.screenshot({ path: path.join(PROOFS, 'insights-tab.png'), animations: 'disabled' });
    if (activity.entries > 0) {
      await underHeader(activityCard);
      await page.screenshot({ path: path.join(PROOFS, 'insights-tab-activity.png'), animations: 'disabled' });
    }
    await underHeader(pairings);
    await page.screenshot({ path: path.join(PROOFS, 'insights-tab-scroll.png'), animations: 'disabled' });
    expectNoNewErrors(errors, 'Teaching insights (scrolled)');
  });

  test('school-admin overview: seven labelled reading areas with the live counts, zero console errors', async ({ page }) => {
    test.setTimeout(180_000);
    const errors = watchErrors(page);
    const { bodies, table, failed } = await openSchoolAnalytics(page, errors);
    await expect(table.locator('thead th')).toHaveText([
      cat(en, 'SchoolAdmin.analytics.columns.area'),
      ...AGGREGATE_STATUSES.map((status) => cat(en, `Teach.diagnostic.status.${status}`)),
    ]);
    const rendered = await renderedAggregate(table);
    expect(rendered).toHaveLength(7);
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

    // Drill one click down on a student the live payload bands, and the seven area
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
    await expect(areaRows).toHaveCount(7);
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
          if (skill === 'Vocabulary') return result.vocab.delta_display;
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
