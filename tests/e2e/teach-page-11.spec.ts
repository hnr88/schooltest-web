import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

// Task 11 proof tooling — re-pointed at the redesigned Teach page: the navy
// hero panel with its fact strip, the static export mock, the classroom band
// and the Ask AI figure (the old Figure-1 BarChart kit is gone). All value
// matchers are exact.
const SHOTS = resolve(process.cwd(), '../mvp/landing-pages/proof/shots');

const settle = async (page: Page): Promise<void> => {
  await page.waitForTimeout(300);
};

test.describe('task 11 — Teach page to the design', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('hero: navy panel, pinned copy, CTA, four-cell fact strip', async ({
    page,
  }, testInfo) => {
    await page.goto('/teach');
    const hero = page.locator('section[data-screen-label="Hero"]');
    await settle(page);

    // Exactly one h1 on the page, carrying the pinned title.
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(
      'Paste the profile into AI. Get a week of teaching materials out.',
    );

    // The navy panel keeps its eyebrow and subtitle; the single CTA registers
    // from the sub-page.
    await expect(hero.getByText('02 · Plan and teach', { exact: true })).toBeVisible();
    await expect(
      hero.getByText(
        'Export a privacy-safe class set and hand it to ChatGPT, Gemini or Claude. Real subskill data turns a generic prompt into materials your class can actually use.',
      ),
    ).toBeVisible();
    await expect(hero.locator('a[href="/#register"]').first()).toContainText('Join the pilot');
    await expect(
      hero.getByRole('img', { name: 'A teacher preparing lesson materials at a laptop' }),
    ).toBeVisible();

    // Fact strip: four cells, exact values (value dd over label dt).
    const strip = hero.locator('dl');
    await expect(strip.locator('dd')).toHaveText([
      'Pseudonymised',
      'None',
      'Built in',
      'Yes',
    ]);
    await expect(strip.locator('dt')).toHaveText([
      'Class set export',
      'Student names in export',
      'Grouping views',
      'Works without AI',
    ]);

    const shot = await hero.screenshot({
      path: resolve(SHOTS, '11-teach-hero-1440.png'),
    });
    await testInfo.attach('11-teach-hero-1440', {
      body: shot,
      contentType: 'image/png',
    });
  });

  test('export mock renders as a static card with the footnote strip', async ({
    page,
  }, testInfo) => {
    await page.goto('/teach');
    const generate = page.locator('section[data-screen-label="Generate the materials"]');
    await generate.scrollIntoViewIfNeeded();
    await settle(page);

    // The mock card is the second ancestor div of its header row
    // (header row -> card), and holds every pinned string of the mock.
    const headerRow = generate.getByText('Class set · 22 profiles', { exact: true });
    const card = headerRow.locator('xpath=ancestor::div[2]');
    await expect(card).toBeVisible();
    await expect(card.getByText('Class set · 22 profiles', { exact: true })).toHaveCount(1);
    await expect(card.getByText('EXPORT', { exact: true })).toHaveCount(1);
    await expect(
      card.getByText(
        '“Write one passage at the class’s vocabulary band, with question sets matched to their gaps.”',
      ),
    ).toHaveCount(1);
    await expect(card.getByText('Reading passage + questions', { exact: true })).toHaveCount(1);
    await expect(card.getByText('Targets: inference, vocabulary', { exact: true })).toHaveCount(1);
    await expect(
      card.getByText('No student names appear in any export.', { exact: true }),
    ).toHaveCount(1);

    // Static: text and placeholder bars only — no interactive control
    // anywhere inside the mock (it describes, it does not run).
    await expect(card.locator('input, button, textarea, select, form')).toHaveCount(0);

    const shot = await card.screenshot({
      path: resolve(SHOTS, '11-teach-export-mock-1440.png'),
    });
    await testInfo.attach('11-teach-export-mock-1440', {
      body: shot,
      contentType: 'image/png',
    });
  });

  test('Ask AI figure: chat mock with pinned exchange, file chip and footnote', async ({
    page,
  }, testInfo) => {
    await page.goto('/teach');
    const askAi = page.locator('section[data-screen-label="Ask AI"]');
    const figure = askAi.locator('figure');
    await figure.scrollIntoViewIfNeeded();
    await settle(page);

    // The section keeps its pinned copy and callout.
    await expect(askAi.getByText('Ask the data anything.')).toBeVisible();

    // Figure chrome: caption header + context.
    await expect(figure.getByText('Ask SchoolTest', { exact: true })).toHaveCount(1);
    await expect(figure.getByText('9 English · 22 students', { exact: true })).toHaveCount(1);

    // The pinned exchange: two questions, the specific answer naming the six
    // students, and the drafted file chip.
    await expect(
      figure.getByText('Which students need work on inference?', { exact: true }),
    ).toHaveCount(1);
    await expect(
      figure.getByText(
        'Six students sit at Emerging or below on inference: Aisha, Mateo, Priya, Deng, Yuki and Sam. They can decode fluently but miss implied meaning - a good small group to start with.',
      ),
    ).toHaveCount(1);
    await expect(
      figure.getByText('Draft a short passage with inference questions for them.', { exact: true }),
    ).toHaveCount(1);
    await expect(figure.getByText('Inference passage · Year 9.docx', { exact: true })).toHaveCount(1);

    await expect(
      figure.getByText(
        'Illustrative exchange. Names are sample data; the diagnostic data is exported de-identified.',
        { exact: true },
      ),
    ).toHaveCount(1);

    const shot = await figure.screenshot({
      path: resolve(SHOTS, '11-teach-ask-ai-figure-1440.png'),
    });
    await testInfo.attach('11-teach-ask-ai-figure-1440', {
      body: shot,
      contentType: 'image/png',
    });
  });

  test('classroom band keeps its pinned copy; the next-nav links onward', async ({
    page,
  }) => {
    await page.goto('/teach');

    // Classroom band keeps its pinned copy and callout.
    const classroom = page.locator('section[data-screen-label="Classroom management"]');
    await expect(
      classroom.getByRole('heading', {
        name: 'Who to pair with whom, and how to split the room.',
      }),
    ).toHaveCount(1);
    await expect(
      classroom.getByText(
        'Who to pair with whom, on which skill, and how to split the room into groups that each need something different. The data makes it defensible; the AI makes it fast.',
      ),
    ).toBeVisible();

    // Next-nav: three numbered rows (03–05), Track first.
    const nextNav = page.locator('section[data-screen-label="Next"] ol');
    const rows = nextNav.locator('li');
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0).locator('a')).toHaveAttribute('href', '/track');
    await expect(rows.nth(1).locator('a')).toHaveAttribute('href', '/predict');
    await expect(rows.nth(2).locator('a')).toHaveAttribute('href', '/report');
  });

  test.describe('mobile 375×900', () => {
    test.use({ viewport: { width: 375, height: 900 } });

    test('the Ask AI figure scales to its column; main content never leaves the viewport', async ({
      page,
    }, testInfo) => {
      await page.goto('/teach');
      const figure = page.locator('section[data-screen-label="Ask AI"] figure');
      await figure.scrollIntoViewIfNeeded();
      await settle(page);

      // The redesigned page keeps one contained 375px exception — the
      // footer's nowrap acknowledgement line. Everything in <main>,
      // including this figure, must stay inside the viewport.
      const mainMax = await page.evaluate(
        () =>
          Math.max(
            ...[...document.querySelectorAll('main, main *')].map(
              (node) => node.getBoundingClientRect().right,
            ),
          ),
      );
      expect(mainMax, 'every main-content node fits the 375px viewport').toBeLessThanOrEqual(376);

      // The figure card and its chat exchange render fully in the column.
      await expect(figure).toBeVisible();
      await expect(figure.getByText('Inference passage · Year 9.docx', { exact: true })).toBeVisible();

      const shot = await figure.screenshot({
        path: resolve(SHOTS, '11-teach-figure-375.png'),
      });
      await testInfo.attach('11-teach-figure-375', {
        body: shot,
        contentType: 'image/png',
      });
    });
  });
});
