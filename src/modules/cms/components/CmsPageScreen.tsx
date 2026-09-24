import { getTranslations } from 'next-intl/server';

import { Container } from '@/modules/design-system';
import { CmsBreadcrumb } from '@/modules/cms/components/CmsBreadcrumb';
import { CmsPageMeta } from '@/modules/cms/components/CmsPageMeta';
import { CmsPublicShell } from '@/modules/cms/components/CmsPublicShell';
import { CmsSections } from '@/modules/cms/components/CmsSections';
import { CmsTableOfContents } from '@/modules/cms/components/CmsTableOfContents';
import { ARTICLES_PATH } from '@/modules/cms/constants/cms.constants';
import { buildCmsJsonLd } from '@/modules/cms/lib/cms-json-ld';
import { cmsPagePath } from '@/modules/cms/lib/cms-paths';
import { buildToc } from '@/modules/cms/lib/cms-text';
import type { CmsPageScreenProps } from '@/modules/cms/types/components.types';
import { JsonLd } from '@/modules/seo';

// One CMS page (legal, info or article): every word of the body comes from
// Strapi; only the chrome labels are translated here.
async function CmsPageScreen({ resolved }: CmsPageScreenProps) {
  const { page, requestedLocale: locale, isFallback } = resolved;
  const t = await getTranslations();
  const crumbs = [
    { label: t('Navigation.home'), href: '/' },
    ...(page.pageType === 'article' ? [{ label: t('Navigation.articles'), href: ARTICLES_PATH }] : []),
    { label: page.title, href: cmsPagePath(page) },
  ];
  const graph = buildCmsJsonLd({ page, locale, siteDescription: t('Seo.siteDescription'), crumbs });
  const toc = page.showTableOfContents ? buildToc(page.sections) : [];

  return (
    <CmsPublicShell locale={locale}>
      <JsonLd data={graph} />
      <CmsBreadcrumb
        label={t('Navigation.breadcrumbLabel')}
        items={crumbs.map((crumb, index) => (index === crumbs.length - 1 ? { label: crumb.label } : crumb))}
      />
      <main id="main-content" tabIndex={-1}>
        <Container className="max-w-3xl pt-4 pb-16">
          <article data-page-type={page.pageType} data-cms-slug={page.slug}>
            <header className="border-b border-border pb-6">
              <h1 className="text-h2 font-semibold text-foreground">{page.title}</h1>
              {page.summary ? (
                <p className="mt-3 text-body-lg leading-relaxed text-body">{page.summary}</p>
              ) : null}
              <CmsPageMeta page={page} locale={locale} />
              {isFallback ? (
                <p role="note" className="mt-4 rounded-card bg-surface-inset p-3 text-body-sm text-body">
                  {t('Cms.fallbackNotice')}
                </p>
              ) : null}
            </header>
            <CmsTableOfContents entries={toc} title={t('Legal.contents')} label={t('Legal.contentsLabel')} />
            <div className="mt-10">
              <CmsSections sections={page.sections} />
            </div>
          </article>
        </Container>
      </main>
    </CmsPublicShell>
  );
}

export { CmsPageScreen };
