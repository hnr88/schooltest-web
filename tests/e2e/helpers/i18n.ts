import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, type Page } from '@playwright/test';

export type Locale = 'en' | 'zh';
export type Messages = Record<string, string>;

function flatten(node: Record<string, unknown>, prefix: string, out: Messages): Messages {
  for (const [key, value] of Object.entries(node)) {
    const fullKey = prefix === '' ? key : `${prefix}.${key}`;
    if (typeof value === 'string') {
      out[fullKey] = value;
    } else {
      flatten(value as Record<string, unknown>, fullKey, out);
    }
  }
  return out;
}

/** Loads and flattens a locale catalog to dot keys (e.g. "Home.hero.subtitle"). */
export function loadMessages(locale: Locale): Messages {
  const file = path.resolve(process.cwd(), 'src/i18n/messages', `${locale}.json`);
  const raw = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  return flatten(raw, '', {});
}

/** Reads a Home-namespace value; throws on a missing key so typos fail loud. */
export function home(messages: Messages, key: string): string {
  const value = messages[`Home.${key}`];
  if (value === undefined) {
    throw new Error(`Missing catalog key: Home.${key}`);
  }
  return value;
}

export function homeAll(messages: Messages, keys: readonly string[]): string[] {
  return keys.map((key) => home(messages, key));
}

/** Reads any flattened catalog value by full key; throws on a missing key. */
export function cat(messages: Messages, fullKey: string): string {
  const value = messages[fullKey];
  if (value === undefined) {
    throw new Error(`Missing catalog key: ${fullKey}`);
  }
  return value;
}

/** Reads a DesignSystem-namespace value; throws on a missing key so typos fail loud. */
export function ds(messages: Messages, key: string): string {
  return cat(messages, `DesignSystem.${key}`);
}

/** Fills ICU {placeholders} in a catalog template (e.g. tagRemove "Remove tag {label}"). */
export function icu(template: string, params: Record<string, string>): string {
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template,
  );
}

/** Catalog values rendered via t.rich carry markup tags; strip them for text queries. */
export function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, '');
}

