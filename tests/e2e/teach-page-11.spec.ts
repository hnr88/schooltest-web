import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { loadMessages } from './helpers/i18n';

// Task 11 proof tooling (mvp/landing-pages/tasks/11-teach-page.md ## Proof):
// hero, export mock and Figure 1 at 1440×900; the figure scrolling in its own
// container at 375×900 with the page body never scrolling sideways. The page's
// sections have no ids, so the figure is reached via its data-slot and the
// sections by order. All value matchers are exact.
const en = loadMessages('en');
const SHOTS = resolve(process.cwd(), '../mvp/landing-pages/proof/shots');

const settle = async (page: Page): Promise<void> => {
  await page.waitForTimeout(600);
};

test.describe('task 11 — Teach page to the design', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('hero: navy panel, pinned copy, both CTAs, four-cell fact strip', async ({
    page,
  }, testInfo) => {
    await page.goto('/eald/teach');
    const hero = page.locator('main section').nth(0);
    await settle(page);

    // Exactly one h1 on the page, carrying the pinned t.rich title.
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText('Paste the profile into AI.');

    // Both CTAs keep their destinations.
    await expect(hero.locator('a[href="/#register"]').first()).toContainText(
      en['Eald.teach.hero.primaryCta'],
    );
    await expect(hero.locator('a[href="/diagnose"]').first()).toContainText(
      en['Eald.teach.hero.secondaryCta'],
    );

    // Fact strip: four cells, exact values (StatStrip renders value over label).
    const strip = page.locator('[data-slot="stat-strip"]');
    await expect(strip.locator('dd')).toHaveText([
      en['Eald.teach.hero.statExportValue'],
      en['Eald.teach.hero.statNamesValue'],
      en['Eald.teach.hero.statGroupingValue'],
      en['Eald.teach.hero.statAiValue'],
    ]);
    await expect(strip.locator('dt')).toHaveText([
      en['Eald.teach.hero.statExportLabel'],
      en['Eald.teach.hero.statNamesLabel'],
      en['Eald.teach.hero.statGroupingLabel'],
      en['Eald.teach.hero.statAiLabel'],
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
    await page.goto('/eald/teach');
    const generate = page.locator('main section').nth(1);
    await generate.scrollIntoViewIfNeeded();
    await settle(page);

    const card = generate.locator('.rounded-3xl').first();
    await expect(
      card.getByText(en['Eald.teach.generate.classSetLabel'], { exact: true }),
    ).toHaveCount(1);
    await expect(
      card.getByText(en['Eald.teach.generate.exportBadge'], { exact: true }),
    ).toHaveCount(1);
    await expect(card.getByText(en['Eald.teach.generate.promptText'])).toHaveCount(1);
    await expect(
      card.getByText(en['Eald.teach.generate.outputTitle'], { exact: true }),
    ).toHaveCount(1);
    await expect(
      card.getByText(en['Eald.teach.generate.targetBadge'], { exact: true }),
    ).toHaveCount(1);
    await expect(
      card.getByText(en['Eald.teach.generate.footnote'], { exact: true }),
    ).toHaveCount(1);

    // Static: text and placeholder bars only — no interactive control
    // anywhere inside the mock (logic.md#L4: it describes, it does not run).
    await expect(card.locator('input, button, textarea, select, form')).toHaveCount(0);

    const shot = await card.screenshot({
      path: resolve(SHOTS, '11-teach-export-mock-1440.png'),
    });
    await testInfo.attach('11-teach-export-mock-1440', {
      body: shot,
      contentType: 'image/png',
    });
  });

  test('Figure 1: two series, four categories, numeric axis, values as text', async ({
    page,
  }, testInfo) => {
    await page.goto('/eald/teach');
    const figure = page.locator('[data-slot="figure-card"]');
    await figure.scrollIntoViewIfNeeded();
    await settle(page);

    // The grouping heading is the relocated groupCaption; the track link
    // keeps its destination.
    await expect(
      page.getByText(en['Eald.teach.classroom.groupCaption'], { exact: true }),
    ).toHaveCount(1);
    await expect(
      page
        .locator('a[href="/track"]')
        .filter({ hasText: en['Eald.teach.grouping.trackLink'] }),
    ).toHaveCount(1);

    // Figure chrome: title, context, footnote — exact.
    await expect(
      figure.getByText(en['Eald.teach.grouping.figureTitle'], { exact: true }),
    ).toHaveCount(1);
    await expect(
      figure.getByText(en['Eald.teach.grouping.figureContext'], { exact: true }),
    ).toHaveCount(1);
    await expect(
      figure.getByText(en['Eald.teach.grouping.footnote'], { exact: true }),
    ).toHaveCount(1);

    // Legend: two series. Axis: numeric ceiling labels.
    await expect(
      figure.getByText(en['Eald.teach.grouping.seriesTerm1'], { exact: true }),
    ).toHaveCount(1);
    await expect(
      figure.getByText(en['Eald.teach.grouping.seriesTerm2'], { exact: true }),
    ).toHaveCount(1);
    await expect(
      figure.getByText(en['Eald.teach.grouping.bandMaxStudents'], { exact: true }),
    ).toHaveCount(1);

    // The design's aria-label on the chart.
    await expect(figure.locator('[aria-label]')).toHaveAttribute(
      'aria-label',
      en['Eald.teach.grouping.ariaLabel'],
    );

    // Every value exposed as text: four categories and all eight bar values.
    for (const key of [
      'categoryVocabulary',
      'categoryInference',
      'categoryNoteTaking',
      'categoryFluency',
    ] as const) {
      await expect(
        figure.getByText(en[`Eald.teach.grouping.${key}`], { exact: true }),
      ).toHaveCount(1);
    }
    await expect(figure).toContainText('22 students');
    for (const value of ['8', '5', '6', '4']) {
      await expect(
        figure.locator('span.sr-only', { hasText: `: ${value}` }).first(),
      ).toBeAttached();
    }

    const shot = await figure.screenshot({
      path: resolve(SHOTS, '11-teach-figure-1440.png'),
    });
    await testInfo.attach('11-teach-figure-1440', {
      body: shot,
      contentType: 'image/png',
    });
  });

  test('classroom band drops the chips; three-more keeps cards and note', async ({
    page,
  }) => {
    await page.goto('/eald/teach');

    // The dropped chip labels render nowhere on the page (authorised drop —
    // orchestrator chat-650473aa; GROUP_KEYS entries stay in the constant).
    await expect(
      page.getByText(en['Eald.teach.classroom.groupA'], { exact: true }),
    ).toHaveCount(0);

    // Classroom band keeps its pinned copy and callout.
    await expect(
      page.getByText(en['Eald.teach.classroom.title'], { exact: true }),
    ).toHaveCount(1);
    await expect(page.locator('main')).toContainText(en['Eald.teach.classroom.body']);

    // Three-more: heading, three cards, note.
    await expect(
      page.getByText(en['Eald.teach.threeMore.title'], { exact: true }),
    ).toHaveCount(1);
    await expect(
      page.getByText(en['Eald.teach.threeMore.groupByGapTitle'], { exact: true }),
    ).toHaveCount(1);
    await expect(
      page.getByText(en['Eald.teach.threeMore.pairBySkillTitle'], { exact: true }),
    ).toHaveCount(1);
    await expect(
      page.getByText(en['Eald.teach.threeMore.parentUpdatesTitle'], { exact: true }),
    ).toHaveCount(1);
    await expect(page.locator('main')).toContainText(en['Eald.teach.note']);
  });

  test.describe('mobile 375×900', () => {
    test.use({ viewport: { width: 375, height: 900 } });

    test('figure scrolls inside its own container; page never scrolls sideways', async ({
      page,
    }, testInfo) => {
      await page.goto('/eald/teach');
      const figure = page.locator('[data-slot="figure-card"]');
      await figure.scrollIntoViewIfNeeded();
      await settle(page);

      // BarChart's INNER min-w-0 overflow-x-auto wrapper is the contained
      // scroller (not FigureCard's body node). At exactly 375px the chart's
      // 320px (min-w-80) floor fits the ~323px column, so the asserted fact
      // is the contained-scroll MECHANISM: the wrapper clips and scrolls
      // instead of pushing the page wide.
      const wrapper = figure.locator('div.min-w-0.overflow-x-auto');
      await expect(wrapper).toHaveCount(1);
      const scroll = await wrapper.evaluate((el) => ({
        overflowX: getComputedStyle(el).overflowX,
        innerMinWidth: el.firstElementChild
          ? getComputedStyle(el.firstElementChild).minWidth
          : 'unknown',
      }));
      expect(scroll.overflowX).toBe('auto');
      expect(scroll.innerMinWidth).toBe('320px');

      const body = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(
        body.scrollWidth,
        'the page body must never scroll sideways',
      ).toBeLessThanOrEqual(body.clientWidth);

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
