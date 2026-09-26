import { expect, test } from '@playwright/test';

import { cat, loadMessages, type AnyLocale } from './helpers/i18n';
import {
  READY,
  TABS,
  frame,
  label,
  sectionTabs,
  waitForDashboard,
} from './helpers/teacher-class-detail';
import { en, navLink, signIn } from './helpers/teacher-rail';

// Spec 01 §3 — the portal-wide label renames as VALUES only: "Live sessions" →
// "Test sessions", "Family reports" → "Reports", "Teaching insights" → "Teaching".
// The first test drives the real seeded teacher: the rail entry and the six class
// tabs in order. The second pins every one of the six catalogs, so no locale can
// quietly keep the old name (keys untouched).
const RENAMED = {
  en: {
    progress: 'Progress',
    insights: 'Teaching',
    reports: 'Reports',
    live: 'Test sessions',
  },
  zh: { progress: '进步情况', insights: '教学', reports: '报告', live: '测试场次' },
  ms: {
    progress: 'Kemajuan',
    insights: 'Pengajaran',
    reports: 'Laporan',
    live: 'Sesi ujian',
  },
  ko: { progress: '향상도', insights: '수업', reports: '보고서', live: '테스트 세션' },
  vi: {
    progress: 'Tiến bộ',
    insights: 'Giảng dạy',
    reports: 'Báo cáo',
    live: 'Phiên kiểm tra',
  },
  th: {
    progress: 'ความก้าวหน้า',
    insights: 'การสอน',
    reports: 'รายงาน',
    live: 'เซสชันการทดสอบ',
  },
} as const;

const TAB_KEYS = ['progress', 'insights', 'reports', 'live'] as const;

test.use({ viewport: { width: 1440, height: 900 } });

test.describe('Teacher redesign — label renames (Spec 01 §3)', () => {
  test('the rail and the class tab bar render the renamed labels', async ({ page }, testInfo) => {
    test.setTimeout(240_000);
    const dashboardPromise = waitForDashboard(page);
    await signIn(page, 'teacher');
    await page.waitForURL('**/dashboard/results');
    const dashboard = await dashboardPromise;

    // Side menu: the renamed Test sessions entry.
    const rail = navLink(page, cat(en, 'Shell.nav.testSessions'));
    await expect(rail).toHaveText('Test sessions');
    await expect(rail).toHaveAttribute('href', /\/dashboard\/test-sessions$/);
    await testInfo.attach('rail-test-sessions', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    // The class-results screen of the first directory row the page itself received.
    const firstRow = page.locator('[data-slot="results-class-row"]').first();
    await expect(firstRow).toBeVisible({ timeout: 30_000 });
    const firstId = await firstRow.getAttribute('data-class-id');
    const card = dashboard.classes.find((entry) => entry.class_document_id === firstId);
    if (card === undefined)
      throw new Error('[e2e] the first Classes row is not one of the teacher’s classes');
    await firstRow.getByRole('link', { name: card.name }).click();
    await page.waitForURL(`**/dashboard/results/${card.class_document_id}`);
    await expect(frame(page)).toHaveAttribute('data-status', READY, { timeout: 30_000 });

    // The six section tabs, in order, drawn from the catalog values.
    const expected = [
      'Students',
      'Progress',
      'Teaching',
      'Exit predictions',
      'Reports',
      'Test sessions',
    ];
    expect(TABS.map((key) => label(`tabs.${key}`))).toEqual(expected);
    await expect(sectionTabs(page).getByRole('tab')).toHaveText(expected);
    await testInfo.attach('class-tabs-renamed', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    // The renamed page heading on the Test sessions screen.
    await rail.click();
    await page.waitForURL('**/dashboard/test-sessions');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      cat(en, 'TeacherPortal.liveSessions.title'),
    );
  });

  test('all six catalogs carry the renamed values', () => {
    for (const [locale, expected] of Object.entries(RENAMED) as [
      AnyLocale,
      (typeof RENAMED)['en'],
    ][]) {
      const messages = loadMessages(locale);
      expect(cat(messages, 'Shell.nav.testSessions'), `${locale} Shell.nav.testSessions`).toBe(
        expected.live,
      );
      expect(
        cat(messages, 'TeacherPortal.liveSessions.title'),
        `${locale} liveSessions.title`,
      ).toBe(expected.live);
      expect(cat(messages, 'TeacherPortal.insights.title'), `${locale} insights.title`).toBe(
        expected.insights,
      );
      expect(
        cat(messages, 'TeacherPortal.familyReports.title'),
        `${locale} familyReports.title`,
      ).toBe(expected.reports);
      expect(cat(messages, 'Report.family.listHeading'), `${locale} family.listHeading`).toBe(
        expected.reports,
      );
      for (const key of TAB_KEYS) {
        expect(
          cat(messages, `TeacherPortal.classDetail.tabs.${key}`),
          `${locale} classDetail.tabs.${key}`,
        ).toBe(expected[key]);
        expect(cat(messages, `Teacher.results.tabs.${key}`), `${locale} results.tabs.${key}`).toBe(
          expected[key],
        );
      }
    }
  });
});