/** hero.title renders as two lines split on the catalog's <br></br> marker. */
export function heroTitleLines(messages: Messages): string[] {
  return home(messages, 'hero.title').split('<br></br>');
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Asserts each catalog string is rendered; .first() keeps repeated CTAs strict-safe. */
export async function expectVisibleTexts(page: Page, texts: readonly string[]): Promise<void> {
  for (const text of texts) {
    await expect(page.getByText(text, { exact: true }).first(), text).toBeVisible();
  }
}

/** Asserts a catalog string appears nowhere on the page (locale leak check). */
export async function expectAbsentTexts(page: Page, texts: readonly string[]): Promise<void> {
  for (const text of texts) {
    await expect(page.getByText(text, { exact: true }), text).toHaveCount(0);
  }
}

/**
 * Clicks every FAQ trigger and asserts its answer is visible. The first item is
 * open by default, so toggling it closes it — click it once more to re-open.
 */
export async function assertFaqAnswers(
  page: Page,
  messages: Messages,
  pairs: readonly (readonly [string, string])[],
): Promise<void> {
  for (const [questionKey, answerKey] of pairs) {
    const trigger = page.getByRole('button', { name: home(messages, questionKey), exact: true });
    const wasOpen = (await trigger.getAttribute('aria-expanded')) === 'true';
    await trigger.click();
    if (wasOpen) {
      await trigger.click();
    }
    const answer = home(messages, answerKey);
    await expect(page.getByText(answer, { exact: true }), answer).toBeVisible();
  }
}

/** Every static landing string as Home-namespace keys — the EN spec asserts them all. */
export const LANDING_TEXT_KEYS = [
  'announcement.message',
  'nav.product',
  'nav.schools',
  'nav.resources',
  'nav.signIn',
  'hero.badge',
  'hero.subtitle',
  'hero.microcopy',
  'flow.stepOne',
  'flow.stepTwo',
  'flow.stepThree',
  'trustedBy.label',
  'trustedBy.one',
  'trustedBy.two',
  'trustedBy.three',
  'trustedBy.four',
  'trustedBy.five',
  'features.eyebrow',
  'features.title',
  'features.questionTypes.title',
  'features.questionTypes.description',
  'features.aiGrading.title',
  'features.aiGrading.description',
  'features.analytics.title',
  'features.analytics.description',
  'featureDetail.eyebrow',
  'featureDetail.title',
  'featureDetail.description',
  'featureDetail.checkOne',
  'featureDetail.checkTwo',
  'featureDetail.checkThree',
  'featureDetail.card.title',
  'featureDetail.card.badge',
  'featureDetail.card.grammar',
  'featureDetail.card.vocabulary',
  'featureDetail.card.coherence',
  'featureDetail.card.scoreGrammar',
  'featureDetail.card.scoreVocabulary',
  'featureDetail.card.scoreCoherence',
  'stats.deliveredValue',
  'stats.deliveredLabel',
  'stats.accuracyValue',
  'stats.accuracyLabel',
  'stats.savedValue',
  'stats.savedLabel',
  'howItWorks.eyebrow',
  'howItWorks.stepOneTitle',
  'howItWorks.stepOneDescription',
  'howItWorks.stepTwoTitle',
  'howItWorks.stepTwoDescription',
  'howItWorks.stepThreeTitle',
  'howItWorks.stepThreeDescription',
  'testimonial.quote',
  'testimonial.name',
  'testimonial.role',
  'pricing.eyebrow',
  'pricing.title',
  'pricing.perMonth',
  'pricing.perTeacherMonth',
  'pricing.freeName',
  'pricing.freePrice',
  'pricing.freeCta',
  'pricing.freeFeatureStudents',
  'pricing.freeFeatureTests',
  'pricing.freeFeatureAi',
  'pricing.proName',
  'pricing.proBadge',
  'pricing.proPrice',
  'pricing.proCta',
  'pricing.proFeatureOne',
  'pricing.proFeatureTwo',
  'pricing.proFeatureThree',
  'pricing.schoolName',
  'pricing.schoolPrice',
  'pricing.schoolCta',
  'pricing.schoolFeatureOne',
  'pricing.schoolFeatureTwo',
  'pricing.schoolFeatureThree',
  'faq.title',
  'faq.accountsQuestion',
  'faq.aiGradingQuestion',
  'faq.importQuestion',
  'faq.pteQuestion',
  'cta.title',
  'cta.subtitle',
  'cta.primary',
  'cta.secondary',
  'footer.tagline',
  'footer.productTitle',
  'footer.productBuilder',
  'footer.productFeedback',
  'footer.productAnalytics',
  'footer.productPricing',
  'footer.schoolsTitle',
  'footer.schoolsDistricts',
  'footer.schoolsLanguageCenters',
  'footer.schoolsUniversities',
  'footer.schoolsCaseStudies',
  'footer.companyTitle',
  'footer.companyAbout',
  'footer.companyBlog',
  'footer.companyCareers',
  'footer.companyContact',
  'footer.privacy',
  'footer.terms',
  'footer.security',
  'footer.copyright',
  'footer.status',
] as const;

/** DE spot-checks — at least one key from every landing section. */
export const DE_SPOT_KEYS = [
  'announcement.message',
  'hero.badge',
  'hero.subtitle',
  'hero.microcopy',
  'flow.stepOne',
  'flow.stepThree',
  'trustedBy.label',
  'features.eyebrow',
  'features.title',
  'features.aiGrading.title',
  'features.analytics.description',
  'featureDetail.title',
  'featureDetail.checkTwo',
  'featureDetail.card.title',
  'featureDetail.card.scoreVocabulary',
  'stats.deliveredValue',
  'stats.deliveredLabel',
  'stats.accuracyLabel',
  'stats.savedLabel',
  'howItWorks.eyebrow',
  'howItWorks.stepTwoTitle',
  'testimonial.quote',
  'testimonial.role',
  'pricing.title',
  'pricing.proBadge',
  'pricing.proFeatureTwo',
  'pricing.schoolCta',
  'faq.title',
  'cta.title',
  'cta.subtitle',
  'footer.tagline',
  'footer.schoolsTitle',
  'footer.copyright',
  'footer.status',
] as const;

/** FAQ trigger/answer key pairs (the first item is open by default). */
export const FAQ_PAIRS = [
  ['faq.accountsQuestion', 'faq.accountsAnswer'],
  ['faq.aiGradingQuestion', 'faq.aiGradingAnswer'],
  ['faq.importQuestion', 'faq.importAnswer'],
  ['faq.pteQuestion', 'faq.pteAnswer'],
] as const;

/** Keys whose values differ strongly between locales — used for the leak checks. */
export const LEAK_KEYS = [
  'hero.subtitle',
  'pricing.proFeatureTwo',
  'footer.tagline',
  'cta.title',
] as const;
