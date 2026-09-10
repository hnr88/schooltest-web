import { expect, test, type Page } from '@playwright/test';

import { cat } from './helpers/i18n';
import {
  DESKTOP,
  openReady,
  readA11ySurface,
  signedInTeacherContextPage,
  type A11ySurface,
} from './helpers/teacher-a11y';
import { en } from './helpers/teacher-rail';

// TASK 047, the SEMANTICS leg axe cannot fully see: an accessible name on every
// control, a label on every field, alt on every image, exactly ONE h1 with no
// skipped heading level, the band WORD beside every colour, and REAL pointer targets
// (measured by hit-testing, not by trusting a bounding box).
// /dashboard/test-sessions and the live monitor are DEFERRED (task 053 owns them).
test.describe.configure({ mode: 'serial' });

let page: Page;
let surface: A11ySurface;

test.beforeAll(async ({ browser, playwright }) => {
  surface = await readA11ySurface(playwright);
  page = await signedInTeacherContextPage(browser);
  await page.setViewportSize(DESKTOP);
});

test.afterAll(async () => {
  await page.context().close();
});

const classUrl = (): string => `/dashboard/results/${surface.classDocumentId}`;

test('NAMES: every control is named, every field labelled, every image has alt', async () => {
  for (const [url, slot] of [
    ['/dashboard', 'teacher-dashboard'],
    ['/dashboard/results', 'teacher-results'],
    [classUrl(), 'teacher-class-results'],
    [`${classUrl()}/students/${surface.twoTestStudentId}`, 'teacher-student-drill-down'],
  ] as const) {
    await openReady(page, url, slot);
    const audit = await page.evaluate(() => {
      // The accessible name in the order the spec computes it: aria-label, then the
      // aria-labelledby target's text, then title, then the element's own text — and
      // finally the alt text of any descendant image, which is where the rail's logo
      // link (`<a><img alt="SchoolTest"></a>`) legitimately gets its name from.
      const name = (el: Element): string => {
        const labelledBy = el.getAttribute('aria-labelledby');
        const referenced = labelledBy === null ? null : document.getElementById(labelledBy);
        const direct =
          el.getAttribute('aria-label') ??
          referenced?.textContent ??
          el.getAttribute('title') ??
          el.textContent ??
          '';
        if (direct.trim() !== '') return direct.trim();
        return Array.from(el.querySelectorAll('img[alt], [aria-label]'))
          .map((child) => (child.getAttribute('alt') ?? child.getAttribute('aria-label') ?? '').trim())
          .join(' ')
          .trim();
      };
      return {
        unnamed: Array.from(document.querySelectorAll('button,[role="button"],a[href]'))
          .filter((el) => el.closest('.tsqd-parent-container') === null && name(el) === '')
          .map((el) => el.outerHTML.slice(0, 120)),
        unlabelledFields: Array.from(document.querySelectorAll('input,select,textarea'))
          .filter(
            (field) =>
              name(field) === '' &&
              field.getAttribute('aria-labelledby') === null &&
              (field.id === '' || document.querySelector(`label[for="${field.id}"]`) === null),
          )
          .map((field) => field.outerHTML.slice(0, 120)),
        imagesWithoutAlt: Array.from(document.querySelectorAll('img'))
          .filter((image) => image.getAttribute('alt') === null)
          .map((image) => image.outerHTML.slice(0, 120)),
      };
    });
    expect(audit.unnamed, `${url}: controls with no accessible name`).toEqual([]);
    expect(audit.unlabelledFields, `${url}: form fields with no label`).toEqual([]);
    expect(audit.imagesWithoutAlt, `${url}: images with no alt attribute`).toEqual([]);
  }
});

