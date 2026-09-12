import { expect, test, type Page } from '@playwright/test';

import { cat } from './helpers/i18n';
import {
  DESKTOP,
  openReady,
  openStudentReady,
  readA11ySurface,
  signedInTeacherContextPage,
  type A11ySurface,
} from './helpers/teacher-a11y';
import { MIN_TARGET_PX, PROJECT_TARGET_PX } from './helpers/teacher-a11y-targets';
import { sectionTab } from './helpers/teacher-class-detail';
import { en } from './helpers/teacher-rail';

// TASK 047, the SEMANTICS leg axe cannot fully see, on the Teacher Portal v2 pages: an
// accessible name on every control, a label on every field, alt on every image, exactly
// ONE h1 with no skipped heading level, the band WORD beside every colour, and REAL
// pointer targets (measured by hit-testing, not by trusting a bounding box). A teacher's
// /dashboard lands on the Classes list, so that is the landing audited here.
// TB-30: the retired `teacher-dashboard` surface never renders and the v2 student
// page's settled read is `success`, not `ready` (`openStudentReady`).
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

const openStudent = (studentDocumentId: string): Promise<void> =>
  openStudentReady(page, surface.classDocumentId, studentDocumentId);

const PAGES: ReadonlyArray<readonly [string, () => Promise<void>]> = [
  ['/dashboard/results', () => openReady(page, '/dashboard/results', 'teacher-results')],
  ['class detail', () => openReady(page, classUrl(), 'teacher-class-results')],
  ['student (two tests)', () => openStudent(surface.twoTestStudentId)],
];

test('NAMES: every control is named, every field labelled, every image has alt', async () => {
  for (const [label, open] of PAGES) {
    await open();
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
    expect(audit.unnamed, `${label}: controls with no accessible name`).toEqual([]);
    expect(audit.unlabelledFields, `${label}: form fields with no label`).toEqual([]);
    expect(audit.imagesWithoutAlt, `${label}: images with no alt attribute`).toEqual([]);
  }
});

test('EXPORT BUTTONS: named, and a real target on both export surfaces', async () => {
  // TB-33 (recorded decision): the floor here is the DESIGN plus WCAG 2.2 AA 2.5.8 —
  // 24x24 CSS px — not the 44px (WCAG 2.5.5 AAA) floor task 047 set for itself. The
  // design draws the student page's export button at 38px, and meeting 44 would mean
  // redrawing the design. This is the rule stated, not a floor quietly lowered: the
  // constant and the reasoning live in `helpers/teacher-a11y-targets.ts`, and the
  // MEASURED height of each button is printed on failure so a regression is visible
  // even while both still clear 24.
  await openReady(page, classUrl(), 'teacher-class-results');
  await sectionTab(page, 'insights').click();
  const classExport = page.locator('[data-slot="teacher-export-action"] button[data-export-kind]');
  await expect(classExport).toBeVisible();
  await expect(classExport).toHaveAccessibleName(/\S/);
  const classBox = await classExport.boundingBox();
  expect(
    classBox?.height ?? 0,
    `class export ${classBox?.width}×${classBox?.height} under the TB-33 ${MIN_TARGET_PX}px floor`,
  ).toBeGreaterThanOrEqual(MIN_TARGET_PX);
  expect(classBox?.width ?? 0, `class export width ${classBox?.width}`).toBeGreaterThanOrEqual(
    MIN_TARGET_PX,
  );

  await openStudent(surface.twoTestStudentId);
  const studentExport = page.locator('[data-slot="student-export-button"]');
  await expect(studentExport).toBeVisible();
  await expect(studentExport).toHaveAccessibleName(/\S/);
  const studentBox = await studentExport.boundingBox();
  expect(
    studentBox?.height ?? 0,
    `student export ${studentBox?.width}×${studentBox?.height} under the TB-33 ${MIN_TARGET_PX}px floor`,
  ).toBeGreaterThanOrEqual(MIN_TARGET_PX);
  expect(studentBox?.width ?? 0, `student export width ${studentBox?.width}`).toBeGreaterThanOrEqual(
    MIN_TARGET_PX,
  );
});

test('HEADINGS: exactly one h1 per page and no skipped level', async () => {
  const oneTest = surface.oneTestStudentId;
  for (const [label, open] of [
    ...PAGES,
    // The first-sitting render only when the live seed carries one (the helper
    // says so out loud when it does not).
    ...(oneTest === null
      ? []
      : ([['student (one test)', () => openStudent(oneTest)]] as const)),
  ] as const) {
    await open();
    const levels = await page.evaluate(() =>
      Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((heading) =>
        Number.parseInt(heading.tagName.slice(1), 10),
      ),
    );
    expect(levels.filter((level) => level === 1).length, `${label}: h1 count`).toBe(1);
    expect(levels[0], `${label}: the first heading is not the h1`).toBe(1);
    for (let index = 1; index < levels.length; index += 1) {
      expect(
        levels[index] - levels[index - 1],
        `${label}: skipped a heading level (${levels.join(',')})`,
      ).toBeLessThanOrEqual(1);
    }
  }
});

