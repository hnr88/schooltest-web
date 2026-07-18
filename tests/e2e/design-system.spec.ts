import { expect, test } from '@playwright/test';
import {
  cat,
  ds,
  escapeRegExp,
  heroTitleLines,
  home,
  icu,
  loadMessages,
  type Locale,
  type Messages,
} from './helpers/i18n';
import { expectVariantButton, watchErrors } from './helpers/ui';

// Assertions derive from the catalogs at runtime — no copy is duplicated into this spec.
const catalogs: Record<Locale, Messages> = { en: loadMessages('en'), de: loadMessages('de') };
const DS_SECTION_KEYS = [
  'sectionBrand',
  'sectionButtons',
  'sectionBadges',
  'sectionAlerts',
  'sectionCards',
  'sectionForms',
  'sectionOverlays',
  'sectionData',
  'sectionFeedback',
] as const;

test('DS-VARIANTS: every showcase export renders with all variants', async ({ page }) => {
  const errors = watchErrors(page);
  const en = catalogs.en;
  await page.goto('/design-system');
  await expect(page).toHaveTitle(new RegExp(escapeRegExp(ds(en, 'meta.title'))));
  await expect(page.getByRole('heading', { level: 1, name: ds(en, 'pageTitle') })).toBeVisible();
  for (const key of DS_SECTION_KEYS)
    await expect(
      page.getByRole('heading', { level: 2, name: ds(en, key), exact: true }),
    ).toBeVisible();

  // Buttons — all 10 variants; class selectors disambiguate repeated accessible names.
  const buttonRows = page.locator('#buttons > div');
  const variants: [number, string, string][] = [
    [0, 'buttonCreate', 'button.ds-probe'],
    [0, 'buttonGetStarted', 'button.bg-navy-900'], // default, navy
    [0, 'buttonCreate', 'button.bg-accent'],
    [0, 'buttonSave', 'button.bg-secondary'],
    [0, 'buttonCancel', 'button.bg-background'],
    [0, 'buttonCancel', 'button:not(.bg-background)'], // outline, ghost
    [0, 'buttonDelete', 'button.bg-destructive'],
    [0, 'buttonLearnMore', 'button.text-primary'], // destructive, link
    [1, 'buttonGetStarted', 'button.bg-white'],
    [1, 'buttonLearnMore', 'button[class*="border-white/40"]'], // white, outline-white
  ];
  for (const [row, key, sel] of variants)
    await expectVariantButton(buttonRows.nth(row), ds(en, key), sel);
  const sizes = buttonRows.nth(2);
  for (const cls of ['h-8', 'h-10', 'h-11'])
    await expectVariantButton(sizes, ds(en, 'buttonCreate'), `button.${cls}`);
  await expectVariantButton(sizes, ds(en, 'buttonGetStarted'), 'button.h-12'); // xl size
  const states = buttonRows.nth(3);
  const loading = states.getByRole('button', { name: ds(en, 'buttonSaving'), exact: true });
  await expect(loading).toBeDisabled();
  await expect(loading).toHaveAttribute('aria-busy', 'true');
  await expect(loading.locator('svg[data-slot="spinner"]')).toBeVisible();
  await expect(
    states.getByRole('button', { name: ds(en, 'buttonSave'), exact: true }),
  ).toBeDisabled();
  await expect(
    states.getByRole('button', { name: ds(en, 'buttonNotifications'), exact: true }),
  ).toBeVisible();

  // Badges & tags — 9 badge variants + status badges + tag + count badge.
  const badgeRows = page.locator('#badges > div');
  for (const [key, count] of [
    ['badgeLive', 3],
    ['badgeScheduled', 3],
    ['badgeDraft', 2],
    ['tagGrade', 2],
  ] as const)
    await expect(badgeRows.nth(0).getByText(ds(en, key), { exact: true })).toHaveCount(count);
  for (const cls of ['bg-navy-900', 'bg-teal-100', 'bg-green-100', 'bg-amber-100', 'bg-red-100'])
    await expect(badgeRows.nth(0).locator(`> span.${cls}`), cls).toHaveCount(1);
  await expect(badgeRows.nth(1).locator('[data-slot="status-badge"]')).toHaveCount(3);
  for (const key of ['badgeLive', 'badgeScheduled', 'badgeDraft'] as const)
    await expect(badgeRows.nth(1).getByText(ds(en, key), { exact: true })).toBeVisible();
  await expect(badgeRows.nth(2).locator('[data-slot="tag"]')).toHaveCount(2);
  await expect(badgeRows.nth(2).locator('[data-slot="count-badge"]')).toHaveText('3');

  // Alerts & cards.
  const alerts = page.locator('#alerts');
  await expect(alerts.getByRole('alert')).toHaveCount(4);
  for (const key of [
    'alertInfoTitle',
    'alertSuccessTitle',
    'alertWarningTitle',
    'alertErrorTitle',
  ] as const)
    await expect(alerts.getByText(ds(en, key), { exact: true })).toBeVisible();
  const cards = page.locator('#cards');
  for (const key of ['statTests', 'statStudents', 'statScore', 'emptyTitle'] as const)
    await expect(cards.getByText(ds(en, key), { exact: true })).toBeVisible();
  await expect(cards.getByText(ds(en, 'featureDemoTitle'), { exact: true })).toHaveCount(2);
  await expect(
    cards.getByRole('button', { name: ds(en, 'emptyAction'), exact: true }),
  ).toBeVisible();
  await expect(page.locator('#ds-email')).toHaveAttribute(
    'placeholder',
    ds(en, 'fieldEmailPlaceholder'),
  );
  await expect(page.locator('#ds-email-error')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText(ds(en, 'fieldEmailError'), { exact: true })).toBeVisible();
  await expect(page.locator('#ds-disabled')).toBeDisabled();
  await expect(page.locator('#ds-instructions')).toBeVisible();
  await expect(page.locator('#ds-search')).toHaveAttribute(
    'placeholder',
    ds(en, 'fieldSearchPlaceholder'),
  );
  await expect(page.locator('#ds-select')).toBeVisible();
  await expect(page.locator('#ds-native-select')).toBeVisible();
  for (const role of ['checkbox', 'radio', 'switch'] as const)
    await expect(page.getByRole(role)).toHaveCount(2);

  // Data display: tabs, segmented control, table + status pills, pagination, breadcrumb.
  const data = page.locator('#data');
  for (const key of ['tabsOverview', 'tabsQuestions', 'tabsResults'] as const)
    await expect(data.getByRole('tab', { name: ds(en, key), exact: true })).toBeVisible();
  const segmented = data.locator('[data-slot="segmented-control"]');
  for (const key of ['segmentedWeek', 'segmentedMonth', 'segmentedYear'] as const)
    await expect(segmented.getByRole('button', { name: ds(en, key), exact: true })).toBeVisible();
  await expect(data.locator('[data-slot="table-caption"]')).toHaveText(ds(en, 'tableCaption'));
  for (const key of [
    'tableRowMath',
    'tableRowScience',
    'tableRowHistory',
    'tableRowReading',
  ] as const)
    await expect(data.getByText(ds(en, key), { exact: true })).toBeVisible();
  await expect(data.locator('[data-slot="table"] [data-slot="status-badge"]')).toHaveCount(4);
  await expect(data.getByText(ds(en, 'tableShowing'), { exact: true })).toBeVisible();
  await expect(data.getByRole('link', { name: ds(en, 'paginationPreviousAria') })).toBeVisible();
  await expect(data.getByRole('link', { name: ds(en, 'paginationNextAria') })).toBeVisible();
  await expect(data.getByRole('navigation', { name: ds(en, 'breadcrumbNavAria') })).toBeVisible();
  const feedback = page.locator('#feedback');
  await expect(feedback.getByRole('progressbar', { name: ds(en, 'progressLabel') })).toHaveCount(3);
  await expect(feedback.locator('[data-slot="skeleton"]')).toHaveCount(2);
  await expect(feedback.getByRole('status', { name: ds(en, 'spinnerLabel') })).toBeVisible();
  const brand = page.locator('#brand');
  for (const [alt, count] of [
    ['logoLockup', 1],
    ['logoMark', 1],
    ['logoWhite', 2],
  ] as const)
    await expect(brand.getByRole('img', { name: ds(en, alt), exact: true })).toHaveCount(count);
  await expect(brand.locator('[data-slot="eyebrow"]')).toHaveCount(2);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('DS interactions: overlays, segmented, tag, alert, tabs all work', async ({ page }) => {
  const errors = watchErrors(page);
  const en = catalogs.en;
  await page.goto('/design-system');

  // Dialog opens on trigger; closes via cancel, the X close button, and confirm.
  const dialogTrigger = page.getByRole('button', { name: ds(en, 'dialogTrigger'), exact: true });
  const dialog = page.getByRole('dialog', { name: ds(en, 'dialogTitle') });
  for (const key of ['dialogCancel', 'dialogCloseLabel', 'dialogConfirm'] as const) {
    await dialogTrigger.click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: ds(en, key), exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  // Dropdown opens; clicking an item closes it.
  await page.getByRole('button', { name: ds(en, 'dropdownTrigger'), exact: true }).click();
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await menu.getByRole('menuitem', { name: ds(en, 'dropdownEdit'), exact: true }).click();
  await expect(menu).toBeHidden();
  // Tooltip appears on hover AND on keyboard focus (:focus-visible-gated; popup has no ARIA role).
  const tooltipTrigger = page.getByRole('button', { name: ds(en, 'tooltipTrigger'), exact: true });
  const tooltip = page.getByText(ds(en, 'tooltipContent'), { exact: true });
  await tooltipTrigger.hover();
  await expect(tooltip).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(tooltip).toBeHidden();
  // Tab from the previous trigger: keyboard modality makes the focus :focus-visible.
  await page.getByRole('button', { name: ds(en, 'dropdownTrigger'), exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(tooltipTrigger).toBeFocused();
  await expect(tooltip).toBeVisible();
  // Popover opens with title and copy button.
  await page.getByRole('button', { name: ds(en, 'popoverTrigger'), exact: true }).click();
  await expect(page.getByText(ds(en, 'popoverTitle'), { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: ds(en, 'popoverCopy'), exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  // Sheet opens on trigger; closes via its translated X close button.
  await page.getByRole('button', { name: ds(en, 'sheetTrigger'), exact: true }).click();
  const sheet = page.getByRole('dialog', { name: ds(en, 'sheetTitle') });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText(ds(en, 'sheetBody'), { exact: true })).toBeVisible();
  await sheet.getByRole('button', { name: ds(en, 'dialogCloseLabel'), exact: true }).click();
  await expect(sheet).toBeHidden();
  // Segmented control: clicking Month presses it and un-presses Week.
  const segmented = page.locator('[data-slot="segmented-control"]');
  const week = segmented.getByRole('button', { name: ds(en, 'segmentedWeek'), exact: true });
  const month = segmented.getByRole('button', { name: ds(en, 'segmentedMonth'), exact: true });
  await expect(week).toHaveAttribute('aria-pressed', 'true');
  await month.click();
  await expect(month).toHaveAttribute('aria-pressed', 'true');
  await expect(week).toHaveAttribute('aria-pressed', 'false');
  // Tag remove removes the tag; alert dismiss hides the alert.
  const tagRemove = icu(ds(en, 'tagRemove'), { label: ds(en, 'tagGrade') });
  await page.getByRole('button', { name: tagRemove, exact: true }).click();
  await expect(page.locator('[data-slot="tag"]')).toHaveCount(1);
  const alerts = page.locator('#alerts');
  await alerts.getByRole('button', { name: ds(en, 'alertDismiss'), exact: true }).click();
  await expect(alerts.getByRole('alert')).toHaveCount(3);
  await expect(alerts.getByText(ds(en, 'alertWarningTitle'), { exact: true })).toBeHidden();
  // Tabs switch panels (scoped: the accordion below re-uses the same panel copy).
  const tabs = page.locator('[data-slot="tabs"]');
  await tabs.getByRole('tab', { name: ds(en, 'tabsQuestions'), exact: true }).click();
  await expect(tabs.getByText(ds(en, 'tabsQuestionsPanel'), { exact: true })).toBeVisible();
  await expect(tabs.getByText(ds(en, 'tabsOverviewPanel'), { exact: true })).toBeHidden();
  expect(errors, errors.join('\n')).toEqual([]);
});

test('DS-PROPS: ds-probe Button merges custom className with variant styling', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/design-system');
  const probe = page.locator('.ds-probe');
  await expect(probe).toBeVisible();
  await expect(probe).toHaveClass(/ds-probe/);
  const backgroundColor = await probe.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)'); // variant classes merged, not overridden
  expect(backgroundColor).not.toBe('transparent');
  expect(errors, errors.join('\n')).toEqual([]);
});

test('LOCALE-TOGGLE: footer switcher en→de→en updates content without reload', async ({ page }) => {
  const errors = watchErrors(page);
  const { en, de } = catalogs;
  await page.goto('/');
  await page.evaluate(() => {
    (window as unknown as Record<string, unknown>).__noReload = 1;
  });
  const url = page.url();
  const footer = page.getByRole('contentinfo');
  const h1 = page.locator('h1');
  await footer
    .getByRole('combobox', { name: cat(en, 'LocaleSwitcher.label'), exact: true })
    .click();
  await page.getByRole('option', { name: 'Deutsch' }).click();
  for (const line of heroTitleLines(de)) await expect(h1).toContainText(line);
  await expect(page.getByText(home(de, 'features.title'), { exact: true }).first()).toBeVisible();
  await expect(footer.getByText(home(de, 'footer.tagline'), { exact: true })).toBeVisible();
  expect(page.url()).toBe(url); // cookie + router.refresh, no navigation
  expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).__noReload)).toBe(
    1,
  );
  await footer
    .getByRole('combobox', { name: cat(de, 'LocaleSwitcher.label'), exact: true })
    .click();
  await page.getByRole('option', { name: 'English' }).click();
  for (const line of heroTitleLines(en)) await expect(h1).toContainText(line);
  await expect(footer.getByText(home(en, 'footer.tagline'), { exact: true })).toBeVisible();
  expect(errors, errors.join('\n')).toEqual([]);
});