test('EXPORT BUTTONS: named, and a real 44px target on both export surfaces', async () => {
  await openReady(page, classUrl(), 'teacher-class-results');
  await page.getByRole('tab', { name: cat(en, 'Teacher.results.tabs.insights'), exact: true }).click();
  const classExport = page.locator('[data-slot="teacher-export-action"] button[data-export-kind]');
  await expect(classExport).toBeVisible();
  await expect(classExport).toHaveAccessibleName(/\S/);
  const classBox = await classExport.boundingBox();
  expect(classBox?.height ?? 0, `class export height ${classBox?.height}`).toBeGreaterThanOrEqual(44);

  await openReady(
    page,
    `${classUrl()}/students/${surface.twoTestStudentId}`,
    'teacher-student-drill-down',
  );
  const studentExport = page.locator('[data-slot="teacher-export-action"] button[data-export-kind]');
  await expect(studentExport).toBeVisible();
  await expect(studentExport).toHaveAccessibleName(/\S/);
  const studentBox = await studentExport.boundingBox();
  expect(studentBox?.height ?? 0, `student export height ${studentBox?.height}`).toBeGreaterThanOrEqual(44);
});

test('HEADINGS: exactly one h1 per page and no skipped level', async () => {
  for (const [url, slot] of [
    ['/dashboard', 'teacher-dashboard'],
    ['/dashboard/results', 'teacher-results'],
    [classUrl(), 'teacher-class-results'],
    [`${classUrl()}/students/${surface.twoTestStudentId}`, 'teacher-student-drill-down'],
    [`${classUrl()}/students/${surface.oneTestStudentId}`, 'teacher-student-drill-down'],
  ] as const) {
    await openReady(page, url, slot);
    const levels = await page.evaluate(() =>
      Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((heading) =>
        Number.parseInt(heading.tagName.slice(1), 10),
      ),
    );
    expect(levels.filter((level) => level === 1).length, `${url}: h1 count`).toBe(1);
    expect(levels[0], `${url}: the first heading is not the h1`).toBe(1);
    for (let index = 1; index < levels.length; index += 1) {
      expect(
        levels[index] - levels[index - 1],
        `${url}: skipped a heading level (${levels.join(',')})`,
      ).toBeLessThanOrEqual(1);
    }
  }
});

test('NOT-COLOUR-ALONE: every banded subskill tile prints its band word as text', async () => {
  for (const studentDocumentId of [surface.twoTestStudentId, surface.oneTestStudentId]) {
    await openReady(
      page,
      `${classUrl()}/students/${studentDocumentId}`,
      'teacher-student-drill-down',
    );
    const tiles = page.locator('[data-slot="subskill-tile"]');
    const count = await tiles.count();
    expect(count, `${studentDocumentId} rendered no subskill tile`).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const tile = tiles.nth(index);
      await expect(tile).toHaveAttribute('data-band', /.+/);
      await expect(tile.locator('[data-slot="subskill-tile-band"]')).not.toBeEmpty();
    }
  }
});

test('TARGETS: the retry control clears 44px and the row link’s REAL target is the row', async () => {
  // A real 404 from C-TR-1 renders the shared error Alert — the retry control this
  // task raised from a measured 86×32 to the project's own 44px floor.
  await page.goto('/dashboard/results/zzzzzzzzzzzzzzzzzzzzzzzz');
  const retry = page.getByRole('button', {
    name: cat(en, 'Teacher.results.detail.retry'),
    exact: true,
  });
  await expect(retry).toBeVisible();
  const box = await retry.boundingBox();
  expect(box?.height ?? 0, `retry height ${box?.height}`).toBeGreaterThanOrEqual(44);
  expect(box?.width ?? 0, `retry width ${box?.width}`).toBeGreaterThanOrEqual(44);

  await openReady(page, classUrl(), 'teacher-class-results');
  // ops/34 — the row renders through the shared directory kit now, and the
  // kit's §L-rownav contract DELIBERATELY drops the whole-row overlay (a row
  // menu under an invisible overlay is the nested-interactive failure axe
  // reports). The 44px promise moves onto the anchor itself: the first-cell
  // link's OWN box clears the floor in both axes, and it stays the row's one
  // real, keyboard-reachable navigation target.
  const rowLink = page.locator('[data-slot="student-results-row"]').first().locator('a[data-row-href]');
  await expect(rowLink).toBeVisible();
  const linkBox = await rowLink.boundingBox();
  expect(linkBox?.height ?? 0, `row link height ${linkBox?.height}`).toBeGreaterThanOrEqual(44);
  expect(linkBox?.width ?? 0, `row link width ${linkBox?.width}`).toBeGreaterThanOrEqual(44);
  await expect(rowLink).toHaveAttribute('href', /\/students\//);
});
