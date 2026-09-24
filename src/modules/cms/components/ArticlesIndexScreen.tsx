import { getFormatter, getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { Container } from '@/modules/design-system';
import { ArticleCard } from '@/modules/cms/components/ArticleCard';
import { CmsBreadcrumb } from '@/modules/cms/components/CmsBreadcrumb';
import { CmsPublicShell } from '@/modules/cms/components/CmsPublicShell';
import { ARTICLES_FEED_PATH, ARTICLES_PATH } from '@/modules/cms/constants/cms.constants';
import type { ArticlesIndexScreenProps } from '@/modules/cms/types/components.types';

const DATE = { year: 'numeric', month: 'long', day: 'numeric' } as const;

// /articles — published CMS pages of type `article`, newest first, paginated
// with ?page=N (the park blog index pattern).
async function ArticlesIndexScreen({ locale, list }: ArticlesIndexScreenProps) {
  const t = await getTranslations();
  const format = await getFormatter({ locale });
  const pageHref = (page: number) => (page <= 1 ? ARTICLES_PATH : `${ARTICLES_PATH}?page=${page}`);

  return (
    <CmsPublicShell locale={locale}>
      <CmsBreadcrumb
        label={t('Navigation.breadcrumbLabel')}
        items={[{ label: t('Navigation.home'), href: '/' }, { label: t('Cms.articlesTitle') }]}
      />
      <main id="main-content" tabIndex={-1}>
        <Container className="max-w-5xl pt-4 pb-16">
          <header className="border-b border-border pb-6">
            <h1 className="text-h2 font-semibold text-foreground">{t('Cms.articlesTitle')}</h1>
            <p className="mt-3 text-body-lg leading-relaxed text-body">{t('Cms.articlesDescription')}</p>
            <a href={ARTICLES_FEED_PATH} className="mt-3 inline-block text-body-sm text-primary underline">
              {t('Cms.rssFeed')}
            </a>
          </header>
          {list.items.length === 0 ? (
            <p className="mt-10 text-body-md text-body">{t('Cms.articlesEmpty')}</p>
          ) : (
            <ul className="mt-10 grid list-none grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="articles-list">
              {list.items.map((article) => {
                const date = article.publishedDate ?? article.publishedAt;
                return (
                  <li key={article.documentId}>
                    <ArticleCard article={article} dateLabel={date ? format.dateTime(new Date(date), DATE) : null} />
                  </li>
                );
              })}
            </ul>
          )}
          {list.pageCount > 1 ? (
            <nav aria-label={t('Cms.paginationLabel')} className="mt-10 flex items-center gap-4 text-body-sm">
              {list.page > 1 ? <Link href={pageHref(list.page - 1)}>{t('Cms.previousPage')}</Link> : null}
              <span>{t('Cms.pageOf', { page: list.page, pageCount: list.pageCount })}</span>
              {list.page < list.pageCount ? <Link href={pageHref(list.page + 1)}>{t('Cms.nextPage')}</Link> : null}
            </nav>
          ) : null}
        </Container>
      </main>
    </CmsPublicShell>
  );
}

export { ArticlesIndexScreen };
