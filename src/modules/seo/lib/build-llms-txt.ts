import { getTranslations } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { PUBLIC_ROUTES, isDisallowed } from '@/modules/seo/constants/public-routes';
import { absoluteUrl } from '@/modules/seo/lib/breadcrumb-json-ld';
import { SITE_NAME } from '@/modules/seo/constants/seo.constants';
import type { BuildLlmsTxtInput } from '@/modules/seo/types/seo.types';

/**
 * C-WEB-02 — the llms.txt body. Built from the shared public-route registry and
 * the live legal index, so it lists exactly what the sitemap lists and nothing
 * a crawler is disallowed from.
 */
export async function buildLlmsTxt({ locale, legal }: BuildLlmsTxtInput): Promise<string> {
  const t = await getTranslations({ locale });
  const url = (path: string) => absoluteUrl(path, locale, routing.defaultLocale);

  const lines: string[] = [
    `# ${SITE_NAME}`,
    '',
    `> ${t('Eald.footer.tagline')}`,
    '',
    t('Seo.llmsIntro'),
    '',
    `## ${t('Seo.llmsPages')}`,
    '',
  ];

  for (const route of PUBLIC_ROUTES.filter((r) => !isDisallowed(r.pathname))) {
    lines.push(`- [${t(route.llmsLabelKey)}](${url(route.pathname)})`);
  }

  lines.push('', `## ${t('Seo.llmsLegal')}`, '');
  for (const document of legal) {
    const suffix = document.summary ? `: ${document.summary}` : '';
    lines.push(`- [${document.title}](${url(document.path)})${suffix}`);
  }

  lines.push(
    '',
    `## ${t('Seo.llmsNotes')}`,
    '',
    `- ${t('Seo.llmsNoteLocales', { locales: routing.locales.join(', ') })}`,
    `- ${t('Seo.llmsNotePrivate')}`,
    `- ${t('Seo.llmsNoteSitemap', { url: url('/sitemap.xml') })}`,
    '',
  );

  return lines.join('\n');
}
