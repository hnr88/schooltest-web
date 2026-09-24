import { getTranslations } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { absoluteUrl } from '@/modules/seo/lib/breadcrumb-json-ld';
import { LLMS_FULL_TXT_PATH, LLMS_OPTIONAL_HEADING, SITE_NAME } from '@/modules/seo/constants/seo.constants';
import type { BuildLlmsTxtInput } from '@/modules/seo/types/seo.types';
import type { LlmsHeader, PublicEntry } from '@/modules/seo/types/metadata.types';

const SECTION_ORDER: readonly PublicEntry['section'][] = ['pages', 'articles', 'legal'];
const SECTION_KEYS = { pages: 'llmsPages', articles: 'llmsArticles', legal: 'llmsLegal' } as const;

async function header(locale: string): Promise<LlmsHeader> {
  const t = await getTranslations({ locale, namespace: 'Seo' });
  const url = (path: string) => absoluteUrl(path, locale, routing.defaultLocale);
  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${t('siteDescription')}`,
    '',
    t('llmsIntro'),
    '',
    `- ${t('llmsNoteLocales', { locales: routing.locales.join(', ') })}`,
    `- ${t('llmsNotePrivate')}`,
    '',
  ];
  return { lines, url, t };
}

/**
 * llms.txt per llmstxt.org: H1 name, blockquote summary, prose details, then
 * H2 sections of `- [title](url): description` links — one per public page,
 * article and legal document — and an `Optional` section. Built from the same
 * public surface as the sitemap, so the two can never disagree.
 */
export async function buildLlmsTxt({ locale, entries }: BuildLlmsTxtInput): Promise<string> {
  const { lines, url, t } = await header(locale);

  for (const section of SECTION_ORDER) {
    const items = entries.filter((entry) => entry.section === section);
    if (items.length === 0) continue;
    lines.push(`## ${t(SECTION_KEYS[section])}`, '');
    for (const entry of items) {
      lines.push(`- [${entry.title}](${url(entry.pathname)}): ${entry.description}`);
    }
    lines.push('');
  }

  lines.push(
    `## ${LLMS_OPTIONAL_HEADING}`,
    '',
    `- [${t('llmsFullLabel')}](${url(LLMS_FULL_TXT_PATH)}): ${t('llmsFullDescription')}`,
    `- [${t('llmsSitemapLabel')}](${url('/sitemap.xml')}): ${t('llmsNoteSitemap', { url: url('/sitemap.xml') })}`,
    '',
  );
  return lines.join('\n');
}

/**
 * llms-full.txt: the same header, then every public entry in full — title,
 * canonical URL, last-updated date, description and, where the source has
 * one, the complete body text — so an assistant can answer from one fetch.
 */
export async function buildLlmsFullTxt({ locale, entries }: BuildLlmsTxtInput): Promise<string> {
  const { lines, url, t } = await header(locale);

  for (const section of SECTION_ORDER) {
    for (const entry of entries.filter((item) => item.section === section)) {
      lines.push(
        `## ${entry.title}`,
        '',
        `${t('llmsUrlLabel')}: ${url(entry.pathname)}`,
        `${t('llmsUpdatedLabel')}: ${entry.lastModified.slice(0, 10)}`,
        '',
        entry.description,
        '',
      );
      if (entry.body) lines.push(entry.body, '');
    }
  }
  return lines.join('\n');
}