test('NOT-COLOUR-ALONE: every tinted chip on a subskill card prints its word as text', async () => {
  // A card whose latest result left its subskill unassessed draws no chip at all, so a
  // single student can legitimately draw none — the rule is about the chips that ARE
  // drawn. The subjects therefore come off the REAL Students tab (every scored row the
  // class serves, in its own order) and the audit walks them until it has seen chips,
  // so the non-vacuity guard means "this class's chips all print their word", never
  // "the one student the fixture happened to pick did".
  await openReady(page, classUrl(), 'teacher-class-results');
  const scored = await page
    .locator('[data-slot="student-results-row"][data-scored="true"] a[data-slot="student-name"]')
    .evaluateAll((links) =>
      links.map((link) => (link.getAttribute('href') ?? '').split('/students/')[1] ?? ''),
    );
  const audited = scored.filter((id) => id !== '').slice(0, 5);
  expect(audited.length, 'the Students tab served no scored student to audit').toBeGreaterThan(0);

  let chipsSeen = 0;
  for (const studentDocumentId of audited) {
    await openStudent(studentDocumentId);
    const cards = page.locator('[data-slot="student-subskill"]');
    expect(await cards.count(), `${studentDocumentId} rendered no subskill card`).toBeGreaterThan(0);
    const chips = cards.locator('[data-slot="status-pill"]');
    const count = await chips.count();
    chipsSeen += count;
    for (let index = 0; index < count; index += 1) {
      await expect(chips.nth(index)).not.toBeEmpty();
    }
  }
  expect(
    chipsSeen,
    `no tinted chip on any subskill card of ${audited.length} scored students`,
  ).toBeGreaterThan(0);
});

test('TARGETS: the retry control keeps the project 44px floor and the student link’s REAL target is the row', async () => {
  // A class id outside the teacher's own classes renders the shared error Alert — the
  // retry control this task raised from a measured 86×32 to the project's own 44px
  // floor. TB-33 lowers the SURFACE-WIDE floor to WCAG 2.2 AA 2.5.8's 24px, but it
  // does not abolish the project floor where the code still states it: this control
  // carries `TEACHER_RETRY_BUTTON_CLASS` (`min-h-11`), so 44 is what it promises and
  // 44 is what is asserted.
  await page.goto('/dashboard/results/zzzzzzzzzzzzzzzzzzzzzzzz');
  const retry = page.getByRole('button', {
    name: cat(en, 'Teacher.results.detail.retry'),
    exact: true,
  });
  await expect(retry).toBeVisible();
  const box = await retry.boundingBox();
  expect(box?.height ?? 0, `retry height ${box?.height}`).toBeGreaterThanOrEqual(PROJECT_TARGET_PX);
  expect(box?.width ?? 0, `retry width ${box?.width}`).toBeGreaterThanOrEqual(PROJECT_TARGET_PX);

  await openReady(page, classUrl(), 'teacher-class-results');
  // TB-33 again, and this is the half that is NOT a relaxation. The design draws the
  // Students-tab name link as 18px of inline text — WCAG 2.5.8's Inline exception —
  // so its own box is not the promise. `RosterStudentCells.tsx` stretches the link's
  // ::after over the whole row, which makes the ROW the box that receives the
  // pointer, and the row is what must clear the floor. Measured here as the browser
  // resolves it: the element at the row's own centre is the link (or inside it), and
  // the stretched box is ≥ 44 in both axes — a bigger promise than 2.5.8 asks for.
  const row = page.locator('[data-slot="student-results-row"][data-scored="true"]').first();
  const rowLink = row.locator('a[data-slot="student-name"]');
  await expect(rowLink).toBeVisible();
  await expect(rowLink).toHaveAttribute('href', /\/students\//);
  const target = await rowLink.evaluate((el) => {
    const after = getComputedStyle(el, '::after');
    const host = el instanceof HTMLElement ? el.offsetParent : null;
    const stretched =
      after.content !== 'none' && after.position === 'absolute' && host instanceof HTMLElement;
    const measured = stretched && host !== null ? host : el;
    // `elementFromPoint` only answers for VIEWPORT coordinates, so the row has to be
    // on screen before it is probed.
    measured.scrollIntoView({ block: 'center' });
    const box = measured.getBoundingClientRect();
    // Probe the row's own LEFT EDGE, inside the first cell's 32px padding: empty
    // space that belongs to no other control, so what answers there is the
    // stretched link or nothing. The row's centre is not a valid probe — the middle
    // columns carry their own content and legitimately win the hit test.
    const hit = document.elementFromPoint(box.x + 3, box.y + box.height / 2);
    return {
      stretched,
      width: box.width,
      height: box.height,
      hitsTheLink: hit === el || el.contains(hit) || (hit !== null && hit.contains(el)),
    };
  });
  expect(target.stretched, 'the Students row link is not stretched over its row').toBe(true);
  expect(target.hitsTheLink, 'the row edge does not hit the row link').toBe(true);
  expect(
    target.height,
    `row link effective target ${Math.round(target.width)}×${Math.round(target.height)}`,
  ).toBeGreaterThanOrEqual(PROJECT_TARGET_PX);
  expect(
    target.width,
    `row link effective target ${Math.round(target.width)}×${Math.round(target.height)}`,
  ).toBeGreaterThanOrEqual(PROJECT_TARGET_PX);
});
