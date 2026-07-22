import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { deleteAuthEmailRows } from './helpers/auth-db';
import { cat, icu, loadMessages } from './helpers/i18n';
import { loginParentJwt, registerAndConfirmParent } from './helpers/throwaway-parent';
import { watchErrors } from './helpers/ui';

const en = loadMessages('en');
const API_BASE_URL = 'http://localhost:5500';
const PARENT = { email: 'parent@schooltest.local', password: 'Parent1234!' };
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const usedEmails: string[] = [];

interface ParentStudent {
  documentId: string;
  given_name: string;
  family_name: string;
}

async function signInAs(
  page: import('@playwright/test').Page,
  request: import('@playwright/test').APIRequestContext,
  identifier: string,
  password: string,
): Promise<string> {
  const response = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier, password },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const { jwt } = (await response.json()) as { jwt: string };
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
  return jwt;
}

async function firstChild(
  request: import('@playwright/test').APIRequestContext,
  jwt: string,
): Promise<ParentStudent> {
  const response = await request.get(`${API_BASE_URL}/api/my/students`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = (await response.json()) as { data: ParentStudent[] };
  expect(body.data.length).toBeGreaterThan(0);
  return body.data[0];
}

test.afterAll(() => {
  for (const email of usedEmails) deleteAuthEmailRows(email);
});

test('en: child cards open a real persisted profile with metrics and an honest results state', async ({
  page,
  request,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await signInAs(page, request, PARENT.email, PARENT.password);
  await page.goto('/dashboard/children');

  await expect(page.locator('[data-surface="children-roster"]')).toBeVisible();
  await expect(page.locator('[data-slot="children-roster-summary"]')).toBeVisible();

  const card = page.getByRole('article', {
    name: icu(cat(en, 'Children.childCardLabel'), { name: 'Mia Keller' }),
  });
  await expect(card).toBeVisible();
  const profileResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/api/my/students/') && response.url().endsWith('/progress'),
  );
  await card
    .getByRole('link', { name: icu(cat(en, 'Children.viewProfileLabel'), { name: 'Mia Keller' }) })
    .click();
  const response = await profileResponse;
  expect(response.status(), await response.text()).toBe(200);

  await expect(page.getByRole('heading', { level: 1, name: 'Mia Keller' })).toBeVisible();
  await expect(page.locator('[data-surface="child-learning-dashboard"]')).toBeVisible();
  await expect(page.locator('[data-slot="child-results-timeline"]')).toBeVisible();

  // The four counts moved OUT of a white metrics panel of MiniStatTiles and into
  // the canonical hero stat strip (App Screens 2h:2938 renders them as unboxed
  // text). Same four labels, same four values — but asserted against the metrics
  // THIS response actually carried instead of the literal "0" the seed happened to
  // hold when this test was written, so a data drift can no longer make the
  // no-fabricated-data guarantee pass by coincidence.
  const progress = (await response.json()) as {
    data: { metrics: Record<string, number> };
  };
  const strip = page.locator('[data-slot="child-learning-hero"] [data-slot="stat-strip"]');
  await expect(strip).toHaveAttribute('aria-label', cat(en, 'Children.metricsHeading'));
  const expected: [string, number][] = [
    ['metricTotalSessions', progress.data.metrics.totalSessions],
    ['metricCompletedSessions', progress.data.metrics.completedSessions],
    ['metricActiveSessions', progress.data.metrics.activeSessions],
    ['metricOfficialResults', progress.data.metrics.officialResults],
  ];
  await expect(strip.locator('dt')).toHaveText(expected.map(([key]) => cat(en, `Children.${key}`)));
  await expect(strip.locator('dd')).toHaveText(expected.map(([, value]) => String(value)));

  // The gauge that printed "—" over "0/0" is gone; when the API reports sessions
  // its ratio is the hero's canonical CompletionCell, and when it reports none the
  // line is absent rather than drawn empty.
  const sessions = page.locator('[data-slot="child-learning-summary"]');
  if (progress.data.metrics.totalSessions > 0) {
    await expect(sessions).toBeVisible();
    await expect(sessions.locator('[data-slot="completion-cell"]')).toHaveAttribute(
      'aria-valuetext',
      `${progress.data.metrics.completedSessions}/${progress.data.metrics.totalSessions}`,
    );
  } else {
    await expect(sessions).toHaveCount(0);
  }

  await expect(
    page.getByRole('heading', { level: 2, name: cat(en, 'Children.recentResultsHeading') }),
  ).toBeVisible();
  await expect(page.getByText(cat(en, 'Children.emptyResults'), { exact: true })).toBeVisible();

  // RE-TARGETED for the portal design: the child detail has NO tabs
  // (.qa/design/spec/02-portal-children.md §B — "There are NO tabs on this
  // screen"), so the progress blocks and the enrolment/guardian record are ONE
  // vertical stack. Same guarantee as before — the record is reachable — asserted
  // without a tab click.
  await expect(page.locator('[data-slot="child-progress-panel"]')).toBeVisible();
  await expect(page.locator('[data-slot="child-level-journey"]')).toBeVisible();
  await expect(page.locator('[data-slot="child-skill-breakdown"]')).toBeVisible();
  await expect(page.getByRole('tab', { name: cat(en, 'Children.tabRecord') })).toHaveCount(0);
  await expect(page.locator('[data-slot="child-record-panel"]')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: cat(en, 'Children.enrolmentHeading') }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: cat(en, 'Children.guardianHeading') }),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Mia Keller' })).toBeVisible();
  await expect(strip.locator('dd').last()).toHaveText(
    String(progress.data.metrics.officialResults),
  );
  await page.screenshot({ path: path.join(SCREENSHOTS, 'child-profile-en.png') });

  const results = await new AxeBuilder({ page }).analyze();
  const blockers = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(blockers, 'child profile accessibility').toEqual([]);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('en: child cards remain usable at mobile width', async ({ page, request }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await signInAs(page, request, PARENT.email, PARENT.password);
  await page.goto('/dashboard/children');

  await page
    .getByRole('link', {
      name: icu(cat(en, 'Children.viewProfileLabel'), { name: 'Mia Keller' }),
    })
    .click();
  await expect(page.locator('[data-surface="child-learning-dashboard"]')).toBeVisible();
  // Same surface, asserted through the blocks the portal design stacks it from.
  await expect(page.locator('[data-slot="child-learning-hero"]')).toBeVisible();
  await expect(page.locator('[data-slot="child-level-journey"]')).toBeVisible();
  await expect(page.locator('[data-slot="child-progress-panel"]')).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
});

test('en: a foreign child profile remains unavailable to another real parent', async ({
  page,
  request,
}) => {
  const parentJwt = await signInAs(page, request, PARENT.email, PARENT.password);
  const child = await firstChild(request, parentJwt);
  const foreignParent = await registerAndConfirmParent(request, 'child-profile-foreign');
  usedEmails.push(foreignParent.email);
  const foreignJwt = await loginParentJwt(request, foreignParent);
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, foreignJwt);

  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith(`/api/my/students/${child.documentId}/progress`),
  );
  await page.goto(`/dashboard/children/${child.documentId}`);
  const response = await responsePromise;
  expect(response.status(), await response.text()).toBe(404);
  await expect(page.locator('[data-slot="query-error-fallback"]')).toHaveAttribute(
    'data-query-error',
    'gone',
  );
  await expect(page.getByText(cat(en, 'Children.profileGoneTitle'), { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: cat(en, 'Children.backToList') })).toBeVisible();
});
